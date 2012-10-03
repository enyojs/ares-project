enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	handlers: {
		onSelect: "newSelect",
		onDeselect: "newDeselect",
	},
	components: [
	    {name: "provideList", kind: "ProviderList", onSelectProvider: "selectProvider"},
		{kind: "HermesFileTree", fit: true, onFileClick: "selectFile", onFolderClick: "selectFolder", 
			onNewFileConfirm: "newFileConfirm", onNewFolderConfirm: "newFolderConfirm", 
			onRenameConfirm: "renameConfirm", onDeleteConfirm: "deleteConfirm",
			onCopyFileConfirm: "copyFileConfirm"}
	],
	providerListNeeded: true,
	create: function() {
		this.inherited(arguments);
		// TODO provider list should probably go out of Harmonia
		if (this.providerListNeeded === false) {
			this.$.provideList.setShowing(false);
		}
	},
	selectProvider: function(inSender, inData) {
		console.dir(inData);
		if (inData.service) {
			this.$.hermesFileTree.initialize(inData.service);
			this.$.hermesFileTree.reset();
		}
	},
	//TODO: How much of the file manipulation code lives here, vs. in HermesFileTree?
	selectFile: function(inSender, inEvent) {
		console.log("Selected file: "+inEvent.file.path);
		console.dir(inEvent.file);
	},
	selectFolder: function(inSender, inEvent) {
		console.log("Selected folder: "+inEvent.file.path);
		console.dir(inEvent.file);
	},
	newSelect: function(inSender, inEvent) {
		if (inSender.name !== "providerList") {
			this.selectedFile=inEvent.file;
		}
	},
	newDeselect: function(inSender, inEvent) {
		this.selectedFile=inEvent.file;
	},
	// File Operations
	newFileConfirm: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inEvent.fileName;
		var nameStem = name.substring(0, name.lastIndexOf("."));
		var type = name.substring(name.lastIndexOf(".")+1);
		var templatePath;
		var location = window.location.toString();
		var prefix = location.substring(0, location.lastIndexOf("/")+1);
		if (name == "package.js") {
			templatePath = prefix+"../templates/package.js";
		} else {
			templatePath = prefix+"../templates/template."+type;
		}
		var options = {
			url: templatePath,
			cacheBust: false,
			handleAs: "text",
		};
		var replacements = {
			"$NAME": nameStem,
			"$YEAR": new Date().getFullYear()
		};
		var r = new enyo.Ajax(options);
		r.response(this, function(inSender, inResponse) {
			//this..log("response: "+inResponse.toString());
			for (var n in replacements) {
				inResponse = inResponse.replace(n, replacements[n]);
			}
			this.createFile(name, folderId, inResponse);
		});
		r.error(this, function(inSender, error) {
			console.log("error: "+error.toString());
			this.createFile(name, folderId, null);
		});
		r.go();
	},
	createFile: function(name, folderId, content) {
		this.log("Creating new file "+name+" into folderId="+folderId);
		var service = this.selectedFile.service;
		service.createFile(folderId, name, content)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(this.$.hermesFileTree);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},	
	newFolderConfirm: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inEvent.fileName;
		var service = this.selectedFile.service;
		this.log("Creating new folder "+name+" into folderId="+folderId);
		service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(this.$.hermesFileTree);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	renameConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var newName = inEvent.fileName;
		var service = this.selectedFile.service;
		this.log("Renaming file " + oldId + " as " + newName + " at " + path);
		service['rename'](oldId, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(this.$.hermesFileTree);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Renaming file "+oldId+" as " + newName +" failed:" + inError);
			});
	},
	deleteConfirm: function(inSender, inEvent) {
		console.dir(inEvent);
		var nodeId = inEvent.nodeId;
		console.dir(this.selectFile);
		var oldId = this.selectedFile.id;
		var oldPath = this.selectedFile.path;
		var method = this.selectedFile.isDir ? "deleteFolder" : "deleteFile";
		var service = this.selectedFile.service;
		this.log("Deleting " + this.selectedFile.path);
		service.remove(inEvent.nodeId)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(this.$.hermesFileTree);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Deleting file "+oldPath+" failed:" + inError);
			});
	},
	copyFileConfirm: function(inSender, inEvent) {
		console.log("copyFileConfirm: inEvent=");
		console.dir(inEvent);
		var oldName = this.selectedFile.name;
		var newName = inEvent.fileName;
		var service = this.selectedFile.service;
		this.log("Creating new file " + newName + " as copy of" + this.selectedFile.name);
		service.copy(this.selectedFile.id, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(this.$.hermesFileTree);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+newName+" as copy of" + this.selectedFile.name +" failed:" + inError);
			});
	},


});
