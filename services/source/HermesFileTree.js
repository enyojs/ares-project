/**
 * Represents a file tree made with {hermes.Node}
 * 
 * @class HermesFileTree
 */

/* global Ares, ares */

enyo.kind({
	name: "HermesFileTree",
	kind: "FittableRows",
	events: {
		onError: "",
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onFileChanged: "",
		onFolderChanged: "",
		onTreeChanged: "",
		onPathChecked: ""
	},
	handlers: {
		onItemDown: "itemDown",
		onItemDragstart: "itemDragstart",
		onItemDragenter: "itemDragenter",
		onItemDragover: "itemDragover",
		onItemDragleave: "itemDragleave",
		onItemDrop: "itemDrop",
		onItemDragend: "itemDragend",
		onNodeDblClick: "nodeDblClick",
		onAdjustScroll: "adjustScroll"
	},
	published: {
		serverName: "",
		// allows filetree to have draggable subnodes or not (not per default).
		dragAllowed: false
	},
	fit:true,
	components: [
			{kind: "onyx.Toolbar", name: "hermesToolbar", classes:"ares-small-toolbar title-gradient", components: [
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
					{kind: "onyx.Tooltip", classes:"ares-tooltip-last", content: $L("Revert move...")}
				]}
		]},
		
		// Hermes tree, "serverNode" component will be added as HermesFileTree is created
		{kind: "Scroller", fit:"true", classes:"enyo-document-fit" },
		// track selection of nodes. here, selection Key is file or folderId.
		// Selection value is the node object. Is an Enyo kind
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},

		// service provide connection to file storage
		{name: "service", kind: "FileSystemService"},

		// Hermes popups
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "Service returned an error"},
		{name: "nameFilePopup", kind: "NamePopup", type: "file", fileName:"", placeHolder: $L("File Name"), onCancel: "newFileCancel", onConfirm: "newFileConfirm"},
		{name: "nameFolderPopup", kind: "NamePopup", type: "folder", fileName: "", placeHolder: $L("Folder Name"), onCancel: "newFolderCancel", onConfirm: "newFolderConfirm"},
		{name: "nameCopyPopup", kind: "NamePopup", title: $L("Name for copy of"), fileName: $L("Copy of foo.js"), onCancel: "copyFileCancel", onConfirm: "copyFileConfirm"},
		{name: "deletePopup", kind: "DeletePopup", onCancel: "deleteCancel", onConfirm: "deleteConfirm"},
		{name: "renamePopup", kind: "RenamePopup", title: $L("New name for "), fileName: "foo.js", onCancel: "renameCancel", onConfirm: "renameConfirm"},
		{name: "revertPopup", kind: "RevertPopup", title: $L("Revert node moving"), fileName: "foo.js", onCancel: "revertCancel", onConfirm: "revertConfirm"}
	],

	// warning: this variable duplicates an information otherwise stored in this.$.selection
	// BUT, retrieving it through this.$.selection.getSelected is not handy as this function
	// return an object (hash) which needs to be scanned to retrieve the selected value
	selectedNode: null,
	
	debug: false,
	packages: false,
	
	draggedNode: null,
	targetNode: null,

	movedNode: null,
	originNode: null,
	revertMove: false,
	
	holdoverTimeout:   null,
	holdoverTimeoutMS: 1000,
			
	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.enableDisableButtons();
		this.createComponent(
			{name: "serverNode", container: this.$.scroller, kind: "hermes.Node", classes: "enyo-unselectable hermesFileTree-root",
				showing: false, content: "server", icon: "$services/assets/images/antenna.png",
				expandable: true, expanded: true, collapsible: false, dragAllowed: this.dragAllowed
			}
		);
	},
	/** @private */
	itemDown: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		return true;
	},
	/** @private */
	itemDragstart: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
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

		var data = {};
		data.kind = this.draggedNode.kind;
		data.file = this.draggedNode.file;

		var dataText = enyo.json.stringify(data);		
		inEvent.dataTransfer.setData("Text", dataText);

		return true;
	},
	/** @private */
	itemDragenter: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		// look for the related hermes.Node
		var tempNode = inEvent.originator;
		if (tempNode.kind !== "hermes.Node") {
			tempNode = tempNode.parent;
		}
		
		// FIXME: ENYO-2786 MSIE 10 workaround to avoid parent of Control object that is a Control object too and produce an error in the console
		// BTW, objects dragged from elsewhere than HermesFileTree are discarded
		if (tempNode.kind !== "hermes.Node") {
			return true;
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
	/** @private */
	itemDragover: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		// discard any object that are not coming HermesFileTree
		if (!this.draggedNode) {
			return true;
		}
		
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
	/** @private */
	itemDragleave: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		return true;
	},
	/** @private */
	itemDrop: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		var dataText = inEvent.dataTransfer.getData("Text");
		if (dataText === "") {
			return true;
		}

		var data = enyo.json.parse(dataText);
		if (data.kind !== "hermes.Node") {
			return true;
		}
		
		var draggedNodeId = data.file.id;		
		this.trace('node dropped', draggedNodeId);
		
		if (!this.isValidDropTarget(this.targetNode)) {
			this.trace("target not valid");
		} else {
			if (this.draggedNode.content != "package.js") {
				var oldParentNode=this.draggedNode.container,
					newParentNode=this.targetNode;

				this.moveNode(this.draggedNode, this.targetNode)
					.response(this, function(inSender, inNodeFile) {
						newParentNode.updateNodes()
							.response(this, function(inSender, inNodes) {
								this.movedNode=newParentNode.getNodeWithId(inNodeFile.id);
								this.originNode=oldParentNode;
								this.revertMove=true;
								this.showRevertMoveButton();
							})
							.error(this, function() {
								this.warn("error retrieving related node children");
							});
					});
			} else {
				this.trace("'package.js' files cannot be moved");
			}
		}
		
		inEvent.dataTransfer.clearData();

		return true;
	},
	/** @private */
	itemDragend: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		if (this.targetNode.file.isDir && this.targetNode.expanded) {
			this.targetNode.removeClass("hermesFileTree-folder-highlight");
			this.$.selection.deselect(this.targetNode.file.id, this.targetNode);
		}
		
		this.resetHoldoverTimeout();
		this.draggedNode = null;
		this.targetNode = null;
		
		return true;
	},
	/** @private */
	setHoldoverTimeout: function (inTarget) {
		this.holdoverTimeout = setTimeout(enyo.bind(this, function() { this.holdOver(inTarget); }), this.holdoverTimeoutMS);
	},
	/** @private */
	resetHoldoverTimeout: function() {
		clearTimeout(this.holdoverTimeout);
		this.holdoverTimeout = null;
	},
	/** @private */
	holdOver: function (inTargetNode) {
		this.trace("inTargetNode=", inTargetNode);
		
		// expanding closed folder node...
		if (inTargetNode != this.draggedNode && inTargetNode.file.isDir && !inTargetNode.expanded) {
			this.$.selection.select(inTargetNode.file.id, inTargetNode);
			
			inTargetNode.setExpanded(true);
			// update icon for expanded state
			inTargetNode.setIcon("$services/assets/images/folder-open.png");
			inTargetNode.addClass("hermesFileTree-folder-highlight");
						
			// handle lazy-load when expanding
			inTargetNode.updateNodes().
				response(this, function() {
					inTargetNode.effectExpanded();
				});
		}
	},
	/** @private */
	isValidDropTarget: function(inNode) {
		this.trace("inNode=", inNode);
		
		var draggedFile = this.draggedNode.file,
				inFile = inNode.file;
		
		if (draggedFile != inFile) {
			if (inFile.isDir) {
				if (this.draggedNode.container.file.id != inFile.id) {
					if (!draggedFile.isDir || inFile.isServer || inFile.dir.indexOf(draggedFile.dir) == -1) {
						this.trace("target node");
						return true;
					} else {
						this.trace("target node is a child node");
					}
				} else {
					this.trace("target node is its own parent node");
				}
			} else {
				this.trace("target node is a file");
			}
		} else {
			this.trace("target node is itself");
		}
	
		return false;
	},
	/** @public */
	connectService: function(inService, next) {
		this.trace("connect to service: ", inService);
		this.projectUrlReady = false; // Reset the project information
		this.clear() ;
		this.$.service.connect(inService, enyo.bind(this, (function(err) {
			if (err) {
				if (next) {
					next(err);
				}
			} else {
				this.$.serverNode.file = this.$.service.getRootNode();
				this.$.serverNode.file.isServer = true;
				this.$.serverNode.setContent(this.$.serverNode.file.name);
				this.$.serverNode.setService(inService);
				if (next) {
					next();
				}
			}
		})));
		return this ;
	},
	/**
	 * @public
	 * @param {Object} inFsService a FileSystemService implementation, as listed in ProviderList
	 */
	connectProject: function(inProjectData, next) {
		this.trace("config:", inProjectData);
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
				this.showErrorPopup(this.$LS("Internal Error (#{error}) from filesystem service", {error: inError.toString()}));
			} else {
				if (this.selectedNode) {
					this.deselect(null, {data: this.selectedNode});
				}
				this.$.selection.clear();
				this.selectedNode = null;
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
					this.refreshFileTree( function() { if (next) {next();} else {that.$.selection.select( serverNode.file.id, serverNode );} });
				});
				req.error(this, function(inSender, inError) {
					this.projectData.setProjectUrl("");
					this.showErrorPopup(this.$LS("Internal Error (#{error}) from filesystem service", {error: inError.toString()}));
				});
			}
		})));

		this.packages = true;

		return this;
	},
	/** @public */
	disconnect: function() {
		this.trace("disconnect...");
		this.$.selection.clear();
		this.selectedNode = null;
		this.projectUrlReady = false; // Reset the project information
		this.clear() ;
		this.$.serverNode.file = null;
		return this ;
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
	showToolbar: function(show) {
		this.$.hermesToolbar.setShowing(show);
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
	/** @private */
	clear: function() {
		var server = this.$.serverNode;
		this.trace("clearing serverNode") ;
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
			this.trace("reseting serverNode") ;
			this.updateNodes(this.$.serverNode);
		}
		return this ;
	},
	/** @private */
	adjustScroll: function (inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		var node = inEvent.originator;
		// FIXME: Due to unexpected UI behaviour ENYO-2575, scrollIntoView method is overridden...
		//this.$.scroller.scrollIntoView(node, true);
		this.scrollToHermesNode(node, true);

		return true;
	},
	/** 
	 * scrollToHermesNode: Scroll an Hermes node into scroller view
	 * @private 
	 * @param  {hermes.Node} inNode: Hermes node to scroll to
	 * @param  {Boolean} inAlignWithTop: if true, node is aligned to its top, if false (default), to its bottom
	*/
	scrollToHermesNode: function (inNode, inAlignWithTop) {
		this.trace("inNode", inNode, "inAlignWithTop", inAlignWithTop);

		var scrollerBounds = this.$.scroller.getScrollBounds();
		var scrollNode = inNode;
		var scrollBounds = {height: 0, width: 0, top: 0, left: 0};

		var first = true;
		var height = 0;
		
		while (scrollNode && scrollNode.container && scrollNode.container.id != this.$.scroller.id) {	
			// get the offset of the node related to the hermes.Node
			var node = scrollNode.hasNode();
			var nodeBounds = {height: node.offsetHeight, width: node.offsetWidth, top: node.offsetTop, left: node.offsetLeft};
			
			// get the height took by the whole sibling hermes nodes
			var siblingNode = scrollNode.node;
			var siblingBounds = {height: 0, width: 0, top: 0, left: 0};
			
			while (siblingNode) {
				siblingBounds = {height: siblingNode.offsetHeight, width: siblingNode.offsetWidth, top: siblingNode.offsetTop, left: siblingNode.offsetLeft};
				siblingNode = siblingNode.nextSibling;
			}
			
			// get the height of the container
			var scrollNodeContainer = scrollNode.container;
			var containerNode = scrollNodeContainer.hasNode();
			var containerBounds = {height: 0, width: 0, top: 0, left: 0};

			if (scrollNodeContainer.id != this.$.scroller.id) {
				containerBounds = {height: containerNode.offsetHeight, width: containerNode.offsetWidth, top: containerNode.offsetTop, left: containerNode.offsetLeft};
			}
			
			// keep the height of the hermes.Node to scroll to
			if (first) {
				height = nodeBounds.height;
				first = false;
			}
			
			// keep the add up of the offsets between the Control to scroll to and the Scroller Control
			scrollBounds.height = node.offsetHeight;
			scrollBounds.width = node.offsetWidth;
			scrollBounds.top += (containerBounds.height - siblingBounds.top - siblingBounds.height + nodeBounds.top);
			scrollBounds.left += (- siblingBounds.left + nodeBounds.left);

			// go to parent hermes.Node
			scrollNode = scrollNode.container;
		}

		// By default, the hermes.Node is scrolled to align with the top of the scroll area.
		this.$.scroller.setScrollTop(Math.min(scrollerBounds.maxTop, inAlignWithTop === false ? scrollerBounds.maxTop - (scrollerBounds.height - scrollBounds.top) + height : scrollBounds.top));
		this.$.scroller.setScrollLeft(Math.min(scrollerBounds.maxLeft, inAlignWithTop === false ? scrollBounds.left - scrollerBounds.clientWidth + scrollBounds.width : scrollBounds.left));
	},
	nodeTap: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
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
	/** @private */
	nodeDblClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		var node = inEvent.originator;
		// projectUrl in this.projectData is set asynchronously.  Do not try to
		// open anything before it is available.  Also do not
		// try to open top-level root & folders.
		if (!node.file.isDir && !node.file.isServer && this.projectUrlReady) {
			this.doFileDblClick({
				file: node.file,
				projectData: this.projectData
			});
		}

		// handled here (don't bubble)
		return true;
	},
	
	select: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		this.selectedNode=inEvent.data;
		inEvent.data.$.caption.addClass("hermesFileTree-select-highlight");
		
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	deselect: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		if (inEvent.data && inEvent.data.$.caption) {
			inEvent.data.$.caption.removeClass("hermesFileTree-select-highlight");
		}
		
		this.selectedNode=null;
		this.enableDisableButtons();
		// handled here (don't bubble)
		return true;
	},
	copyName: function(inName) {
		return "Copy of "+inName;
	},
	reloadClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		this.refreshFileTree();
	},

	asyncTracker: function(callBack) {
		var count = 0 ;
		var that = this ;
		this.trace("tracker created") ;
		return {
			inc: function() {
				count ++ ;
				that.trace("tracker inc ", count) ;
				return count;
			},
			dec: function( val ){
				count-- ;
				that.trace("tracker dec", count) ;
				if (count === 0 && callBack) {
					that.trace("running tracker call-back") ;
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
			this.warn("refreshFileTree: internal error, toSelectId ", toSelectId, " does not look like an Id");
		}

		var tracker = this.asyncTracker(
			function() {
				this.$.serverNode.render() ;
				if (callBack) { callBack() ; }
			}.bind(this)
		) ;

		this.trace("refreshFileTree called") ;

		this.$.serverNode.refreshTree(tracker,0, toSelectId) ;

		this.trace("refreshFileTree done") ;
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
	/** @private */
	// User Interaction for New Folder op
	newFolderClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		var folder = this.getFolder();
		this.trace("on folder ",folder);
		if (this.$.serverNode && this.$.serverNode.file) {
			if (folder && folder.isDir) {
				this.$.nameFolderPopup.setFileName("");
				this.$.nameFolderPopup.setFolderId(folder.id);
				this.$.nameFolderPopup.setPath(folder.path);
				this.$.nameFolderPopup.show();
			} else {
				this.showErrorPopup($L("Select a parent folder first"));
			}
		} else {
			this.showErrorPopup($L("Select a file system first"));
		}
	},
	/** @private */
	newFolderCancel: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	newFolderConfirm: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		var folderId = inEvent.folderId;
		var name = inSender.fileName.trim();

		if (!this.checkedPath(name)) {
			return true;
		}

		this.trace("Creating new folder ", name," into folderId=", folderId);
		var req = this.$.service.createFolder(folderId, name, { overwrite: false })
			.response(this, function(inSender, inFolder) {
				this.trace("inFolder: ", inFolder);
				var parentNode = this.getFolderOfSelectedNode(),
				    pkgNode = parentNode.getNodeNamed('package.js');
				
				if (!parentNode.expanded) {
					parentNode.setExpanded(true);
					// update icon for expanded state
					parentNode.setIcon("$services/assets/images/folder-open.png");
								
					// handle lazy-load when expanding
					parentNode.updateNodes().
						response(this, function() {
							parentNode.effectExpanded();
						});
				}

				if (this.packages) {
					this.doTreeChanged({
						add: {
							service: this.$.service,
							parentNode: parentNode && parentNode.file,
							pkgNode: pkgNode && pkgNode.file,
							node: inFolder
						}
					});
				} 

				/* cancel any move reverting */
				this.resetRevert();

				this.refreshFileTree( function()  {parentNode.getNodeWithId(inFolder.id).doAdjustScroll(); }, inFolder.id /*selectId*/ );
			});
		req.error(this, this._handleXhrError.bind(this, "Unable to create folder '" + name + "'", null /*next*/));
	},

	/**
	 * Shared enyo.Ajax error handler
	 * @private
	 */
	_handleXhrError: function(message, next, inSender, inError) {
		var response = inSender.xhrResponse, contentType, html, text;
		if (response) {
			contentType = response.headers['content-type'];
			if (contentType) {
				if (contentType.match('^text/plain')) {
					text = response.body;
				}
				if (contentType.match('^text/html')) {
					html = response.body;
				}
			}
		}
		var err = new Error(message + " (" + inError.toString() + ")");
		err.html = html;
		err.text = text;
		err.status = response.status;
		this.doError({ msg: message, err: err});
		if (typeof next === 'function') {
			next(err);
		}
	},

	/** @private */
	// User Interaction for New File op
	newFileClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
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
	/** @private */
	newFileCancel: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		this.trace("New File canceled.");
	},
	/** @private */
	newFileConfirm: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		var folderId = inEvent.folderId;
		var name = inEvent.name.trim();

		if (!this.checkedPath(name)) {
			return true;
		}

		var nameStem = name.substring(0, name.lastIndexOf(".")); // aka basename
		var type = name.substring(name.lastIndexOf(".")+1); // aka suffix
		var templatePath;
		var location = window.location.toString();
		var prefix = location.substring(0, location.lastIndexOf("/")+1);

		var folder = this.getFolderOfSelectedNode();
		var nodeUpdate = folder.updateNodes();
		nodeUpdate.response(this, function() {
			var matchFileName = function(node){
				return (node.content === name ) ;
			};

			var matchingNodes = folder.getNodeFiles().filter(matchFileName) ;

			if (matchingNodes.length !== 0) {
				this.showErrorPopup(this.$LS("File '#{name}' already exists", {name: name}));
				return true;
			}

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
				this.trace("newFileConfirm response: ", inResponse);
				for (var n in replacements) {
					inResponse = inResponse.replace(n, replacements[n]);
				}
				this.createFile(name, folderId, inResponse);

				/* cancel any move reverting */
				this.resetRevert();
			});
			r.error(this, function(inSender, error) {
				if (error === 404){
					this.createFile(name, folderId);
					this.showErrorPopup(this.$LS("No template found for '.#{extension}' files.  Created an empty one.", {extension: type}));
				}
				else {
					this.warn("error while fetching ", templatePath, ': ', error);
				}
			});
			r.go();
		});
		nodeUpdate.error(this, function() {
			this.showErrorPopup($L("Cannot reach filesystem"));
			return true;
		});
	},
	/** @private */
	// User Interaction for Copy File/Folder op
	copyClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		if (this.selectedNode) {
			this.$.nameCopyPopup.setType(this.selectedNode.file.type);
			this.$.nameCopyPopup.setFileName(this.copyName(this.selectedNode.file.name));
			this.$.nameCopyPopup.setPath(this.selectedNode.file.path);
			this.$.nameCopyPopup.setFolderId(this.selectedNode.file.id);
			this.$.nameCopyPopup.show();
		} else {
			this.showErrorPopup($L("First select a file or folder to copy"));
		}
	},
	/** @private */
	copyFileCancel: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
	},
	/** @private */
	copyFileConfirm: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		var oldName = this.selectedNode.file.name;
		var newName = inSender.fileName.trim();

		if (!this.checkedPath(newName)) {
			return true;
		}

		this.trace("Creating new file ", newName, " as copy of", oldName);
		this.$.service.copy(this.selectedNode.file.id, {
			name: newName,
			overwrite: false
		})
			.response(this, function(inSender, inFsNode) {
				this.trace("inNode: ", inFsNode);
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
				this.resetRevert();

				this.refreshFileTree( function() { parentNode.getNodeWithId(inFsNode.id).doAdjustScroll(); }, inFsNode.id /*selectId*/ );
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to copy:", this.selectedNode.file, "as", newName, inError);
				this.showErrorPopup(this.$LS("Creating file '#{copyName}' as copy of '#{name}' failed: #{error}", {copyName: newName, name: this.selectedNode.file.name, error: inError.toString()}));
			});
	},
	/** @private */
	// User Interaction for Rename File/Folder op
	renameClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		if (this.selectedNode) {
			this.$.renamePopup.setType(this.selectedNode.file.type);
			this.$.renamePopup.setFileName(this.selectedNode.file.name);
			this.$.renamePopup.setFolderId(this.selectedNode.file.id);
			this.$.renamePopup.setPath(this.selectedNode.file.path);
			this.$.renamePopup.show();
		} else {
			this.showErrorPopup($L("Select a file or folder to rename first"));
		}
	},
	/** @private */
	renameCancel: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	renameConfirm: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		var newName = inSender.fileName.trim();

		if (!this.checkedPath(newName)) {
			return true;
		}

		this.trace("Renaming '", this.selectedNode.file, "' as '", newName, "'");
		this.$.service.rename(this.selectedNode.file.id, {
			name: newName,
			overwrite: false
		})
			.response(this, function(inSender, inNode) {
				this.trace("inNode: ",inNode);
				var parentNode = this.getParentNodeOfSelected(),
				    pkgNode = parentNode.getNodeNamed('package.js');

				if (!this.selectedNode.file.isServer && this.projectUrlReady) {
					if (!this.selectedNode.file.isDir) {
						this.doFileChanged({id: Ares.Workspace.files.computeId(this.selectedNode.file)});
					} else {
						this.doFolderChanged({file: this.selectedNode.file, projectData: this.projectData});
					}
				}

				this.doTreeChanged({
					remove: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: this.selectedNode.file
					},
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inNode
					}
				});

				/* cancel any move reverting */
				this.resetRevert();

				this.refreshFileTree( function() { parentNode.getNodeWithId(inNode.id).doAdjustScroll(); }, inNode.id /*selectId*/ );
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to rename:", this.selectedNode.file, "into", newName, inError);
				this.showErrorPopup(this.$LS("Renaming file '#{oldName}' as '#{newName}' failed", {oldName: this.selectedNode.file.name, newName: newName}));
			});
	},
	/** @private */
	// User Interaction for Delete File/Folder op
	deleteClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		if (this.selectedNode) {
			this.$.deletePopup.setType(this.selectedNode.file.isDir ? $L("folder") : $L("file"));
			this.$.deletePopup.setName(this.selectedNode.file.name);
			this.$.deletePopup.setNodeId(this.selectedNode.file.id);
			this.$.deletePopup.setPath(this.selectedNode.file.path);
			this.$.deletePopup.show();
		} else {
			this.showErrorPopup($L("Select a file or folder to delete first"));
		}
	},
	/** @private */
	deleteCancel: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
	},
	/** @private */
	deleteConfirm: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		var serverNode = this.$.serverNode;
		var parentNode = this.getParentNodeOfSelected(),
		    pkgNode = parentNode.getNodeNamed('package.js');
		this.$.service.remove(this.selectedNode.file.id)
			.response(this, function(inSender, inParentFolder) {
				this.trace("inParentFolder: ", inParentFolder);

				if (!this.selectedNode.file.isServer && this.projectUrlReady) {
					if (!this.selectedNode.file.isDir) {
						this.doFileChanged({id: Ares.Workspace.files.computeId(this.selectedNode.file)});
					} else {
						this.doFolderChanged({file: this.selectedNode.file, projectData: this.projectData});
					}
				}
				
				this.doTreeChanged({
					remove: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: this.selectedNode.file
					}
				});

				/* cancel any move reverting */
				this.resetRevert();

				serverNode.resized();

				this.refreshFileTree( function() { parentNode.doAdjustScroll(); }, parentNode.file.id /*selectId*/ );
				if (parentNode === serverNode) {
					this.$.selection.select(serverNode.file.id, serverNode);
				}
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to delete:", this.selectedNode.file, inError);
				this.showErrorPopup(this.$LS("Deleting '#{name}' failed", {name: this.selectedNode.file.name}));
			});
	},
	/** @private */
	// User Interaction for Revert File/Folder moving op
	revertClick: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		if (this.revertMove) {
			this.$.revertPopup.setType(this.movedNode.file.isDir ? $L("folder") : $L("file"));
			this.$.revertPopup.setName(this.movedNode.file.name);
			this.$.revertPopup.setPath(this.originNode.file.path);
			this.$.revertPopup.show();
		} else {
			this.showErrorPopup($L("No more node moving to revert"));
		}
	},
	/** @private */
	revertCancel: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
	},
	/** @private */
	revertConfirm: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		this.trace("Reverting '", this.movedNode.file.name, "' into '", this.originNode.file.path, "'");

		this.moveNode(this.movedNode, this.originNode)
			.response(this, function(inSender, inNodeFile) {
				/* cancel any move reverting */
				this.resetRevert();
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to revert:", this.movedNode.file.name, "into", this.originNode.file.path, inError);
				this.showErrorPopup($L("Reverting '{name}' to '{oldpath}' failed", {name: this.movedNode.file.name, oldpath: this.originNode.file.path}));
			});
	},

	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	enableDisableButtons: function() {
		if (this.selectedNode) {
			this.$.deleteFileButton.setDisabled(this.selectedNode.file.isServer);
			this.$.copyFileButton.setDisabled(this.selectedNode.file.isServer);
			this.$.renameFileButton.setDisabled(this.selectedNode.file.isServer);
		} else {
			this.$.copyFileButton.setDisabled(true);
			this.$.deleteFileButton.setDisabled(true);
			this.$.renameFileButton.setDisabled(true);
		}
	},

	delayedRefresh: function(msg, forceSelect) {
		var onDone = new enyo.Async() ;
		onDone.response(this, function(inSender, toSelectId) {
			var select = forceSelect || toSelectId ;
			this.trace("delayed refresh after ", msg, ' on ', select) ;
			this.refreshFileTree(null, select);
		}) ;
		return onDone ;
	},

	createFile: function(name, folderId, content) {
		this.trace("Creating new file ",name," into folderId=",folderId);

		var req = this.$.service.createFile(folderId, name, content, { overwrite: false })
			.response(this, function(inSender, inNodes) {
				this.trace("inNodes: ",inNodes);
				var parentNode = this.getFolderOfSelectedNode(),
				    pkgNode = parentNode.getNodeNamed('package.js');

				if (!parentNode.expanded) {
					parentNode.setExpanded(true);
					// update icon for expanded state
					parentNode.setIcon("$services/assets/images/folder-open.png");
								
					// handle lazy-load when expanding
					parentNode.updateNodes().
						response(this, function() {
							parentNode.effectExpanded();
						});
				}

				this.doTreeChanged({
					add: {
						service: this.$.service,
						parentNode: parentNode && parentNode.file,
						pkgNode: pkgNode && pkgNode.file,
						node: inNodes[0]
					}
				});

				/* cancel any move reverting */
				this.resetRevert();

				this.refreshFileTree( function() { parentNode.getNodeWithId(inNodes[0].id).doAdjustScroll(); }, inNodes[0].id );
			});
		req.error(this, this._handleXhrError.bind(this, "Unable to create file '" + name + "'", null /*next*/));
	},
	
	/** @private */
	resetRevert: function() {
		this.movedNode=null;
		this.originNode=null;
		this.revertMove=false;
		this.hideRevertMoveButton();
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
		this.trace("inNode", inNode, "inTarget", inTarget);
		
		return this.$.service.rename(inNode.file.id, {
			folderId: inTarget.file.id,
			overwrite: false
		})
			.response(this, function(inSender, inValue) {
				this.trace(inSender, "=>", inValue);
				var removedParentNode = inNode.container,
						removePkgNode = removedParentNode.getNodeNamed('package.js'),
						addParentNode = inTarget,
						addPkgNode = addParentNode.getNodeNamed('package.js');

				if (!inNode.file.isServer && this.projectUrlReady) {
					if (!inNode.file.isDir) {
						this.doFileChanged({id: Ares.Workspace.files.computeId(inNode.file)});
					} else {
						this.doFolderChanged({file: inNode.file, projectData: this.projectData});
					}
				}

				if (!addParentNode.expanded) {
					addParentNode.setExpanded(true);
					// update icon for expanded state
					addParentNode.setIcon("$services/assets/images/folder-open.png");
								
					// handle lazy-load when expanding
					addParentNode.updateNodes().
						response(this, function() {
							addParentNode.effectExpanded();
						});
				}

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

				this.refreshFileTree( function() { inTarget.getNodeWithId(inValue.id).doAdjustScroll(); }, inValue.id );
			})
			.error(this, function(inSender, inError) {
				this.warn("Unable to move:", inNode.file.name, inError);
				this.showErrorPopup(this.$LS("Moving #{nodeName} failed: #{error}", {nodeName: inNode.file.name, error: inError.toString()}));
			});
	},
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
	},
	gotoNodePath: function (nodePath) {
		var track = this.$.serverNode,
			waypoints = [],
			i,
			nodes = nodePath.split("/");

		var next = (function(inErr) {
			if (inErr) {
				this.warn("Path following failed", inErr);
			} else {
				for (i = 1; i < waypoints.length; i++) {
					if (waypoints[i].file.isDir) {
						waypoints[i-1].getNodeWithId(waypoints[i].file.id).setExpanded(true).doExpand();
					}
				}

				this.refreshFileTree( function() { waypoints[i-1].doAdjustScroll(); }, waypoints[i-1].file.id );
			}
		}).bind(this);

		nodes.shift();
		waypoints.push(track);
		track.followNodePath(nodes, waypoints, next);
	},
	checkNodePath: function (nodePath) {
		var track = this.$.serverNode,
			waypoints = [],
			nodes = nodePath.split("/"),
			l = nodes.length;
		
		var next = (function(inErr) {
			if (inErr) {
				this.warn("Path following failed", inErr);
				this.doPathChecked({status: false});
				return false;
			} else {
				if (waypoints.length == l) {
					this.doPathChecked({status: true});
				} else {
					this.doPathChecked({status: false});
				}
			}
		}).bind(this);

		nodes.shift();
		waypoints.push(track);
		track.followNodePath(nodes, waypoints, next);
	},
	/** @public */
	checkNodeName: function (nodeName, next) {
		var track = this.$.serverNode,
			waypoints = [],
			nodes = nodeName.split("/"),
			l = nodes.length;
		
		var callback = (function(inErr) {
			if (inErr) {
				this.warn("Node does not exist", inErr);
				next(false);
			} else {
				if (waypoints.length == l) {
					next(true);
				} else {
					next(false);
				}
			}
		}).bind(this);

		nodes.shift();
		waypoints.push(track);
		track.followNodePath(nodes, waypoints, callback);
	},
	/* @private */
	checkedPath: function(path) {
		var illegal = /[<>\/\\!?$%&*,]/i;

		if (path.match(illegal)) {
			this.showErrorPopup(this.$LS("Path #{path} contains illegal characters", {path: path}));
			return false;
		}

		return true;
	}
});
