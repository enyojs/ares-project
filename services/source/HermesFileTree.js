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

		{kind: "Scroller", fit: true, components: [
			{name: "serverNode", kind: "ares.Node", classes: "enyo-unselectable", showing: false, content: "server", icon: "$services/assets/images/antenna.png", expandable: true, expanded: true, collapsible: false, onExpand: "nodeExpand", onAresNodeTap: "aresNodeTap", onForceView: "adjustScroll" }
		]},

		// track selection of nodes. here, selection Key is file or folderId. Selection value is the node object
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},

		{name: "service", kind: "FileSystemService"},
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
	debug: true,
	create: function() {
		this.inherited(arguments);
		this.enableDisableButtons();
	},
	connectService: function(inService, next) {
		this.projectUrlReady = false; // Reset the project information
		this.clear() ;
		this.$.service.connect(inService, enyo.bind(this, (function(err) {
			if (err) {
				if (next) next(err);
			} else {
				this.$.serverNode.file = this.$.service.getRootNode();
				this.$.serverNode.file.isServer = true;
				this.$.serverNode.setContent(this.$.serverNode.file.name);
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
		this.$.serverNode.setService(service);
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

	aresNodeTap: function(inSender, inEvent) {
		var node = inEvent.originator;
		this.$.selection.select(node.file.id, node);
		return true;
	},

	adjustScroll: function (inSender, inEvent) {
		var node = inEvent.originator;
		this.$.scroller.scrollIntoView(node, true);
		return true;
	},

	xxnodeDblClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var node = inEvent.originator;
		// projectUrl in this.projectData is set asynchonously.  Do not try to
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
	// Note: this function does not recurse
	xxupdateNodes: function(inNode) {
		this.startLoading(inNode);
		if (this.debug) this.log(inNode) ;
		return this.$.service.listFiles(inNode && inNode.file && inNode.file.id)
			.response(this, function(inSender, inFiles) {
				var sortedFiles = inFiles.sort(this.fileNameSort) ;
				if (inFiles && !this.$.serverNode.showing) {
					this.$.serverNode.show();
				}

				if (this.debug) this.log("updating node content of " + inNode.name ) ;
				this.updateNodeContent(inNode, sortedFiles);
				inNode.render() ;
			})
			.response(this, function() {
				this.stopLoading(inNode);
			})
			.error(this, function() {
				this.stopLoading(inNode);
			})
			;
	},
	xxstartLoading: function(inNode) {
		inNode.$.extra.setContent('&nbsp;<img src="' + enyo.path.rewrite("$services/assets/images/busy.gif") + '"/>');
	},
	xxstopLoading: function(inNode) {
		inNode.$.extra.setContent("");
	},
    xxupdateNodeContent: function(inNode, files) {
		var i = 0 , nfiles, rfiles, res, modified = 0, newControl ;
		// Add dir property to files, which is a project-relative path
		enyo.forEach(files, function(f) {
			if (f.isDir) {
				f.dir = (inNode.file.dir || "/") + f.name + "/";
			} else {
				f.dir = (inNode.file.dir || "/");
			}
		});
		rfiles = this.filesToNodes(files) ; // with prefix in name
		nfiles = this.getNodeFiles(inNode) ;

		while ( i < nfiles.length || i < rfiles.length) {
			if (this.debug) this.log("considering node " + (nfiles[i] ? nfiles[i].name : '<none>') + ' and file ' + (rfiles[i] ? rfiles[i].name : '<none>') );

			res = i >= nfiles.length ? 1
			    : i >= rfiles.length ? -1
			    :                      this.fileNameSort(nfiles[i], rfiles[i]) ;

			// remember that these file lists are sorted
			switch(res) {
				case -1: // remote file removed
					if (this.debug) this.log(nfiles[i].name + " was removed") ;
					nfiles[i].destroy() ;
				    modified = 1;
					nfiles = this.getNodeFiles(inNode) ;
					// node file list reduced by one, must not increment i
					break ;

				case 0: // no change
					i++ ;
					break ;

				case 1: // file added
				    if (this.debug) this.log(rfiles[i].name + " was added") ;
					newControl = inNode.createComponent( rfiles[i] ) ;
					nfiles = this.getNodeFiles(inNode) ;
					// FIXME: ENYO-1337
					//if (nfiles[i]) {
					//	var justAdded = inNode.controls.pop() ;
					//	inNode.controls.splice(i+4, 0, justAdded);
					//}
				    modified = 1;
					if (nfiles[i].name === '$project.json') {
						// project.json file is internal to Ares
						nfiles[i].hide();
					}
					i++ ;
					break ;
			}

		}

		if (modified) {
			inNode.$.client.render();
		}
	},
	xxcompareFiles: function(inFilesA, inFilesB) {
		if (inFilesA.length != inFilesB.length) {
			return false;
		}
		for (var i in inFilesA) {
			var f0 = inFilesA[i], f1 = inFilesB[i];
			if (f0.id !== f1.id) {
				return false;
			}
		}
		return true;
	},
	// Sort files by name, case-insensitively
	// TODO: I18N, and possibly platform-specific sort order
	xxfileNameSort: function(a, b) {
		var lowA, lowB;
		lowA=a.name.toLowerCase();
		lowB=b.name.toLowerCase();
		// compare lower-case version of name
		if (lowA < lowB) {
			return -1;
		} else if (lowB < lowA) {
			return 1;
		} else {
			// Files that differ only in case are sorted lexicographically
			if (a.name < b.name) {
				return -1;
			} else if (b.name < a.name) {
				return 1;
			} else {
				return 0;
			}
		}
	},
	xxgetNodeFiles: function(inNode) {
		var target = inNode || this.$.serverNode ;
		var hasPrefix = function(e){
			return (e.name.slice(0,1) === '$') ;
		} ;
		// getComponents only return the graphical items
		return target.getControls().filter( hasPrefix ).sort(this.fileNameSort) ;
	},
	xxfilesToNodes: function(inFiles) {
		var nodes = [];
		inFiles.sort(this.fileNameSort); // TODO: Other sort orders
		for (var i=0, f; f=inFiles[i]; i++) {
			nodes.push({
				file: f,
				name: '$' + f.name, // prefix avoids clobberring non-files components like icon
				content: f.name,
				expandable: f.isDir,
				icon: "$services/assets/images/" + (f.isDir ? "folder.png" : "file.png")
			});
		}
		return nodes;
	},
	xxnodeExpand: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);

		// the originating node is arbitrarily deep
		var node = inEvent.originator;
		if (this.debug) this.log("nodeExpand called while node Expanded is " + node.expanded) ;
		// update icon for expanded state
		if (node.file.isDir) {
			node.setIcon("$services/assets/images/" + (node.expanded ? "folder-open.png" : "folder.png"));
		}
		// handle lazy-load when expanding
		if (node.expanded) {
			this.updateNodes(node).
				response(this, function() {
					node.effectExpanded();
				});
			// tell the event originator that node expansion should be deferred
			inEvent.wait = true;
		}
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

	// All parameters are optional.
    // - callBack is optional. Will be called when the refresh is completely done,
	//   i.e. when the aync events fireworks are finished
	refreshFileTree: function(callBack, trash, oldCallBack) {
		// deprecation warning
		if (oldCallBack) {
			this.warn("deprecated refreshFileTree signature. Callback is now the first and only parameter");
			callBack = oldCallBack ;
		}

		var tracker = this.asyncTracker(
			function() {
				this.$.serverNode.render() ;
				if (callBack) { callBack() ; }
			}.bind(this)
		) ;

		if (this.debug) this.log("refreshFileTree called") ;

		this.$.serverNode.refreshTree(tracker,0) ;

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
	}

});

