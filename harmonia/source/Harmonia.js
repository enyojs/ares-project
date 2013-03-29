enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	handlers: {
		onSelect: "newSelect",
		onDeselect: "newDeselect"
	},
	components: [
		{name: "providerList", kind: "ProviderList", type: "filesystem", onSelectProvider: "handleSelectProvider"},
		{kind: "HermesFileTree", fit: true, onFileClick: "selectFile", onFolderClick: "selectFolder", 
			onNewFileConfirm: "newFileConfirm", onNewFolderConfirm: "newFolderConfirm", 
			onRenameConfirm: "renameConfirm", onDeleteConfirm: "deleteConfirm",
			onCopyFileConfirm: "copyFileConfirm"}
	],
	providerListNeeded: true,
	service: null,

	debug: false,
	create: function() {
		this.inherited(arguments);
		// TODO provider list should probably go out of Harmonia
		if (this.providerListNeeded === false) {
			this.$.providerList.setShowing(false);
		}
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (inEvent.service) {
			this.service = inEvent.service ;
			this.$.hermesFileTree.connectService(inEvent.service);
		}
		this.$.hermesFileTree.hideFileOpButtons();
		return true; //Stop event propagation
	},
	setProject: function(project) {
		if (this.debug) this.log("project:", project);
		if (project !== null) {
			this.$.hermesFileTree.setConfig(project).showFileOpButtons();
			this.service = project.getService();
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
		}
	},
	//TODO: How much of the file manipulation code lives here, vs. in HermesFileTree?
	selectFile: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent.file);
	},
	selectFolder: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent.file);
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
			handleAs: "text"
		};
		var replacements = {
			"$NAME": nameStem,
			"$YEAR": new Date().getFullYear()
		};
		// retrieve template from server
		var r = new enyo.Ajax(options);
		r.response(this, function(inSender, inResponse) {
			if (this.debug) this.log("response: "+inResponse.toString());
			for (var n in replacements) {
				inResponse = inResponse.replace(n, replacements[n]);
			}
			this.createFile(name, folderId, inResponse);
		});
		r.error(this, function(inSender, error) {
			if (error === 404){
				this.createFile(name, folderId);
				this.$.hermesFileTree.showErrorPopup("No template found for '." + type + "' files.  Created an empty one.");
			}
			else {
				this.error("error while fetching " + templatePath + ': ' + error);
			}
		});
		r.go();
	},
	delayedRefresh: function(msg, forceSelect) {
		var onDone = new enyo.Async() ;
		onDone.response(this, function(inSender, toSelectId) {
			var select = forceSelect || toSelectId ;
			if (this.debug) this.log("delayed refresh after " + msg + ' on ' + forceSelect) ;
			this.$.hermesFileTree.refreshFileTree(null, forceSelect);
		}) ;
		return onDone ;
	},
	createFile: function(name, folderId, content) {
		if (this.debug) this.log("Creating new file "+name+" into folderId="+folderId);
		this.service.createFile(folderId, name, content)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("createFile response: ",inResponse);
				this.packageAdd(
					folderId, name,
					function () {
						// passing the id from response will make hermeFileTree select the new file
						this.delayedRefresh("file creation done", inResponse[0].id).go(inResponse) ;
					}.bind(this)
				) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},
	newFolderConfirm: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inEvent.fileName.trim();
		if (this.debug) this.log("Creating new folder "+name+" into folderId="+folderId);
		this.service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("folder creation done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	renameConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var newName = inEvent.fileName.trim();
		if (this.debug) this.log("Renaming file " + oldId + " as " + newName + " at " + path);
		this.service.rename(oldId, newName)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("rename done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Renaming file "+oldId+" as " + newName +" failed:" + inError);
			});
	},
	deleteConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		var nodeId = inEvent.nodeId;
		if (this.debug) this.log(this.selectedFile);
		var oldId = this.selectedFile.id;
		var name = this.selectedFile.name ;
		var oldPath = this.selectedFile.path;
		var method = this.selectedFile.isDir ? "deleteFolder" : "deleteFile";
		var upperDir = this.$.hermesFileTree.getParentOfSelected() ;
		if (this.debug) this.log(method + ' ' + name + " in folder " + upperDir.name);
		this.service.remove(inEvent.nodeId)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.packageRemove(
					upperDir.id, name,
					function () {this.delayedRefresh("delete done").go() ;}.bind(this)
				);
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Deleting file "+oldPath+" failed:" + inError);
			});
	},
	copyFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		var oldName = this.selectedFile.name;
		var newName = inEvent.fileName.trim();
		if (this.debug) this.log("Creating new file " + newName + " as copy of" + this.selectedFile.name);
		this.service.copy(this.selectedFile.id, newName)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("copy done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating file "+newName+" as copy of" + this.selectedFile.name +" failed:" + inError);
			});
	},

	// package.js munging section
	packageAdd: function (folderId, name, callback)  {
		this.packageOp(folderId, name, this.packageAppend.bind(this, name), callback);
	},

	packageRemove: function (folderId, name, callback)  {
		this.packageOp(folderId, name, this.packageChop.bind(this, name), callback);
	},

	packageOp: function (folderId, name, op, callback)  {
		if ( ! name.match(RegExp(/\.(js|css)$/) ) ) {
			return ; // skip non js non css files.
		}

		// need to read package.js from same dir
		var hft = this.$.hermesFileTree;
		var selectedDirNode = hft.selectedNode ; // FIXME: not good when removing a file
		var pkgNode = selectedDirNode.getNodeNamed('package.js') ;

		if (! pkgNode ) {
			return ; // skip operation when no package.js is found
		}

		var pkgId =  pkgNode.file.id ;

		async.waterfall(
			[
				this.packageRead.bind(this, pkgId),
				op,
				this.packageSave.bind(this, pkgId),
				callback
			],
			function (err) {
				that.log("package add done, err is",err);
			}
		) ;
	},

	packageRead: function (pkgId, callback) {
		this.service.getFile(pkgId). response(
			this,
			function(inSender, inContent) {
				callback (null, inContent.content);
			}
		) ;
	},

	packageAppend: function ( name, pkgContent, callback ) {
		var toMatch = name.replace(/\./, "\.") ; // replace '.' with '\.'
		var re = RegExp(/\btoMatch\b/) ;
		var result ;
		if (pkgContent.match(re)) {
			callback(null) ;
		}
		else {
			result = pkgContent
				.replace(/\)/,'\t"' + name + '"\n)') // insert new name
				.replace(/("|')(\s*)"/,'$1,$2"');    // add potentially missing comma
			callback(null,result);
		}
	},

	packageChop: function ( name, pkgContent, callback ) {
		var toMatch = name.replace(/\./, "\.") ; // replace '.' with '\.'
		var re = RegExp(/\btoMatch\b/) ;
		var result ;
		if (pkgContent.match(re)) {
			result = pkgContent
				.replace(/("|')toMatch("|')/,'') // remove name
				.replace(/,\s*(,|\)/,"$1");      // remove extra comma
		}
		callback(null);
	},

	packageSave: function ( pkgId, pkgContent,callback) {
		if (typeof pkgContent === undefined) {
			callback(null);
			return;
		}

		this.service.putFile(pkgId, pkgContent) .response(
			this,
			function() {
				callback(null) ;
			}
		);
	}
});
