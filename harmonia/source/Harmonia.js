enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	handlers: {
		onSelect: "newSelect",
		onDeselect: "newDeselect"
	},
	components: [
	    {name: "providerList", kind: "ProviderList", onSelectProvider: "handleSelectProvider"},
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
			this.$.providerList.setShowing(false);
		}
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (inEvent.service) {
			this.$.hermesFileTree.setConfig({
				fs: inEvent.service
			});
		}
		this.$.hermesFileTree.fileOps2Hide(true);
		return true; //Stop event propagation
	},
	setProject: function(project) {
		this.log(project);
		var config = project && {
			fs: project.service,
			nodeName: project.name,
			folderId: project.folderId
		};
		this.$.hermesFileTree.setConfig(config);
		if (project !== null) {
			this.$.hermesFileTree.fileOps2Show();		
		} else {
			this.$.hermesFileTree.fileOps2Hide(true);
		}
	},
	//TODO: How much of the file manipulation code lives here, vs. in HermesFileTree?
	selectFile: function(inSender, inEvent) {
		this.log(inEvent.file);
	},
	selectFolder: function(inSender, inEvent) {
		this.log(inEvent.file);
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
		var name = inEvent.fileName.trim();
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
			this.error(error);
			this.createFile(name, folderId, null);
		});
		r.go();
	},
    delayedRefresh: function() {
		var onDone = new enyo.Async() ;
		onDone.response(this, function(inSender, inResponse) {
			this.log("delayed refresh after " + inResponse ) ;
			this.$.hermesFileTree.refreshFileTree();
		}) ;
		return onDone ;
	},
	createFile: function(name, folderId, content) {
		this.log("Creating new file "+name+" into folderId="+folderId);
		var service = this.selectedFile.service;
		service.createFile(folderId, name, content)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.delayedRefresh().go("file creation done") ;
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},	
	newFolderConfirm: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inEvent.fileName.trim();
		var service = this.selectedFile.service;
		this.log("Creating new folder "+name+" into folderId="+folderId);
		service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.delayedRefresh().go("folder creation done") ;
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	renameConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var newName = inEvent.fileName.trim();
		var service = this.selectedFile.service;
		this.log("Renaming file " + oldId + " as " + newName + " at " + path);
		service['rename'](oldId, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.delayedRefresh().go("rename done") ;
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Renaming file "+oldId+" as " + newName +" failed:" + inError);
			});
	},
	deleteConfirm: function(inSender, inEvent) {
		this.log(inEvent);
		var nodeId = inEvent.nodeId;
		this.log(this.selectFile);
		var oldId = this.selectedFile.id;
		var oldPath = this.selectedFile.path;
		var method = this.selectedFile.isDir ? "deleteFolder" : "deleteFile";
		var service = this.selectedFile.service;
		service.remove(inEvent.nodeId)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.delayedRefresh().go("delete done") ;
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Deleting file "+oldPath+" failed:" + inError);
			});
	},
	copyFileConfirm: function(inSender, inEvent) {
		this.log(inEvent);
		var oldName = this.selectedFile.name;
		var newName = inEvent.fileName.trim();
		var service = this.selectedFile.service;
		this.log("Creating new file " + newName + " as copy of" + this.selectedFile.name);
		service.copy(this.selectedFile.id, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.delayedRefresh().go("copy done") ;
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+newName+" as copy of" + this.selectedFile.name +" failed:" + inError);
			});
	}
});
