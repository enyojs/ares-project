enyo.kind({
	name: "HermesFileTree",
	kind: "FittableRows",
	events: {
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onProjectFound: "",
		onConfirm: "",
		onSelect: "",
		onDeselect: "",
		onNewFileConfirm: "",
		onDeleteConfirm: "",
		onRenameConfirm: "",
		onNewFolderConfirm: "",
		onCopyFileConfirm: ""
	},
	handlers: {
		onNodeDblClick: "nodeDblClick"
	},
	published: {
		serverName: ""
	},
	components: [

		// Hermes Tool bar
		{kind: "onyx.Toolbar", classes: "onyx-menu-toolbar ares_harmonia_toolBar ares-no-padding", components: [
			{name: "newFolder", kind: "onyx.TooltipDecorator", components: [
				{name: "newFolderButton", kind: "onyx.IconButton", src: "$harmonia/images/folder_new.png", ontap: "newFolderClick"},
				{kind: "onyx.Tooltip", content: "New Folder..."}
			]},
			{name: "reloadAll", kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$harmonia/images/folder_reload.png", ontap: "reloadClick"},
				{kind: "onyx.Tooltip", content: "reload ..."}
			]},
			{name: "newFile", kind: "onyx.TooltipDecorator", components: [
				{name: "newFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_new.png", ontap: "newFileClick"},
				{kind: "onyx.Tooltip", content: "New File..."}
			]},
			{name: "renameFile", kind: "onyx.TooltipDecorator", components: [
				{name: "renameFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_edit.png", ontap: "renameClick"},
				{kind: "onyx.Tooltip", content: "Rename..."}
			]},
			{name: "copyFile", kind: "onyx.TooltipDecorator", components: [
				{name: "copyFileButton", kind: "onyx.IconButton", src: "$harmonia/images/copy.png", ontap: "copyClick"},
				{kind: "onyx.Tooltip", content: "Copy..."}
			]},
			{name: "deleteFile", kind: "onyx.TooltipDecorator", components: [
				{name: "deleteFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_delete.png", ontap: "deleteClick"},
				{kind: "onyx.Tooltip", content: "Delete..."}
			]}
		]},

		// Hermes tree
		{kind: "Scroller", fit: true, components: [
			{name: "serverNode", kind: "ares.Node", classes: "enyo-unselectable", showing: false, content: "server", icon: "$services/assets/images/antenna.png", expandable: true, expanded: true, collapsible: false, onExpand: "nodeExpand", onForceView: "adjustScroll" }
		]},

		// track selection of nodes. here, selection Key is file or folderId.
		// Selection value is the node object. Is an Enyo kind
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},

		// service provide connection to file storage
		{name: "service", kind: "FileSystemService"},

		// Hermes popups
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "Service returned an error"},
		{name: "nameFilePopup", kind: "NamePopup", type: "file", fileName:"", placeHolder: "File Name", onCancel: "newFileCancel", onConfirm: "newFileConfirm"},
		{name: "nameFolderPopup", kind: "NamePopup", type: "folder", fileName: "", placeHolder: "Folder Name", onCancel: "newFolderCancel", onConfirm: "newFolderConfirm"},
		{name: "nameCopyPopup", kind: "NamePopup", title: "Name for copy of", fileName: "Copy of foo.js", onCancel: "copyFileCancel", onConfirm: "copyFileConfirm"},
		{name: "deletePopup", kind: "DeletePopup", onCancel: "deleteCancel", onConfirm: "deleteConfirm"},
		{name: "renamePopup", kind: "RenamePopup", title: "New name for ", fileName: "foo.js", onCancel: "renameCancel", onConfirm: "renameConfirm"}

	],

	// warning: this variable duplicates an information otherwise stored in this.$.selection
	// BUT, retrieving it through this.$.selection.getSelected is not handy as this function
	// return an object (hash) which needs to be scanned to retrieve the selected value
	selectedFile: null,
	selectedNode: null,

	debug: false,

	create: function() {
		this.inherited(arguments);
		this.enableDisableButtons();
	},
	connectService: function(inService, next) {
		if (this.debug) this.log("connect to service: ", inService);
		this.projectUrlReady = false; // Reset the project information
		this.clear() ;
		this.$.service.connect(inService, enyo.bind(this, (function(err) {
			if (err) {
				if (next) next(err);
			} else {
				this.$.serverNode.file = this.$.service.getRootNode();
				this.$.serverNode.file.isServer = true;
				this.$.serverNode.setContent(this.$.serverNode.file.name);
				this.$.serverNode.setService(inService);
				if (next) next();
			}
		})));
		return this ;
	},
	/**
	 * @param {Object} inFsService a FileSystemService implementation, as listed in ProviderList
	 */
	setConfig: function(inProjectData) {
		if (this.debug) this.log("config:", inProjectData);
		this.projectData = inProjectData;

		var serverNode = this.$.serverNode;
		var nodeName = inProjectData.getName();
		var folderId = inProjectData.getFolderId();
		var service = inProjectData.getService();
		serverNode.hide();

		// connects to a service that provides access to a
		// (possibly remote & always asynchronous) file system
		this.connectService(service, enyo.bind(this, (function(inError) {
			if (inError) {
				this.showErrorPopup("Internal Error (" + inError + ") from filesystem service");
			} else {
				// Get extra info such as project URL
				var req = this.$.service.propfind(folderId, 0);
				req.response(this, function(inSender, inValue) {
					var projectUrl = service.getConfig().origin + service.getConfig().pathname + "/file" + inValue.path;
					this.projectData.setProjectUrl(projectUrl);
					this.projectUrlReady = true;

					//
					serverNode.file = inValue;
					serverNode.file.isServer = true;

					serverNode.setContent(nodeName);
					this.refreshFileTree();
				});
				req.error(this, function(inSender, inError) {
					this.projectData.setProjectUrl("");
					this.showErrorPopup("Internal Error (" + inError + ") from filesystem service");
				});
				if (this.selectedNode) {
					this.deselect(null, {data: this.selectedNode});
				}
				this.$.selection.clear();
				this.selectedNode = null;
				this.selectedFile = null;
				this.enableDisableButtons();
			}
		})));
		return this;
	},
	hideFileOpButtons: function() {
		this.$.newFolder.hide();
		this.$.newFile.hide();
		this.$.reloadAll.hide();
		this.$.renameFile.hide();
		this.$.copyFile.hide();
		this.$.deleteFile.hide();
		return this ;
	},
	showNewFolderButton: function() {
		this.$.newFolder.show();
		return this ;
	},
	showFileOpButtons: function() {
		this.$.newFolder.show();
		this.$.reloadAll.show();
		this.$.newFile.show();
		this.$.renameFile.show();
		this.$.copyFile.show();
		this.$.deleteFile.show();
		return this ;
	},
	clear: function() {
		var server = this.$.serverNode;
		if (this.debug) this.log("clearing serverNode") ;
		enyo.forEach(
			server.getNodeFiles() ,
			function(n){
				n.destroy();
			}
		) ;
		server.hide();
		return this ;
	},
	reset: function() {
		this.$.serverNode.hide();
		if (this.$.service.isOk()) {
			if (this.debug) this.log("reseting serverNode") ;
			this.updateNodes(this.$.serverNode);
		}
		return this ;
	},

	adjustScroll: function (inSender, inEvent) {
		var node = inEvent.originator;
		this.$.scroller.scrollIntoView(node, true);
		return true;
	},

	nodeTap: function(inSender, inEvent) {
		if (this.debug) this.log('noteTap: ',inSender, "=>", inEvent);
		var node = inEvent.originator;
		this.$.selection.select(node.file.id, node);
		if (!node.file.isDir) {
			this.doFileClick({file: node.file});
		} else {
			this.doFolderClick({file: node.file});
		}
		// handled here (don't bubble)
		return true;
	},

	nodeDblClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var node = inEvent.originator;
		// projectUrl in this.projectData is set asynchronously.  Do not try to
		// open anything before it is available.  Also do not
		// try to open top-level root & folders.
		if (!node.file.isDir && !node.file.isServer && this.projectUrlReady) {
			this.doFileDblClick({file: node.file, projectData: this.projectData});
		}

		// handled here (don't bubble)
		return true;
	},
	select: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.selectedNode=inEvent.data;
		this.selectedFile=inEvent.data.file;
		inEvent.data.file.service = this.$.service;
		inEvent.data.$.caption.applyStyle("background-color", "lightblue");
		this.doSelect({file: this.selectedFile});
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	deselect: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (inEvent.data && inEvent.data.$.caption) {
			inEvent.data.$.caption.applyStyle("background-color", null);
		}
		this.doDeselect({file: this.selectedFile});
		this.selectedNode=null;
		this.selectedFile=null;
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	copyName: function(inName) {
		return "Copy of "+inName;
	},
	reloadClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.refreshFileTree();
	},

	asyncTracker: function(callBack) {
		var count = 0 ;
		var that = this ;
		this.debug && this.log("tracker created") ;
		return {
			inc: function() {
				count ++ ;
				that.debug && that.log("tracker inc ", count) ;
				return count;
			},
			dec: function( val ){
				count-- ;
				that.debug && that.log("tracker dec", count) ;
				if (count === 0 && callBack) {
					that.log("running tracker call-back") ;
					callBack() ;
				}
			}
		};
	},

	/**
	 *
	 * @ public
	 *  All parameters are optional.
	 *  - callBack is optional. Will be called when the refresh is completely done,
	 *    i.e. when the aync events fireworks are finished
	 *  - toSelectId: when set, will force an entry to be selected. Use an id as returned
	 *    by fsService (or any other service)
	 */
	refreshFileTree: function(callBack, toSelectId, oldCallBack) {
		// deprecation warning
		if (oldCallBack) {
			this.warn("deprecated refreshFileTree signature. Callback is now the first parameter");
			callBack = oldCallBack ;
		}

		var tracker = this.asyncTracker(
			function() {
				this.$.serverNode.render() ;
				if (callBack) { callBack() ; }
			}.bind(this)
		) ;

		if (this.debug) this.log("refreshFileTree called") ;

		this.$.serverNode.refreshTree(tracker,0, toSelectId) ;

		this.debug && this.log("refreshFileTree done") ;
	},
	// Get nearest parent directory for file ref
	getFolder: function() {
		var folder = this.selectedFile;
		if (folder && !folder.isDir) {
			folder = this.selectedNode.container.file;
		}
		return folder;
	},

	/**
	 * @public
	 * Returns a file data structure for the parent node of the currently selected node
	 */
	getParentOfSelected: function() {
		return this.selectedNode.container.file; // is a folder...
	},

	// User Interaction for New File op
	newFileClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var folder = this.getFolder();
		if (folder && folder.isDir) {
			this.$.nameFilePopup.setFileName("");
			this.$.nameFilePopup.setFolderId(folder.id);
			this.$.nameFilePopup.setPath(folder.path);
			this.$.nameFilePopup.show();
		} else {
			this.showErrorPopup("Select a parent folder first");
		}
	},
	newFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.doNewFileConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	newFileCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.debug) this.log("New File canceled.");
	},
	// User Interaction for New Folder op
	newFolderClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var folder = this.getFolder();
		if (folder && folder.isDir) {
			this.$.nameFolderPopup.setFileName("");
			this.$.nameFolderPopup.setFolderId(folder.id);
			this.$.nameFolderPopup.setPath(folder.path);
			this.$.nameFolderPopup.show();
		} else {
			this.showErrorPopup("Select a parent folder first");
		}
	},
	newFolderConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.doNewFolderConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	newFolderCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
	},
	// User Interaction for Copy File/Folder op
	copyClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.selectedFile) {
			this.$.nameCopyPopup.setType(this.selectedFile.type);
			this.$.nameCopyPopup.setFileName(this.copyName(this.selectedFile.name));
			this.$.nameCopyPopup.setPath(this.selectedFile.path);
			this.$.nameCopyPopup.setFolderId(this.selectedFile.id);
			this.$.nameCopyPopup.show();
		} else {
			this.showErrorPopup("Select a file or folder to copy first");
		}
	},
	copyFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.doCopyFileConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	copyFileCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
	},
	// User Interaction for Rename File/Folder op
	renameClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.selectedFile) {
			this.$.renamePopup.setType(this.selectedFile.type);
			this.$.renamePopup.setFileName(this.selectedFile.name);
			this.$.renamePopup.setFolderId(this.selectedFile.id);
			this.$.renamePopup.setPath(this.selectedFile.path);
			this.$.renamePopup.show();
		} else {
			this.showErrorPopup("Select a file or folder to rename first");
		}
	},
	renameConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.doRenameConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	renameCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
	},
	// User Interaction for Delete File/Folder op
	deleteClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.selectedFile) {
			this.$.deletePopup.setType(this.selectedFile.isDir ? 'folder' : 'file');
			this.$.deletePopup.setName(this.selectedFile.name);
			this.$.deletePopup.setNodeId(this.selectedFile.id);
			this.$.deletePopup.setPath(this.selectedFile.path);
			this.$.deletePopup.show();
		} else {
			this.showErrorPopup("Select a file or folder to delete first");
		}
	},
	deleteConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.doDeleteConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	deleteCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
	},

	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	enableDisableButtons: function() {
		if (this.selectedFile) {
			this.$.deleteFileButton.setDisabled(this.selectedFile.isServer);
			this.$.copyFileButton.setDisabled(this.selectedFile.isServer);
			this.$.renameFileButton.setDisabled(this.selectedFile.isServer);
		} else {
			this.$.copyFileButton.setDisabled(true);
			this.$.deleteFileButton.setDisabled(true);
			this.$.renameFileButton.setDisabled(true);
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
		if (this.debug) this.log(inSender, "=>", inEvent);
		var folderId = inEvent.folderId;
		var name = inEvent.name.trim();
		var nameStem = name.substring(0, name.lastIndexOf(".")); // aka basename
		var type = name.substring(name.lastIndexOf(".")+1); // aka suffix
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
			if (this.debug) this.log("newFileConfirm response: ", inResponse);
			for (var n in replacements) {
				inResponse = inResponse.replace(n, replacements[n]);
			}
			this.createFile(name, folderId, inResponse);
		});
		r.error(this, function(inSender, error) {
			if (error === 404){
				this.createFile(name, folderId);
				this.showErrorPopup("No template found for '." + type + "' files.  Created an empty one.");
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
			this.refreshFileTree(null, forceSelect);
		}) ;
		return onDone ;
	},
	createFile: function(name, folderId, content) {
		if (this.debug) this.log("Creating new file "+name+" into folderId="+folderId);
		this.$.service.createFile(folderId, name, content)
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
				this.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},
	newFolderConfirm: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inSender.fileName.trim();
		if (this.debug) this.log("Creating new folder "+name+" into folderId="+folderId);
		this.$.service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("folder creation done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	renameConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var newName = inSender.fileName.trim();
		if (this.debug) this.log("Renaming file " + oldId + " as " + newName + " at " + path);
		this.$.service.rename(oldId, newName)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("rename done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.showErrorPopup("Renaming file "+oldId+" as " + newName +" failed:" + inError);
			});
	},
	deleteConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		var nodeId = inSender.nodeId;
		if (this.debug) this.log(this.selectedFile);
		var oldId = this.selectedFile.id;
		var name = this.selectedFile.name ;
		var oldPath = this.selectedFile.path;
		var method = this.selectedFile.isDir ? "deleteFolder" : "deleteFile";
		var upperDir = this.getParentOfSelected() ;
		if (this.debug) this.log(method + ' ' + name + " in folder " + upperDir.name);
		this.$.service.remove(inEvent.nodeId)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.packageRemove(
					upperDir.id, name,
					function () {this.delayedRefresh("delete done").go() ;}.bind(this)
				);
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.showErrorPopup("Deleting file "+oldPath+" failed:" + inError);
			});
	},
	copyFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		var oldName = this.selectedFile.name;
		var newName = inSender.fileName.trim();
		if (this.debug) this.log("Creating new file " + newName + " as copy of" + this.selectedFile.name);
		this.$.service.copy(this.selectedFile.id, newName)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.delayedRefresh("copy done").go(inResponse) ;
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.showErrorPopup("Creating file "+newName+" as copy of" + this.selectedFile.name +" failed:" + inError);
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
		var selectedDirNode = this.selectedNode ; // FIXME: not good when removing a file
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
		this.$.service.getFile(pkgId). response(
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

		this.$.service.putFile(pkgId, pkgContent) .response(
			this,
			function() {
				callback(null) ;
			}
		);
	}

});

