enyo.kind({
	name: "HermesFileTree",
	kind: "FittableRows",
	events: {
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onProjectFound: ""
	},
	published: {
		serverName: "",
		rootId: "."
	},
	components: [
		{kind: "onyx.Toolbar", classes: "onyx-menu-toolbar", components: [
			{content: "Files", style: "margin-right: 10px"},
			// Move this to the "projects" view, along with its relatives...
			//{kind: "onyx.TooltipDecorator", components: [
			//    {kind: "onyx.IconButton", src: "$harmonia/images/application_new.png", onclick: "newApplicationClick"},
			//    {kind: "onyx.Tooltip", content: "New Project..."},
			//]},	        
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$harmonia/images/folder_new.png", onclick: "newFolderClick"},
				{kind: "onyx.Tooltip", content: "New Folder..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [		    
				{kind: "onyx.IconButton", src: "$harmonia/images/document_new.png", onclick: "newFileClick"},
				{kind: "onyx.Tooltip", content: "New File..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/document_edit.png", onclick: "renameClick"},
				{kind: "onyx.Tooltip", content: "Rename..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/copy.png", onclick: "copyClick"},
				{kind: "onyx.Tooltip", content: "Copy..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [		    		        
				{kind: "onyx.IconButton", src: "$harmonia/images/document_delete.png", onclick: "deleteClick"},
				{kind: "onyx.Tooltip", content: "Delete..."},		        
			]},
		]},
		
		{kind: "Scroller", fit: true, components: [
			// id must be '.' for root, '/' will not work 
			{kind: "Node", classes: "enyo-unselectable", showing: false, file: {id: ".", name: "server", isServer: true}, content: "server", icon: "$service/images/antenna.png", expandable: true, expanded: true, onExpand: "nodeExpand", onNodeTap: "nodeTap"}
		]},
		{kind: "Selection", onSelect: "select", onDeselect: "deselect"},
		{kind: "Signals", onunload: "unloadHandler"},
		{name: "service", kind: "HermesService"},
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
	reset: function() {
		this.$.node.hide();
		if (this.$.service.url) {
			this.listFiles(this.$.node);
		}
	},
	//
	// probably should be in a Tree kind
	nodeTap: function(inSender, inEvent) {
		var node = inEvent.originator;
		this.$.selection.select(node.id, node);
		if (!node.file.isDir) {
			this.doFileClick({file: node.file});
		} else {
			this.doFolderClick({file: node.file});
		}
	},
	nodeDblClick: function(inSender, inEvent) {
		var node = inEvent.originator;
		if (!node.file.isDir && !node.file.isServer) {
			this.doFileDblClick({file: node.file});
		}
	},
	select: function(inSender, inEvent) {
		this.selectedFile=inEvent.data.file;
		inEvent.data.$.caption.applyStyle("background-color", "lightblue");
	},
	deselect: function(inSender, inEvent) {
		this.selectedFile=null;
		inEvent.data.$.caption.applyStyle("background-color", null);
	},
	listFiles: function(inNode) {
		this.startLoading(inNode);
		return this.$.service.listFiles(inNode.file.id)
			.response(this, function(inSender, inFiles) {
				if (inFiles && !this.$.node.showing) {
					this.$.node.show();
				}
				if (inFiles && (!inNode.files || !this.compareFiles(inNode.files, inFiles))) {
					inNode.files = inFiles;
					inNode.addNodes(this.filesToNodes(inFiles));
				}
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
	compareFiles: function(inFilesA, inFilesB) {
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
	filesToNodes: function(inFiles) {
		var nods = [];
		inFiles.sort(this.fileNameSort); // TODO: Other sort orders
		for (var i=0, f; f=inFiles[i]; i++) {
			nods.push({
				file: f,
				content: f.name,
				expandable: f.isDir,
				icon: "$service/images/" + (f.isDir ? "folder.png" : "file.png")
			});
		}
		return nods;
	},
	nodeExpand: function(inSender, inEvent) {
		// the originating node is arbitrarily deep
		var node = inEvent.originator;
		// update icon for expanded state
		if (node.file.isDir) {
			node.setIcon("$service/images/" + (node.expanded ? "folder-open.png" : "folder.png"));
		}
		// handle lazy-load when expanding
		if (node.expanded) {
			this.listFiles(node).
				response(this, function() {
					node.effectExpanded();
				});
			// tell the event originator that node expansion should be deferred
			inEvent.wait = true;
		}
		// handled here (don't bubble)
		return true;
	},
	getPathFromFile: function(inFile) {
		var path;
		if (!inFile || inFile.isServer) {
			path = '/';
		} else if (inFile.isDir) {
			path = inFile.path;
		} else {
			path = inFile.path.substring(0, inFile.path.length-inFile.name.length);
		}
		return path;
	},
	copyName: function(inName) {
		return "Copy of "+inName;
	},
	newFileClick: function(inSender, inEvent) {
		var path = this.getPathFromFile(this.selectedFile);
		this.$.nameFilePopup.setPath(path);
		this.$.nameFilePopup.show();
	},
	newFileConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var name = inEvent.name;
		this.log("Creating new file "+name+" at "+path);
		this.$.service.createFile(path, name, null)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.refreshFileTree(this.$.node);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Creating file "+name+" failed:" + inError);
			});
	},	
	refreshFileTree: function(inNode) {		
		enyo.forEach(inNode.controls, function(c) {
			if (c.kind && c.kind === 'Node') {
				if (c.expanded) {
					this.listFiles(c).
					response(this, function() {
						c.effectExpanded();
					});
					this.$.selection.select(c.id, c);
				}
			}
		this.refreshFileTree(c);
		}, this);
	},
	newFileCancel: function(inSender, inEvent) {
		console.log("New File canceled.");
	},
	newFolderClick: function(inSender, inEvent) {
		var path = this.getPathFromFile(this.selectedFile);
		this.$.nameFolderPopup.setPath(path);
		this.$.nameFolderPopup.show();
	},
	newFolderConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var name = inEvent.name;
		this.log("Creating new folder "+name+" at "+path);
		this.$.service.createFolder(path, name)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.refreshFileTree(this.$.node);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	},
	newFolderCancel: function(inSender, inEvent) {
		console.log("New Folder canceled.");
	},
	copyClick: function(inSender, inEvent) {
		var path = this.getPathFromFile(this.selectedFile);
		this.$.nameCopyPopup.setType(this.selectedFile.name);
		this.$.nameCopyPopup.setFileName(this.copyName(this.selectedFile.name));
		this.$.nameCopyPopup.setPath(path);
		this.$.nameCopyPopup.show();
	},
	copyFileConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldName = this.selectedFile.name;
		var newName = inEvent.newName;
		this.log("Creating new file " + newName + " as copy of" + oldName + " at " + path);
		this.$.service.duplicateFile(path, oldName, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				// TODO: FixMe: doesn't work for now because HermesService has no method duplicate file
				this.refreshFileTree(this.$.node);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Creating file "+newName+" as copy of" + oldName +" failed:" + inError);
			});
	},
	copyFileCancel: function(inSender, inEvent) {
		console.log("Copy file canceled.");
	},
	renameClick: function(inSender, inEvent) {
		var path = this.getPathFromFile(this.selectedFile);
		this.$.renamePopup.setType(this.selectedFile.name);
		this.$.renamePopup.setFileName(this.selectedFile.name);
		this.$.renamePopup.setPath(path);
		this.$.renamePopup.show();
	},
	renameConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var newName = inEvent.name;
		var method = this.selectedFile.isDir ? "renameFolder" : "renameFile";
		this.log("Renaming file " + oldId + " as " + newName + " at " + path);
		this.$.service[method](oldId, newName)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.refreshFileTree(this.$.node);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Renaming file "+oldId+" as " + newName +" failed:" + inError);
			});
	},
	renameCancel: function(inSender, inEvent) {
		console.log("rename file canceled.");
	},
	deleteClick: function(inSender, inEvent) {
		var path = this.getPathFromFile(this.selectedFile);
		this.$.deletePopup.setFileName(this.selectedFile.name);
		this.$.deletePopup.setPath(path);
		this.$.deletePopup.show();
	},
	deleteConfirm: function(inSender, inEvent) {
		var path = inEvent.path;
		var oldId = this.selectedFile.id;
		var method = this.selectedFile.isDir ? "deleteFolder" : "deleteFile";
		this.log("Deleting file " + oldId + " at " + path);
		this.$.service[method](oldId)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
				this.refreshFileTree(this.$.node);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Deleting file "+oldId+" failed:" + inError);
			});
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
