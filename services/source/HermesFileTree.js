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
		onItemDown: "itemDown",
		onItemDragstart: "itemDragstart",
		onItemDragenter: "itemDragenter",
		onItemDragover: "itemDragover",
		onItemDragleave: "itemDragleave",
		onItemDrop: "itemDrop",
		onItemDragend: "itemDragend",
		onNodeDblClick: "nodeDblClick"
	},
	published: {
		serverName: "",
		// allows filetree to have draggable subnodes or not (not per default).
		dragAllowed: false
	},
	components: [
		{kind: "onyx.Toolbar", classes: "ares-top-toolbar  hermesFileTree-toolbar", components: [
			{name: "newFolder", kind: "onyx.TooltipDecorator", components: [
				{name: "newFolderButton", kind: "onyx.IconButton", src: "$harmonia/images/folder_new.png", ontap: "newFolderClick"},
				{kind: "onyx.Tooltip", content: $L("New Folder...")}
			]},
			{name: "reloadAll", kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$harmonia/images/folder_reload.png", ontap: "reloadClick"},
				{kind: "onyx.Tooltip", content: $L("Reload...")}
			]},
			{name: "newFile", kind: "onyx.TooltipDecorator", components: [
				{name: "newFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_new.png", ontap: "newFileClick"},
				{kind: "onyx.Tooltip", content: $L("New File...")}
			]},
			{name: "renameFile", kind: "onyx.TooltipDecorator", components: [
				{name: "renameFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_edit.png", ontap: "renameClick"},
				{kind: "onyx.Tooltip", content: $L("Rename...")}
			]},
			{name: "copyFile", kind: "onyx.TooltipDecorator", components: [
				{name: "copyFileButton", kind: "onyx.IconButton", src: "$harmonia/images/copy.png", ontap: "copyClick"},
				{kind: "onyx.Tooltip", content: $L("Copy...")}
			]},
			{name: "deleteFile", kind: "onyx.TooltipDecorator", components: [
				{name: "deleteFileButton", kind: "onyx.IconButton", src: "$harmonia/images/document_delete.png", ontap: "deleteClick"},
				{kind: "onyx.Tooltip", content: $L("Delete...")}
			]},
			{name: "revertMove", kind: "onyx.TooltipDecorator", components: [
				{name: "revertMoveButton", kind: "onyx.IconButton", src: "$harmonia/images/undo.png", ontap: "revertClick"},
				{kind: "onyx.Tooltip", content: $L("Revert move...")}
			]}
		]},
		
		// Hermes tree, "serverNode" component will be added as HermesFileTree is created
		{kind: "Scroller", fit: true},

		// track selection of nodes. here, selection Key is file or folderId.
		// Selection value is the node object. Is an Enyo kind
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},

		// service provide connection to file storage
		{name: "service", kind: "FileSystemService"},

		// Hermes popups
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "Service returned an error"},
		{name: "nameFilePopup", kind: "NamePopup", type: "file", fileName:"", placeHolder: $L("File Name"), onCancel: "newFileCancel", onConfirm: "newFileConfirm"},
		{name: "nameFolderPopup", kind: "NamePopup", type: "folder", fileName: "", placeHolder: $L("Folder Name"), onCancel: "_newFolderCancel", onConfirm: "_newFolderConfirm"},
		{name: "nameCopyPopup", kind: "NamePopup", title: $L("Name for copy of"), fileName: $L("Copy of foo.js"), onCancel: "copyFileCancel", onConfirm: "copyFileConfirm"},
		{name: "deletePopup", kind: "DeletePopup", onCancel: "deleteCancel", onConfirm: "deleteConfirm"},
		{name: "renamePopup", kind: "RenamePopup", title: $L("New name for "), fileName: "foo.js", onCancel: "_renameCancel", onConfirm: "_renameConfirm"},
		{name: "revertPopup", kind: "RevertPopup", title: $L("Revert node moving"), fileName: "foo.js", onCancel: "_revertCancel", onConfirm: "_revertConfirm"}
	],

	// warning: this variable duplicates an information otherwise stored in this.$.selection
	// BUT, retrieving it through this.$.selection.getSelected is not handy as this function
	// return an object (hash) which needs to be scanned to retrieve the selected value
	selectedFile: null,
	selectedNode: null,
	
	debug: false,
	
	draggedNode: null,
	targetNode: null,

	movedNode: null,
	originNode: null,
	revertMove: false,
	
	holdoverTimeout:   null,
	holdoverTimeoutMS: 1000,
			
	create: function() {
		this.inherited(arguments);
		
		this.enableDisableButtons();
		this.createComponent(
			{name: "serverNode", container: this.$.scroller, kind: "hermes.Node", classes: "enyo-unselectable", showing: false, content: "server", icon: "$services/assets/images/antenna.png", expandable: true, expanded: true, collapsible: false, dragAllowed: this.dragAllowed, onExpand: "nodeExpand", onForceView: "adjustScroll" }
		);
	},
	
	itemDown: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		return true;
	},
	
	itemDragstart: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		// get the related hermes.Node
		this.draggedNode = inEvent.originator;
		if (this.draggedNode.kind !== "hermes.Node") {			
			this.draggedNode = this.draggedNode.parent;
		}
		this.targetNode = this.draggedNode;
		
		if (this.draggedNode.content == "package.js") {
			inEvent.dataTransfer.effectAllowed = "none";
		} else {
			inEvent.dataTransfer.effectAllowed = "linkMove";
		}
		inEvent.dataTransfer.setData('text/html', this.innerHTML);
		
		return true;
	},
	itemDragenter: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		// look for the related hermes.Node
		var tempNode = inEvent.originator;
		if (tempNode.kind !== "hermes.Node") {
			tempNode = tempNode.parent;
		}

		if (!tempNode.file.isDir) {
			tempNode = tempNode.container;
		}
		
		if (this.targetNode === tempNode) {
			return true;
		}
		
		if (this.targetNode !== null) {
			if (this.targetNode.file.isDir && this.targetNode.expanded) {
				this.targetNode.removeClass("hermesFileTree-folder-highlight");
				this.$.selection.deselect(this.targetNode.file.id, this.targetNode);
			}
		}
		
		this.resetHoldoverTimeout();
		
		// targetNode update
		this.targetNode = tempNode;
		
		if (this.targetNode.file.isDir && this.targetNode.expanded) {
			this.targetNode.addClass("hermesFileTree-folder-highlight");
		}
		
		this.setHoldoverTimeout(this.targetNode);
		
		return true;
	},
	itemDragover: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		if (this.draggedNode.content != "package.js") {
			if (this.isValidDropTarget(this.targetNode)) {
				inEvent.dataTransfer.dropEffect = "link";
			} else {
				inEvent.dataTransfer.dropEffect = "move";
			}
			inEvent.preventDefault();
		}
		
		return true;
	},
	itemDragleave: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		return true;
	},
	itemDrop: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		if (!this.isValidDropTarget(this.targetNode)) {
			if (this.debug) this.log("target not valid");
		} else {
			if (this.draggedNode.content != "package.js") {
				var oldParentNode=this.draggedNode.container,
					newParentNode=this.targetNode;
				this.moveNode(this.draggedNode, this.targetNode)
					.response(this, function(inSender, inNodeFile) {
						newParentNode.getChildren()
							.response(this, function(inSender, inNodes) {
								this.movedNode=newParentNode.getNodeWithId(inNodeFile.id);
								this.originNode=oldParentNode;
								this.revertMove=true;
								this.showRevertMoveButton();
							})
							.error(this, function() {
								this.log("error retrieving related node children");
							});
					});
			} else {
				if (this.debug) this.log("'package.js' files cannot be moved");
			}
		}
		
		this.innerHTML = inEvent.dataTransfer.getData('text/html');

		return true;
	},
	itemDragend: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		if (this.targetNode.file.isDir && this.targetNode.expanded) {
			this.targetNode.removeClass("hermesFileTree-folder-highlight");
			this.$.selection.deselect(this.targetNode.file.id, this.targetNode);
		}
		
		this.resetHoldoverTimeout();
		this.draggedNode = null;
		this.targetNode = null;
		
		return true;
	},
	setHoldoverTimeout: function (inTarget) {
		this.holdoverTimeout = setTimeout(enyo.bind(this, function() { this.holdOver(inTarget); }), this.holdoverTimeoutMS);
	},
	resetHoldoverTimeout: function() {
		clearTimeout(this.holdoverTimeout);
		this.holdoverTimeout = null;
	},
	holdOver: function (inTargetNode) {
		if (this.debug) this.log("inTargetNode=", inTargetNode);
		
		// expanding closed folder node...
		if (inTargetNode != this.draggedNode && inTargetNode.file.isDir && !inTargetNode.expanded) {
			this.$.selection.select(inTargetNode.file.id, inTargetNode);
			
			inTargetNode.setExpanded(true);
			// update icon for expanded state
			inTargetNode.setIcon("$services/assets/images/folder-open.png");
			
			// handle lazy-load when expanding
			inTargetNode.updateNodes().
				response(this, function() {
					inTargetNode.effectExpanded();
				});
		}
	},
	isValidDropTarget: function(inNode) {
		if (this.debug) this.log("inNode=", inNode);
		
		var draggedFile = this.draggedNode.file,
				inFile = inNode.file;
		
		if (draggedFile != inFile) {
			if (inFile.isDir) {
				if (this.draggedNode.container.file.id != inFile.id) {
					if (!draggedFile.isDir || inFile.isServer || inFile.dir.indexOf(draggedFile.dir) == -1) {
						if (this.debug) this.log("target node");
						return true;
					} else {
						if (this.debug) this.log("target node is a child node");
					}
				} else {
					if (this.debug) this.log("target node is its own parent node");
				}
			} else {
				if (this.debug) this.log("target node is a file");
			}
		} else {
			if (this.debug) this.log("target node is itself");
		}
	
		return false;
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
				this.showErrorPopup($L("Internal Error ({error}) from filesystem service").replace("{error}", inError.toString()));
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
					this.showErrorPopup($L("Internal Error ({error}) from filesystem service").replace("{error}", inError.toString()));
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
		this.$.revertMove.hide();
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
	showRevertMoveButton: function() {
		this.$.revertMove.show();
		return this ;
	},
	hideRevertMoveButton: function() {
		this.$.revertMove.hide();
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
		inEvent.data.$.caption.addClass("hermesFileTree-select-highlight");
		// this.doSelect({file: this.selectedFile});
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	deselect: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		if (inEvent.data && inEvent.data.$.caption) {
			inEvent.data.$.caption.removeClass("hermesFileTree-select-highlight");
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
	 * @returns selected folder {hermes.Node} or containing folder {hermes.Node}
	 */
	getFolderOfSelectedNode: function() {
		var node = this.selectedNode;
		return node && !node.file.isDir ? this.selectedNode.container : node;
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
			this.showErrorPopup($L("Select a parent folder first"));
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
			this.showErrorPopup($L("Select a parent folder first"));
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
			this.showErrorPopup($L("Select a file or folder to copy first"));
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
			this.showErrorPopup($L("Select a file or folder to rename first"));
		}
	},
	// User Interaction for Delete File/Folder op
	deleteClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.selectedFile) {
			this.$.deletePopup.setType(this.selectedFile.isDir ? $L("folder") : $L("file"));
			this.$.deletePopup.setName(this.selectedFile.name);
			this.$.deletePopup.setNodeId(this.selectedFile.id);
			this.$.deletePopup.setPath(this.selectedFile.path);
			this.$.deletePopup.show();
		} else {
			this.showErrorPopup($L("Select a file or folder to delete first"));
		}
	},
	// User Interaction for Revert File/Folder moving op
	revertClick: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		if (this.revertMove) {
			this.$.revertPopup.setType(this.movedNode.file.isDir ? $L("folder") : $L("file"));
			this.$.revertPopup.setName(this.movedNode.file.name);
			this.$.revertPopup.setPath(this.originNode.file.path);
			this.$.revertPopup.show();
		} else {
			this.showErrorPopup($L("No more node moving to revert"));
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

			/* cancel any move reverting */
			this._resetRevert();
		});
		r.error(this, function(inSender, error) {
			if (error === 404){
				this.createFile(name, folderId);
				this.showErrorPopup($L("No template found for '.{extension}' files.  Created an empty one.").replace("{extension}", type));
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
				this.showErrorPopup($L("Creating file '{name}' failed: {error}").replace("{name}", name).replace("{error}", inError.toString()));
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

				/* cancel any move reverting */
				this._resetRevert();

				this.refreshFileTree(null, inFolder.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to create folder:", name, inError);
				this.showErrorPopup($L("Creating folder '{name}' failed: {error}").replace("{name}", name).replace("{error}", inError.toString()));
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

				/* cancel any move reverting */
				this._resetRevert();

				this.refreshFileTree(null, inNode.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to rename:", this.selectedFile, "into", newName, inError);
				this.showErrorPopup($L("Renaming file '{oldName}' as '{newName}' failed").replace("{oldName}", this.selectedFile.name).replace("{newName}", newName));
			});
	},
	/** @private */
	_revertCancel: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	_revertConfirm: function(inSender, inEvent) {
		if (this.debug) this.log("inSender:", inSender, "inEvent:", inEvent);
		if (this.debug) this.log("Reverting '" + this.movedNode.file.name + "' into '" + this.originNode.file.path + "'");
		this.moveNode(this.movedNode, this.originNode)
			.response(this, function(inSender, inNodeFile) {
				/* cancel any move reverting */
				this._resetRevert();
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to revert:", this.movedNode.file.name, "into", this.originNode.file.path, inError);
				this.showErrorPopup($L("Reverting '{name}' to '{oldpath}' failed").replace("{name}", this.movedNode.file.name).replace("{oldpath}", this.originNode.file.path));
			});
	},
	/** @private */
	_resetRevert: function() {
		this.movedNode=null;
		this.originNode=null;
		this.revertMove=false;
		this.hideRevertMoveButton();
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

				/* cancel any move reverting */
				this._resetRevert();

				this.refreshFileTree(null, inParentFolder.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to delete:", this.selectedFile, inError);
				this.showErrorPopup($L("Deleting '{name}' failed").replace("{oldName}", this.selectedFile.name));
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

				/* cancel any move reverting */
				this._resetRevert();

				this.refreshFileTree(null, inFsNode.id /*selectId*/);
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to copy:", this.selectedFile, "as", newName, inError);
				this.showErrorPopup($L("Creating file '{copyName}' as copy of '{name}' failed: {error}").replace("{copyName}", newName).replace("{name}", this.selectedFile.name).replace("{error}", inError.toString()));
			});
	},
	
	/**
	 * moveNode
	 * @public
	 * @param {Object} inNode
	 * @param {Object} inTarget
	 * @return null
	 *
	 */
	moveNode: function(inNode, inTarget) {
		if (this.debug) this.log("inNode", inNode, "inTarget", inTarget);
		
		var that = this;
		
		return this.$.service.rename(inNode.file.id, {folderId: inTarget.file.id})
			.response(this, function(inSender, inValue) {
				if (this.debug) this.log(inSender, "=>", inValue)
				var removedParentNode = inNode.container,
						removePkgNode = removedParentNode.getNodeNamed('package.js'),
						addParentNode = inTarget,
						addPkgNode = addParentNode.getNodeNamed('package.js');
						
				this.doTreeChanged({
					remove: {
						service: this.$.service,
						parentNode: removedParentNode && removedParentNode.file,
						pkgNode: removePkgNode && removePkgNode.file,
						node: inNode.file
					},
					add: {
						service: this.$.service,
						parentNode: addParentNode && addParentNode.file,
						pkgNode: addPkgNode && addPkgNode.file,
						node: inValue
					}
				});			

				inTarget.getChildren()
					.response(this, function(inSender, inNodes) {
						// FIXME: ENYO-2575 (scrollIntoView has unexpected issue)
						/*this.refreshFileTree(function() {
							that.$.scroller.scrollIntoView(inTarget.getNodeWithId(inValue.id), true);
						}, inValue.id);*/
						this.refreshFileTree(null, inValue.id);
					})
					.error(this, function() {
						this.log("error retrieving related node children");
					});
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to move:", inNode.file.name, inError);
				this.showErrorPopup($L("Moving  {nodeName} failed: {error}").replace("{nodeName}", inNode.file.name).replace("{error}", inError.toString()));
			});
	}
});
