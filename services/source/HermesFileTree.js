enyo.kind({
	name: "HermesFileTree",
	kind: "FittableRows",
	events: {
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onTreeChanged: ""
	},
	handlers: {
		onNodeDblClick: "nodeDblClick",
		//
		/*
		//onSetupItem:"handleSetup",
    //onhold:"handleHold",
    //ondragfinish:"handleDragFinish",
    //onup:"handleRelease",
		//ondrag:"handleDrag",
    //onresize:"handleResize",
    ondragstart:"handleDragStart",
    //onselectstart:"handleSelectStart",
    onrelease:"handleSlowRelease",*/
		ondragstart:"dragStart",
		ondrag:"drag",
		ondragfinish:"dragFinish",
	},
	published: {
		serverName: ""
	},
	components: [
		{kind: "onyx.Toolbar", classes: "ares-top-toolbar  hermesFileTree-toolbar", components: [
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
			{name: "serverNode", kind: "ares.Node", classes: "enyo-unselectable", showing: false, content: "server", icon: "$services/assets/images/antenna.png", 
				//draggable: false, 
				expandable: true, expanded: true, collapsible: false, onExpand: "nodeExpand", onForceView: "adjustScroll" },
			// DragAvatar use
			/*{name:"dragAvatar", kind:"DragAvatar",
				//components: [{tag: "img", src: "$deimos/images/icon.png"}]
				components: [{tag: "img", src: "$services/assets/images/move.png"}]
			},*/
		]},

		// track selection of nodes. here, selection Key is file or folderId.
		// Selection value is the node object. Is an Enyo kind
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},

		// service provide connection to file storage
		{name: "service", kind: "FileSystemService"},

		// Hermes popups
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "Service returned an error"},
		{name: "nameFilePopup", kind: "NamePopup", type: "file", fileName:"", placeHolder: "File Name", onCancel: "newFileCancel", onConfirm: "newFileConfirm"},
		{name: "nameFolderPopup", kind: "NamePopup", type: "folder", fileName: "", placeHolder: "Folder Name", onCancel: "_newFolderCancel", onConfirm: "_newFolderConfirm"},
		{name: "nameCopyPopup", kind: "NamePopup", title: "Name for copy of", fileName: "Copy of foo.js", onCancel: "copyFileCancel", onConfirm: "copyFileConfirm"},
		{name: "deletePopup", kind: "DeletePopup", onCancel: "deleteCancel", onConfirm: "deleteConfirm"},
		{name: "renamePopup", kind: "RenamePopup", title: "New name for ", fileName: "foo.js", onCancel: "_renameCancel", onConfirm: "_renameConfirm"},
	],

	// warning: this variable duplicates an information otherwise stored in this.$.selection
	// BUT, retrieving it through this.$.selection.getSelected is not handy as this function
	// return an object (hash) which needs to be scanned to retrieve the selected value
	selectedFile: null,
	selectedNode: null,
	
	//
	//draggedNode: null,
	//overDraggedNode: null,

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
		var that = this ;
		serverNode.hide();

		// connects to a service that provides access to a
		// (possibly remote & always asynchronous) file system
		this.connectService(service, enyo.bind(this, (function(inError) {
			if (inError) {
				this.showErrorPopup("Internal Error (" + inError + ") from filesystem service");
			} else {
				if (this.selectedNode) {
					this.deselect(null, {data: this.selectedNode});
				}
				this.$.selection.clear();
				this.selectedNode = null;
				this.selectedFile = null;
				this.enableDisableButtons();

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
					this.refreshFileTree(function(){ that.select(null, { data: serverNode } ) ; });
				});
				req.error(this, function(inSender, inError) {
					this.projectData.setProjectUrl("");
					this.showErrorPopup("Internal Error (" + inError + ") from filesystem service");
				});
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
	//
	dragStart: function(inSender, inEvent) {
		//if (this.debug) 
		//this.log(inSender, "=>", inEvent);
		
		//this.log("start file path=", inEvent.originator.file.path);
		this.log("start file id=", inEvent.originator.file.id);
		
		return true;
	},
	drag: function(inSender, inEvent) {
		//if (this.debug) 
		//this.log(inSender, "=>", inEvent);
		//this.$.dragAvatar.drag(inEvent);
		
		//this.log("drag file path=", inEvent.originator.file.path);
		//this.log("drag file id=", inEvent.originator.file.id);
		
		return true;
	},
	dragFinish: function(inSender, inEvent) {
		//if (this.debug) 
		//this.log(inSender, "=>", inEvent);
		//this.$.dragAvatar.hide();
		
		//this.log("finish file path=", inEvent.originator.file.path);
		this.log("finish file id=", inEvent.originator.file.id);
		
		return true;
	},
	/*handleHold:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		return true;
	},
	handleDragFinish:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		return true;
	},
	handleDrag:function(inSender, inEvent) {
		//if (this.debug) 
		//this.log(inSender, "=>", inEvent);
		
		// check if the node to drag is not the node over the cursor is
		if (draggedNode != inEvent.originator.parent) {
			// check if the cursor is no more hovering over the last node over hovered
			if (overDraggedNode != inEvent.originator.parent) {
				// check if the cursor is not between two nodes (so not over their related container)
				//if(inEvent.originator.parent.node == null) {
					// check if the cursor is not over a file node
					//if (inEvent.originator.parent.file) {
						if (overDraggedNode) {
							overDraggedNode.children[1].applyStyle("background-color", null);
						}
						overDraggedNode = inEvent.originator.parent;
						this.log("overDraggedNode folder changed");
						overDraggedNode.children[1].applyStyle("background-color", "red");
						this.log("inEvent=>", inEvent);
						this.log("originator(parent)=>", inEvent.originator.parent);
					/*} else {
						if (overDraggedNode) {
							overDraggedNode.children[1].applyStyle("background-color", null);
						}
						this.log("overDraggedNode file");
						overDraggedNode = null;
					}*/
				/*} else {
					if (overDraggedNode) {
						overDraggedNode.children[1].applyStyle("background-color", null);
					}
					this.log("overDraggedNode father");
					overDraggedNode = null;
					this.log("inEvent=>", inEvent);
					this.log("originator(parent)=>", inEvent.originator.parent);
				}*/
	/*		} else {
				this.log("overDraggedNode same");
			}
		} else { 
			if (overDraggedNode) {
				overDraggedNode.children[1].applyStyle("background-color", null);
			}
			this.log("overDraggedNode itself");
			overDraggedNode = null;
		}
		
		return true;
	},
	handleRelease:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		if (overDraggedNode) {
			overDraggedNode.children[1].applyStyle("background-color", null);
		}
		overDraggedNode = null;
		
		draggedNode = null;
		
		this.log("draggedNode released");
		
		return true;
	},
	handleDragStart:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		draggedNode = inEvent.originator.parent;
		overDraggedNode = null;
		this.log("draggedNode captured");
		this.log("inEvent=>", inEvent);
		this.log("originator(parent)=>", inEvent.originator.parent);
		
		this.enableDisableButtons();
		
		return true;
	},
	handleSelectStart:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		return true;
	},
	handleSlowRelease:function(inSender, inEvent) {
		//if (this.debug) 
		this.log(inSender, "=>", inEvent);
		
		return true;
	},*/
	/*nodeExpand:function(inSender, inEvent) {
		this.log("HermesFileTree", inSender, "=>", inEvent);
		if (draggedNode==null) this.inherited(arguments);
		else return true;
	},*/
	//
	select: function(inSender, inEvent) {
		// initialisation of the handler about the node over hovered by the cursor during a drag mode action.
		//overDraggedNode = null;
		//draggedNode = null;
	
		if (this.debug) this.log(inSender, "=>", inEvent);
		this.selectedNode=inEvent.data;
		this.selectedFile=inEvent.data.file;
		inEvent.data.file.service = this.$.service;
		inEvent.data.$.caption.applyStyle("background-color", "lightblue");
		// this.doSelect({file: this.selectedFile});
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	deselect: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		if (inEvent.data && inEvent.data.$.caption) {
			inEvent.data.$.caption.applyStyle("background-color", null);
		}
		//this.doDeselect({file: this.selectedFile});
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
					that.debug && that.log("running tracker call-back") ;
					callBack() ;
				}
			}
		};
	},
	/**
	 * Refresh the current {HermesFileTree} view, if applicable
	 * @param {Object} changedFile
	 */
	refreshFile: function(changedFile) {
		// FIXME: not cleanly implemented: should check wether
		// a refresh is necessary first.
		this.refreshFileTree();
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

		if (toSelectId && toSelectId.match(/[^\da-f]/) ) {
			this.warn("refreshFileTree: internal error, toSelectId " + toSelectId + " does not look like an Id");
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

	/**
	 * @public
	 * Returns selected dir or container dir data
	 */
	getFolder: function() {
		var node = this.getFolderOfSelectedNode() ;
		return node ? node.file : null ;
	},

	/**
	 * @public
	 * @returns selected folder {Ares.Node} or containing folder {Ares.Node}
	 */
	getFolderOfSelectedNode: function() {
		var node = this.selectedNode;
		return node && !node.file.isDir ? this.selectedNode.container
		     : node;
	},

	/**
	 * @public
	 * @returns a node structure for the parent node of the currently selected node
	 */
	getParentNodeOfSelected: function() {
		return this.selectedNode && this.selectedNode.container ;
	},

	/**
	 * @public
	 * @returns a file data structure for the parent node of the currently selected node
	 */
	getParentOfSelected: function() {
		return this.selectedNode && this.selectedNode.container && this.selectedNode.container.file;
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
	newFileCancel: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.debug) this.log("New File canceled.");
	},
	// User Interaction for New Folder op
	newFolderClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var folder = this.getFolder();
		if (this.debug) this.log("on folder ",folder);
		if (folder && folder.isDir) {
			this.$.nameFolderPopup.setFileName("");
			this.$.nameFolderPopup.setFolderId(folder.id);
			this.$.nameFolderPopup.setPath(folder.path);
			this.$.nameFolderPopup.show();
		} else {
			this.showErrorPopup("Select a parent folder first");
		}
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

	newFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		var folderId = inEvent.folderId;
		var name = inEvent.name.trim();
		var nameStem = name.substring(0, name.lastIndexOf(".")); // aka basename
		var type = name.substring(name.lastIndexOf(".")+1); // aka suffix
		var templatePath;
		var location = window.location.toString();
		var prefix = location.substring(0, location.lastIndexOf("/")+1);
		if (name === "package.js") {
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
			if (this.debug) this.log("delayed refresh after " + msg + ' on ' + select) ;
			this.refreshFileTree(null, select);
		}) ;
		return onDone ;
	},

	createFile: function(name, folderId, content) {
		if (this.debug) this.log("Creating new file "+name+" into folderId="+folderId);
		this.$.service.createFile(folderId, name, content)
			.response(this, function(inSender, inNodes) {
				if (this.debug) this.log("inNodes: ",inNodes);
				var parentNode = this.getFolderOfSelectedNode(),
				    pkgNode = parentNode.getNodeNamed('package.js');
				this.doTreeChanged({
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inNodes[0]
					}
				});
				this.refreshFileTree(null, inNodes[0].id);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to create file:", name, inError);
				this.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},
	/** @private */
	_newFolderCancel: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	_newFolderConfirm: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
		var folderId = inEvent.folderId;
		var name = inSender.fileName.trim();
		if (this.debug) this.log("Creating new folder "+name+" into folderId="+folderId);
		this.$.service.createFolder(folderId, name)
			.response(this, function(inSender, inFolder) {
				if (this.debug) this.log("newFolderConfirm inFolder: ", inFolder);
				var parentNode = this.getFolderOfSelectedNode(),
				    pkgNode = parentNode.getNodeNamed('package.js');
				this.doTreeChanged({
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inFolder
					}
				});
				this.refreshFileTree(null, inFolder.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to create folder:", name, inError);
				this.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	/** @private */
	_renameCancel: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	_renameConfirm: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
		var newName = inSender.fileName.trim();
		if (this.debug) this.log("Renaming '" + this.selectedFile + "' as '" + newName + "'");
		this.$.service.rename(this.selectedFile.id, newName)
			.response(this, function(inSender, inNode) {
				if (this.debug) this.log("inNode: "+inNode);
				var parentNode = this.getParentNodeOfSelected(),
				    pkgNode = parentNode.getNodeNamed('package.js');
				this.doTreeChanged({
					remove: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: this.selectedFile
					},
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inNode
					}
				});
				this.refreshFileTree(null, inNode.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to rename:", this.selectedFile, "into", newName, inError);
				this.showErrorPopup("Renaming file '" + this.selectedFile.name + "' as '" + newName +"' failed");
			});
	},

	deleteConfirm: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
		if (this.debug) this.log("selectedFile:", this.selectedFile);
		var parentNode = this.getParentNodeOfSelected(),
		    pkgNode = parentNode.getNodeNamed('package.js');
		if (this.debug) this.log("parentNode:", parentNode, "pkgNode:", pkgNode);
		this.$.service.remove(this.selectedFile.id)
			.response(this, function(inSender, inParentFolder) {
				if (this.debug) this.log("inParentFolder: ", inParentFolder);
				this.doTreeChanged({
					remove: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: this.selectedFile
					}
				});
				this.refreshFileTree(null, inParentFolder.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to delete:", this.selectedFile, inError);
				this.showErrorPopup("Deleting '" + this.selectedFile.name + "' failed");
			});
	},

	copyFileConfirm: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		var oldName = this.selectedFile.name;
		var newName = inSender.fileName.trim();
		if (this.debug) this.log("Creating new file " + newName + " as copy of" + this.selectedFile.name);
		this.$.service.copy(this.selectedFile.id, newName)
			.response(this, function(inSender, inFsNode) {
				if (this.debug) this.log("inNode: "+inFsNode);
				var parentNode = this.getParentNodeOfSelected(),
				    pkgNode = parentNode.getNodeNamed('package.js');
				this.doTreeChanged({
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inFsNode
					}
				});
				this.refreshFileTree(null, inFsNode.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to copy:", this.selectedFile, "as", newName, inError);
				this.showErrorPopup("Creating file "+newName+" as copy of" + this.selectedFile.name +" failed:" + inError);
			});
	}
});

