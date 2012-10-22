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
		onNodeDblClick: "nodeDblClick",
	},
	published: {
		serverName: "",
	},
	components: [
		{kind: "onyx.Toolbar", classes: "onyx-menu-toolbar", style: "height: 66px; width: 100%;", components: [
			{content: "Files", style: "margin-right: 10px"},
			{name: "newFolder", kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$harmonia/images/folder_new.png", onclick: "newFolderClick"},
				{kind: "onyx.Tooltip", content: "New Folder..."},
			]},
			{name: "reloadAll", kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$harmonia/images/folder_reload.png", onclick: "reloadClick"},
				{kind: "onyx.Tooltip", content: "reload ..."},
			]},
			{name: "newFile", kind: "onyx.TooltipDecorator", components: [		    
				{kind: "onyx.IconButton", src: "$harmonia/images/document_new.png", onclick: "newFileClick"},
				{kind: "onyx.Tooltip", content: "New File..."},
			]},
			{name: "renameFile", kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/document_edit.png", onclick: "renameClick"},
				{kind: "onyx.Tooltip", content: "Rename..."},
			]},
			{name: "copyFile", kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/copy.png", onclick: "copyClick"},
				{kind: "onyx.Tooltip", content: "Copy..."},
			]},
			{name: "deleteFile", kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/document_delete.png", onclick: "deleteClick"},
				{kind: "onyx.Tooltip", content: "Delete..."},		        
			]}
		]},

		{kind: "Scroller", fit: true, components: [
			{name: "serverNode", kind: "Node", classes: "enyo-unselectable", showing: false, file: {id: "", name: "server", isServer: true, service: null}, content: "server", icon: "$service/images/antenna.png", expandable: true, expanded: true, onExpand: "nodeExpand", onNodeTap: "nodeTap"}
		]},
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},
		{name: "service", kind: "FileSystemService"},
		{name: "errorPopup", kind: "onyx.Popup", modal: true, centered: true, floating: true, components: [
			{tag: "h3", content: "Oh, no!"},
			{name: "errorMsg", content: "Service returned an error"},
			{kind : "onyx.Button", content : "OK", ontap : "hideErrorPopup"}
		]},
		{name: "nameFilePopup", kind: "NamePopup", type: "file", fileName:"", placeHolder: "File Name", onCancel: "newFileCancel", onConfirm: "newFileConfirm"},
		{name: "nameFolderPopup", kind: "NamePopup", type: "folder", fileName: "", placeHolder: "Folder Name", onCancel: "newFolderCancel", onConfirm: "newFolderConfirm"},
		{name: "nameCopyPopup", kind: "NamePopup", title: "Name for copy of", fileName: "Copy of foo.js", onCancel: "copyFileCancel", onConfirm: "copyFileConfirm"},
		{name: "deletePopup", kind: "DeletePopup", onCancel: "deleteCancel", onConfirm: "deleteConfirm"},
		{name: "renamePopup", kind: "RenamePopup", title: "New name for ", fileName: "foo.js", onCancel: "renameCancel", onConfirm: "renameConfirm"}
	],
	selectedFile: null,
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * @param {Object} inFsService a FileSystemService implementation, as listed in ProviderList
	 */
	setConfig: function(inConfig) {
		this.log(inConfig);
		this.project = null;		// Reset the project information
		var serverNode = this.$.serverNode;
		this.$.service.connect(inConfig && inConfig.fs);
		if (!inConfig || !inConfig.nodeName || !inConfig.folderId || !this.$.service.isOk()) {
			this.reset();
			return;
		}
		this.project = inConfig.folderId.replace(/%2F/g,"/"); // TODO YDM temporary hack to discuss with FiX
		serverNode.hide();
		if (this.$.service.isOk()) {
			if (inConfig.nodeName !== null) {
				serverNode.setContent(inConfig.nodeName);
				serverNode.file = {id: inConfig.folderId, name: inConfig.nodeName, isDir: true, isServer:true, path: inConfig.nodeName, service: null};
				this.$.selection.select(inConfig.folderId, serverNode);
				serverNode.setExpanded(true);
				serverNode.effectExpanded();
			}
			this.updateNodesFromFileList(serverNode);
			serverNode.render() ;
		}
	},
	fileOps2Hide: function(inVal) {
		if (inVal === true) {
			this.$.newFolder.hide();
		}
		this.$.newFile.hide();
		this.$.reloadAll.hide();
		this.$.renameFile.hide();
		this.$.copyFile.hide();
		this.$.deleteFile.hide();
	}, 
	fileOps2Show: function() {
		this.$.newFolder.show();
		this.$.reloadAll.show();
		this.$.newFile.show();
		this.$.renameFile.show();
		this.$.copyFile.show();
		this.$.deleteFile.show();
	}, 
	reset: function() {
		this.$.serverNode.hide();
		if (this.$.service.isOk()) {
			this.listFiles(this.$.serverNode);
		}
	},
	//
	// probably should be in a Tree kind
	nodeTap: function(inSender, inEvent) {
		this.log("node tapped") ;
		var node = inEvent.originator;
		this.$.selection.select(node.id, node);
		if (!node.file.isDir) {
			this.doFileClick({file: node.file});
		} else {
			this.doFolderClick({file: node.file});
		}
		// handled here (don't bubble)
		return true;
	},
	nodeDblClick: function(inSender, inEvent) {
		var node = inEvent.originator;
		if (!node.file.isDir && !node.file.isServer) {
			this.doFileDblClick({file: node.file, service: this.$.service, project: this.project});
		}
		// handled here (don't bubble)
		return true;
	},
	select: function(inSender, inEvent) {
		this.selectedFile=inEvent.data.file;
		inEvent.data.file.service = this.$.service;
		inEvent.data.$.caption.applyStyle("background-color", "lightblue");
		this.doSelect({file: this.selectedFile});
		// handled here (don't bubble)
		return true;
	},
	deselect: function(inSender, inEvent) {
		inEvent.data.$.caption.applyStyle("background-color", null);
		this.doDeselect({file: this.selectedFile});
		this.selectedFile=null;
		// handled here (don't bubble)
		return true;
	},
	updateNodesFromFileList: function(inNode) {
		this.startLoading(inNode);
		this.log(inNode) ;
		return this.$.service.listFiles(inNode.file.id)
			.response(this, function(inSender, inFiles) {
				var sortedFiles = inFiles.sort(this.fileNameSort) ;
				if (inFiles && !this.$.serverNode.showing) {
					this.$.serverNode.show();
				}
				
				//if (inFiles && !this.compareFiles(inNode.files, sortedFiles)) {
					this.log("updating node content of " + inNode.name ) ;
					this.updateNodeContent(inNode, sortedFiles);
					inNode.render() ;
				//}
			})
			.response(this, function() {
				this.stopLoading(inNode);
			})
			.error(this, function() {
				this.stopLoading(inNode);
			})
			;
	},
	startLoading: function(inNode) {
		inNode.$.extra.setContent('&nbsp;<img src="' + enyo.path.rewrite("$service/images/busy.gif") + '"/>');
	},
	stopLoading: function(inNode) {
		inNode.$.extra.setContent("");
	},
    updateNodeContent: function(inNode, files) {
		var i = 0 , nfiles, rfiles, res, modified = 0, newControl ;
		rfiles = this.filesToNodes(files) ; // with prefix in name

		do {
			nfiles = this.getNodeFiles(inNode) ;

			this.log("considering node " + (nfiles[i] ? nfiles[i].name : '<none>')
					 + ' and file '      + (rfiles[i] ? rfiles[i].name : '<none>') );

			res = i >= nfiles.length ? 1 
			    : i >= rfiles.length ? -1 
			    :                      this.fileNameSort(nfiles[i], rfiles[i]) ; 

			// remember that these file lists are sorted
			switch(res) {
				case -1: // remote file removed
				    this.log(nfiles[i].name + " was removed") ;
				    inNode.removeControl(nfiles[i]) ;
				    modified = 1;
					// node file list reduced by one, must not increment i
					break ;

				case 0: // no change
					i++ ;
					break ;

				case 1: // file added
				    this.log(rfiles[i].name + " was added") ;
					newControl = inNode.createComponent( rfiles[i] ) ;
					if (nfiles[i]) {
						var justAdded = inNode.controls.pop() ;
						inNode.controls.splice(i+4, 0, justAdded);
					}
				    modified = 1;
					i++ ;
					break ;
			}
		} while ( i < nfiles.length || i < rfiles.length) ;

		if (modified) {
			inNode.$.client.render();
		}
	},
	compareFiles: function(inFilesA, inFilesB) {
		if (inFilesA.length != inFilesB.length) {
			return false;
		}
		for (var i in inFilesA) {
			var f0 = inFilesA[i], f1 = inFilesB[i];
			if (f0.id !== f1.id) {
				this.log("returning false for " + f0.id + ' and ' + f1.id ) ;
				return false;
			}
		}
		return true;
	},
	// Sort files by name, case-insensitively
	// TODO: I18N, and possibly platform-specific sort order
	fileNameSort: function(a, b) {
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
    getNodeFiles: function(inNode) {
		var hasPrefix = function(e){ 
			return (e.name.slice(0,1) === '$') ;
		} ;
		return inNode.getControls().filter( hasPrefix ).sort(this.fileNameSort) ;
	},
	filesToNodes: function(inFiles) {
		var nodes = [];
		inFiles.sort(this.fileNameSort); // TODO: Other sort orders
		for (var i=0, f; f=inFiles[i]; i++) {
			nodes.push({
				file: f,
				name: '$' + f.name, // prefix avoids clobberring non-files components like icon
				content: f.name,
				expandable: f.isDir,
				icon: "$service/images/" + (f.isDir ? "folder.png" : "file.png")
			});
		}
		return nodes;
	},
	nodeExpand: function(inSender, inEvent) {
		// the originating node is arbitrarily deep
		var node = inEvent.originator;
		this.log("nodeExpand called while node Expanded is " + node.expanded) ;
		// update icon for expanded state
		if (node.file.isDir) {
			node.setIcon("$service/images/" + (node.expanded ? "folder-open.png" : "folder.png"));
		}
		// handle lazy-load when expanding
		if (node.expanded) {
			this.updateNodesFromFileList(node).
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
	    this.refreshFileTree();
	},
	refreshFileTree: function(node) {
		this.log(this) ;
		var target = node || this.$.serverNode ;
		if (target.kind !== 'Node') {
			alert('internal error: refreshFileTree called with kind ' 
				  + target.kind + ' instead of Node') ;
			return ;
		}
		this.log('running refreshFileTree on ' + target.kind + ' with ' 
				 + target.controls.length + ' controls with content ' + target.content);

		this.$.selection.select(target.id, target);
		this.updateNodesFromFileList(target).
			response(this, function(inSender, inFiles) {
				// expand node if it has clients (sub-nodes) and is expanded
				target.effectExpanded();

				enyo.forEach(this.getNodeFiles(target), function(f) {
					var c = target.$[f.name] ;
					this.log('running INNER function of refreshFileTree on ' + f.name);
					this.$.selection.select(c.id, c);
					c.effectExpanded() ;
					if (f.isDir) {
						this.refreshFileTree(c);
					}
				}, this);
			});
	},
	// User Interaction for New File op
	newFileClick: function(inSender, inEvent) {
		this.$.nameFilePopup.setFileName(" ");
		this.$.nameFilePopup.setFolderId(this.selectedFile.id);
		this.$.nameFilePopup.setPath(this.selectedFile.path);
		this.$.nameFilePopup.show();
	},
	newFileConfirm: function(inSender, inEvent) {
		this.doNewFileConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	newFileCancel: function(inSender, inEvent) {
		this.log("New File canceled.");
	},
	// User Interaction for New Folder op
	newFolderClick: function(inSender, inEvent) {
		this.$.nameFolderPopup.setFolderId(this.selectedFile.id);
		this.$.nameFolderPopup.setPath(this.selectedFile.path);
		this.$.nameFolderPopup.show();
	},
	newFolderConfirm: function(inSender, inEvent) {
		this.doNewFolderConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	newFolderCancel: function(inSender, inEvent) {
		this.log("New Folder canceled.");
	},
	// User Interaction for Copy File/Folder op
	copyClick: function(inSender, inEvent) {
		this.$.nameCopyPopup.setType(this.selectedFile.type);
		this.$.nameCopyPopup.setFileName(this.copyName(this.selectedFile.name));
		this.$.nameCopyPopup.setPath(this.selectedFile.path);
		this.$.nameCopyPopup.setFolderId(this.selectedFile.id);
		this.$.nameCopyPopup.show();
	},
	copyFileConfirm: function(inSender, inEvent) {
		this.doCopyFileConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	copyFileCancel: function(inSender, inEvent) {
		this.log("Copy file canceled.");
	},
	// User Interaction for Rename File/Folder op
	renameClick: function(inSender, inEvent) {
		this.$.renamePopup.setType(this.selectedFile.type);
		this.$.renamePopup.setFileName(this.selectedFile.name);
		this.$.renamePopup.setFolderId(this.selectedFile.id);
		this.$.renamePopup.setPath(this.selectedFile.path);
		this.$.renamePopup.show();
	},
	renameConfirm: function(inSender, inEvent) {
		this.doRenameConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	renameCancel: function(inSender, inEvent) {
		this.log("rename file canceled.");
	},
	// User Interaction for Delete File/Folder op
	deleteClick: function(inSender, inEvent) {
		this.$.deletePopup.setType(this.selectedFile.isDir ? 'folder' : 'file');
		this.$.deletePopup.setName(this.selectedFile.name);
		this.$.deletePopup.setNodeId(this.selectedFile.id);
		this.$.deletePopup.setPath(this.selectedFile.path);
		this.$.deletePopup.show();
	},
	deleteConfirm: function(inSender, inEvent) {
		this.doDeleteConfirm(inSender, inEvent);
		// handled here (don't bubble)
		return true;
	},
	deleteCancel: function(inSender, inEvent) {
		console.log("delete file canceled.");
	},

	showErrorPopup : function(msg) {
		this.$.errorMsg.setContent(msg);
		this.$.errorPopup.show();
	},

	hideErrorPopup : function() {
		this.$.errorPopup.hide();
	},

	/*,
	rootIdChanged: function() {
		this.$.fileTree.setRootId(this.rootId);
		this.$.fileTree.setRootPath(this.rootId);
	},
	unloadHandler: function() {
		var root = this.$.fileTree.fetchRootNode();
		if (root) {
			this.saveState(root);
		}
	},
	fileClick: function(inSender, inFileNode, inId) {
		if (!inFileNode.info.isDir) {
			this.doFileClick(inFileNode, inId);
		}
	},
	fileDblClick: function(inSender, inFileNode, inId) {
		if (!inFileNode.info.isDir) {
			this.doFileDblClick(inFileNode, inId);
		}
	},
	fileDragStart: function(inSender, inFileNode) {
	},
	fileDrop: function(inSender, inDragNode, inDropNode) {
		this.log(inDragNode.name, "->", inDropNode.name);
		//this.$.provider.move(inDragNode.name, inDropNode.name, inDragNode.fetchParent().name, inDragNode.type == "folder");
	},
	nodeExpanded: function(inSender, inNode, inExpanded) {
		if (inNode.info.isDir && inExpanded) {
			this.listFiles(inNode.info.id);
		}
	},
	//
	listFiles: function(inId) {
		var n = this.$.fileTree.findNode(inId);
		n.setLoading(true);
		this.$.provider.listFiles(this.makeDescriptor(inId))
			.response(this, function(inSender, inFiles) {
				//this.log(inFiles);
				n.setLoading(false);
				this.updateProjects(inId || "/", inFiles);
				this.updateDirectory(inId || "/", inFiles);
			})
		;
	},
	//
	fileMoveSuccess: function(inSender, inResponse) {
		this.$.provider.listFiles(this.makeDescriptor(inResponse.fromParentId));
		this.$.provider.listFiles(this.makeDescriptor(inResponse.toParentId));
	},
	copySuccess: function(inSender, inFromId, inToParentId, inToId) {
		this.$.provider.listFiles(this.makeDescriptor(inToParentId));
		inSender.destroy();
	},
	createNodes: function(inChildren, inContainer) {
		var children = [];
		for (var i=0,e;e=inChildren[i];i++) {
			var c = {kind: "FileNode", name: e.id, label: e.name, type: e.isDir ? "folder" : "file", info: e};
			var state = this.$.treeState.get(e.id);
			if (state) {
				enyo.mixin(c, {expanded: state.expanded, selected: state.selected});
			}
			var n = this.$.fileTree.createComponent(c);
			children.push(n);
			if (state && state.selected) {
				this.$.fileTree.selectNode(n);
			}
		}
		children.sort(this.compareNode);
		return children;
	},
	compareNode: function(inNode, inOtherNode) {
		var result = 0;
		if (inNode.info.isDir != inOtherNode.info.isDir) {
			if (inNode.info.isDir) {
				result = -1;
			} else {
				result = 1;
			}
		} else {
			if (inNode.id < inOtherNode.id) {
				result = -1;
			} else if (inNode.id > inOtherNode.id) {
				result = 1;
			}
		}
		return result;
	},
	//
	updateProjects: function(inParentId, inChildren) {
		for (var i=0,c; c=inChildren[i]; i++) {
			if (c.name == ".project") {
				this.$.provider.getFile(this.makeDescriptor(c.id))
					.response(this, function(inSender, inResponse) {
						this.doProjectFound(inParentId, enyo.json.parse(inResponse));
					});
				break;
			}
		}
	},
	getProjectConfigSuccess: function(inSender, inResponse, inRequest) {
		this.doProjectFound(inRequest.parentId, enyo.json.parse(inResponse));
	},
	//
	updateDirectory: function(inParentId, inChildren) {
		this.saveStateById(inParentId);
		var n = this.$.fileTree.findNode(inParentId) || this.$.fileTree.createRootNode();
		n.removeNodes();
		var children = this.createNodes(inChildren);
		n.addNodes(children);
	},
	saveStateById: function(inId) {
		var n = this.$.fileTree.findNode(inId);
		if (n) {
			this.saveState(n);
		}
	},
	//
	fetchSelectedNode: function() {
		return this.$.fileTree.fetchSelectedNode();
	},
	findFolderId: function(inId) {
		var n = this.$.fileTree.findNode(inId);
		if (!n.info.isDir) {
			n = n.fetchParent();
		}
		return n.info.id;
	},
	//
	reset: function() {
		var root = this.$.fileTree.fetchRootNode();
		if (root) {
			root.destroy();
		}
	},
	deleteSelected: function() {
		var selection = this.fetchSelectedNode();
		if (selection) {
			var id = this.makeDescriptor(selection.info.id);
			this.$.provider[selection.info.isDir ? "deleteFolder" : "deleteFile"](id)
				.response(this, function(inSender, inResponse) {
					this.listFiles(selection.fetchParent().info.id);
				})
				;
		}
	},
	duplicateSelected: function() {
		var selection = this.fetchSelectedNode();
		if (selection && !selection.info.isDir) {
			var parent = selection.fetchParent();
			this.$.provider.getFile(this.makeDescriptor(selection.info.id))
				.response(this, function(inSender, inContent) {
					var parentId = parent.info.id;
					this.$.provider.createFile(this.makeDescriptor(parentId), "Duplicate_of_" + selection.getLabel(), inContent)
						.response(this, function() {
							this.listFiles(parentId);
						})
						;
				})
				;
		}
	},
	//
	createFile: function(inId, inName) {
		this.$.provider.createFile(this.makeDescriptor(this.findFolderId(inId)), inName)
			.response(this, function() {
				this.listFiles(inId);
			})
			//.error(...) TBD
			;
	},
	createFolder: function(inId, inName) {
		this.$.provider.createFolder(this.makeDescriptor(this.findFolderId(inId)), inName)
			.response(this, function() {
				this.listFiles(inId);
			})
			;
	},
	//
	renameSelected: function() {
		var selection = this.fetchSelectedNode();
		if (selection) {
			selection.setEditing(true);
		}
	},
	// called when client-side fileRename operation is completed, this method
	// attempts to actually rename the file on the server
	fileRenamed: function(inSender, inFileNode, inNewName) {
		var verb;
		var selection = this.fetchSelectedNode();
		if (selection.info.isDir) {
			verb="renameFolder";
		} else {
			verb="renameFile";
		}
		var a = this.$.provider[verb](this.makeDescriptor(inFileNode.name), inNewName);
		a.response(this, function() {
			this.listFiles(inFileNode.fetchParent().name);
		});
	},
	//
	saveState: function(inNode) {
		this.$.treeState.save(this.id + "-state", inNode);
	},
	restoreState: function() {
		this.$.treeState.load(this.id + "-state");
		this.$.fileTree.createRootNode();
	}
	*/
});
