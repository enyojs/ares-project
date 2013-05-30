/**
 * Represents a directory or a file in {HermesFileTree}
 * 
 * @class ares.Node
 * @augments {enyo.Node}
 */

enyo.kind({
	name: "ares.Node",
	kind: "Node",
	events: {
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onAdjustScroll: "",
		onNodeMove: ""
	},
	published: {
		service: null
	},
	handlers: {
		ondragstart: "dragStart",
		ondrop: "drop",
		ondragover: "dragOver",
		ondragout: "dragOut"
	},
	
	// expandable nodes may only be opened by tapping the icon; tapping the content label
	// will fire the nodeTap event, but will not expand the node.
	onlyIconExpands: true,

	debug: false,
	
	node: null,

	dragStart: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		node = null;
		
		// look for the related ares.Node
		if (inSender.kind === "ares.Node") {
			node = inSender;
		} else {
			node = inSender.container;
		}
		
		return true;
	},
	drop: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		var newParentNode = "";
		
		// look for the related ares.Node
		if (inSender.kind === "ares.Node") {
			newParentNode = inSender;
		} else {
			// Control or Image...
			newParentNode = inSender.container;
		}
		
		this.doNodeMove({oldNode: node, newParent: newParentNode});
		
		newParentNode.applyStyle("cursor", "default");
		if (newParentNode.file.isDir && newParentNode.expanded) {
			newParentNode.applyStyle("background-color", null);
		}
		
		node = null;
		
		return true;
	},
	dragOver: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		var newParentNode = "";
		
		// look for the related ares.Node
		if (inSender.kind === "ares.Node") {
			newParentNode = inSender;
		} else {
			// Control or Image...
			newParentNode = inSender.container;
		}
		
		var nodeFile = node.file;
		var newParentFile = newParentNode.file;
		
		// Applying the related DnD style
		if (nodeFile != newParentFile) {
			if (newParentFile.isDir) {
				if (node.container.file.id != newParentFile.id) {
						if (!nodeFile.isDir || newParentFile.isServer || newParentFile.dir.indexOf(nodeFile.dir) == -1) {
						newParentNode.applyStyle("cursor", "pointer");
					} else {
						if (this.debug) this.log("target node is a child node");
						newParentNode.applyStyle("cursor", "no-drop");
					}
				} else {
					if (this.debug) this.log("target node is its own parent node");
					newParentNode.applyStyle("cursor", "no-drop");
				}
			} else {
				if (this.debug) this.log("target node is a file");
				newParentNode.applyStyle("cursor", "no-drop");
			}
		} else {
			if (this.debug) this.log("target node is itself");
			newParentNode.applyStyle("cursor", "no-drop");
		}
		
		if (newParentNode.file.isDir && newParentNode.expanded) {
			newParentNode.applyStyle("background-color", "grey");
		}
				
		return true;
	},
	dragOut: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		var isNode = null;
		
		// look for the related ares.Node to apply the DnD style
		if (inSender.kind === "ares.Node") {
			isNode = inSender;
		} else {
			// Control or Image...
			isNode = inSender.container;
		}
		
		isNode.applyStyle("cursor", "default");
		if (isNode.file.isDir && isNode.expanded) {
			isNode.applyStyle("background-color", null);
		}
		
		return true;
	},
	
	// Note: this function does not recurse
	updateNodes: function() {
		this.startLoading(this);
		if (this.debug) this.log(this) ;
		return this.service.listFiles(this.file && this.file.id)
			.response(this, function(inSender, inFiles) {
				var sortedFiles = inFiles.sort(this.fileNameSort) ;
				if (inFiles && !this.showing) {
					this.show();
				}

				if (this.debug) this.log("updating node content of ", this.name, this," with ", sortedFiles ) ;
				this.updateNodeContent(sortedFiles);
				this.render() ;
			})
			.response(this, function() {
				this.stopLoading();
			})
			.error(this, function() {
				this.stopLoading();
			})
			;
	},
	startLoading: function() {
		this.$.extra.setContent('&nbsp;<img src="' + enyo.path.rewrite("$services/assets/images/busy.gif") + '"/>');
	},
	stopLoading: function() {
		this.$.extra.setContent("");
	},
	updateNodeContent: function(files) {
		var i = 0 , nfiles, rfiles, res, modified = 0, newControl ;

		if (this.debug) this.log("updateNodeContent on",this) ;

		// Add dir property to files, which is a project-relative path
		enyo.forEach(files, function(f) {
			if (this.debug) this.log("updateNodeContent loop on",f) ;
			if (f.isDir) {
				f.dir = (this.file.dir || "/") + f.name + "/";
			} else {
				f.dir = (this.file.dir || "/");
			}
		}.bind(this));
		rfiles = this.filesToNodes(files) ; // with prefix in name
		nfiles = this.getNodeFiles() ;

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
					nfiles = this.getNodeFiles() ;
					// node file list reduced by one, must not increment i
					break ;

				case 0: // no change
					i++ ;
					break ;

				case 1: // file added
				    if (this.debug) this.log(rfiles[i].name + " was added") ;
					newControl = this.createComponent( rfiles[i], {kind: "ares.Node"} ) ;
					if (this.debug) this.log("updateNodeContent created ", newControl) ;
					newControl.setService(this.service);
					nfiles = this.getNodeFiles() ;
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
			this.$.client.render();
		}
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
	getNodeFiles: function() {
		var hasPrefix = function(e){
			return (e.name.slice(0,1) === '$') ;
		} ;
		// getComponents only return the graphical items
		return this.getControls().filter( hasPrefix ).sort(this.fileNameSort) ;
	},

	/**
	 * getNodeNamed
	 * @public
	 * @param {String} name
	 * @return a ares.Node for a file or a directory named passed in parameter
	 *
	 */

	getNodeNamed: function(name) {
		var nameMatch = function(e){
			return (e.name === '$'+ name) ;
		} ;
		return this.getControls().filter( nameMatch )[0];
	},

	/**
	 * getNodeWithId
	 * @public
	 * @param {String} id
	 * @return a ares.Node for a file or a directory id passed in parameter
	 *
	 */

	getNodeWithId: function (id) {
		var idMatch = function(e){
			return (e.file && e.file.id === id) ;
		} ;
		return this.getControls().filter( idMatch )[0];
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
				icon: "$services/assets/images/" + (f.isDir ? "folder.png" : "file.png")
			});
		}
		return nodes;
	},
	nodeExpand: function(inSender, inEvent) {
		if (this.debug) this.log(inSender, "=>", inEvent);
		
		var subnode = inEvent.originator;
		if (this.debug) this.log("nodeExpand called while node Expanded is " + subnode.expanded) ;
		// update icon for expanded state
		if (subnode.file.isDir) {
			subnode.setIcon("$services/assets/images/" + (subnode.expanded ? "folder-open.png" : "folder.png"));
		}
		// handle lazy-load when expanding
		if (subnode.expanded) {
			subnode.updateNodes().
				response(this, function() {
					subnode.effectExpanded();
				});
			// tell the event originator that node expansion should be deferred
			inEvent.wait = true;
		}
		// handled here (don't bubble)
		return true;
	},
	
	// All parameters are optional.
	// - toSelectId is optional. refresh will select this entry if specified.
	//   Nothing is selected otherwise.
	// - tracker is an internal parameter used in inner refreshFileTree calls
	refreshTree: function(tracker, belowTop, toSelectId) {
		if (this.debug) this.log(this) ;
		var target = this ;

		if (this.debug) this.log('running refreshTree with ' +
					 this.controls.length + ' controls with content ' + this.content +
					 ' force select ' + toSelectId );

		tracker.inc() ; // for updadeNodes
		this.updateNodes().
			response(this, function(inSender, inFiles) {
				// expand node if it has clients (sub-nodes) and is expanded
				this.effectExpanded();

				enyo.forEach(this.getNodeFiles(), function(f) {
					var c = this.$[f.name] ; // c is a node
					if (this.debug) this.log('running INNER function of refreshTree on ' + f.name +
								 ' id ' + c.file.id);
					if ( c.file.id === toSelectId ) {
						if (this.debug) this.log('force select of ' + c.file.id);
						c.doNodeTap();
						this.doAdjustScroll() ;
						// force a "click" event when the item is selected
						this.doFolderClick({file: c.file});
					}
					c.effectExpanded() ;
					if (f.expanded) {
						tracker.inc() ; // for inner calls to refreshTree
						c.refreshTree(tracker, 1, toSelectId );
					}
				}, this);
				tracker.dec(); // end updateNodes
			}).
			error(this, function(inSender, inError) {
				var errMsg = "*** Error refreshing the file list (" + inError + ")";
				try {
					errMsg += ": " + JSON.parse(inSender.xhrResponse.body).message;
				} catch(e) {
				}
				this.log(errMsg);
			});

		if( belowTop ) {
			tracker.dec(); // run only for inner calls to refreshTree
		}
		this.debug && this.log("refreshTree done") ;
	}
});
