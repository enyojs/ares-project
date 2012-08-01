enyo.kind({
	name: "HermesFileTree",
	kind: "FittableRows",
	events: {
		onFileClick: "",
		onFileDblClick: "",
		onProjectFound: ""
	},
	published: {
		serverName: "",
		rootId: "."
	},
	components: [
		{kind: "onyx.Toolbar", defaultKind: "onyx.IconButton", components: [
			{content: "Files"}
			//{content: "Open", onclick: "openClick"},
			//{kind: "onyx.Button", content: "Files", Xsrc: "$harmonia/images/server_into.png", hint: "Reset", onclick: "resetAction"}
			/*,
			{Xcontent: "New", src: "$harmonia/images/server_add.png", hint: "New...", onclick: "newClick"},
			{Xcontent: "Edit", src: "$harmonia/images/server_preferences.png", hint: "Edit...", onclick: "editClick"},
			{Xcontent: "Delete", src: "$harmonia/images/server_delete.png", hint: "Delete", onclick: "deleteClick"}
			*/
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
			{content: "Service returned an error"},
		]}		
	],
	create: function() {
		this.inherited(arguments);
	},
	reset: function() {
		this.$.node.hide();
		this.listFiles(this.$.node);
	},
	//
	// probably should be in a Tree kind
	nodeTap: function(inSender, inEvent) {
		var node = inEvent.originator;
		this.$.selection.select(node.id, node);
		if (!node.file.isDir) {
			this.doFileClick({file: node.file});
		}
	},
	nodeDblClick: function(inSender, inEvent) {
		var node = inEvent.originator;
		if (!node.file.isDir && !node.file.isServer) {
			this.doFileDblClick({file: node.file});
		}
	},
	select: function(inSender, inEvent) {
		inEvent.data.$.caption.applyStyle("background-color", "lightblue");
	},
	deselect: function(inSender, inEvent) {
		inEvent.data.$.caption.applyStyle("background-color", null);
	},
	//
	//
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
				this.$.errorPopup.show();
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
	filesToNodes: function(inFiles) {
		var nods = [];
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
	}
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
