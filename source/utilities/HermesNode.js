/*global enyo */

/**
 * Represents a directory or a file in {HermesFileTree}
 *
 * @class hermes.Node
 * @augments {enyo.Node}
 */

/* global ares */

enyo.kind({
	name: "hermes.Node",
	kind: "Node",
	events: {
		onItemDown: "",
		onItemDragstart: "",
		onItemDragenter: "",
		onItemDragover: "",
		onItemDragleave: "",
		onItemUp: "",
		onItemDrop: "",
		onItemDragend: "",
		onFileClick: "",
		onFolderClick: "",
		onNodeRightClick: "",
		onAdjustScroll: ""
	},
	published: {
		file: null,

		// allows subnodes to be draggable or not (not per default).
		dragAllowed: false
	},
	handlers: {
		ondown: "down",
		ondragstart: "dragstart",
		ondragenter: "dragenter",
		ondragover: "dragover",
		ondragleave: "dragleave",
		onup: "up",
		ondrop: "drop",
		ondragend: "dragend"
	},
	attributes: {
		dropTarget: "true"
	},

	// expandable nodes may only be opened by tapping the icon; tapping the content label
	// will fire the nodeTap event, but will not expand the node.
	onlyIconExpands: true,

	debug: false,

	// used to deactivate Hermes right-click menu and allow the
	// browser one on the caption item of the node
	debugContextMenu: false,

	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},
	/** @private */
	down: function(inSender, inEvent) {
		if (inEvent.which === 1) {
			this.doItemDown(inEvent);
		}

		return true;
	},
	/** @private */
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDragstart(inEvent);
		return true;
	},
	/** @private */
	dragenter: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDragenter(inEvent);
		return true;
	},
	/** @private */
	dragover: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDragover(inEvent);
		return true;
	},
	/** @private */
	dragleave: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDragleave(inEvent);
		return true;
	},
	/** @private */
	up: function (inSender, inEvent) {
		if (inEvent.which === 1) {
			this.doItemUp(inEvent);
		}

		return true;
	},
	/** @private */
	drop: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDrop(inEvent);
		return true;
	},
	/** @private */
	dragend: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}

		this.doItemDragend(inEvent);
		return true;
	},

	// Note: this function does not recurse
	updateNodes: function() {
		this.startLoading(this);
		this.trace(this) ;
		return this.file.service.listFiles(this.file && this.file.id)
			.response(this, function(inSender, inFiles) {
				var sortedFiles = inFiles.sort(this.fileNameSort) ;
				if (inFiles && !this.showing) {
					this.show();
				}

				this.trace("updating node content of ", this.name, this," with ", sortedFiles ) ;
				this.updateNodeContent(sortedFiles);
				this.render() ;
			})
			.response(this, function() {
				this.stopLoading();
			})
			.error(this, function() {
				this.stopLoading();
			});
	},
	startLoading: function() {
		this.$.extra.setContent('&nbsp;<img src="' + enyo.path.rewrite("$assets/utilities/images/busy.gif") + '"/>');
	},
	stopLoading: function() {
		this.$.extra.setContent("");
	},
	updateNodeContent: function(files) {
		var i = 0, rfiles, tfiles, res, newNode, k = 0, nfiles;

		this.trace( "updateNodeContent on", this ) ;

		// Add dir property to files, which is a project-relative path
		enyo.forEach(files, function(f) {
			this.trace("updateNodeContent loop on",f) ;
			if (f.isDir) {
				f.dir = (this.file.dir || "/") + f.name + "/";
			} else {
				f.dir = (this.file.dir || "/");
			}
		}.bind(this));
		rfiles = this.filesToNodes( files ) ; // with prefix in name

		// detach visual subnodes
		tfiles = this.getNodeFiles() ;
		for ( var j = 0; j < tfiles.length; j++ ) {
			this.removeControl( tfiles[j] );
		}

		nfiles = [];

		// rearrange visual subnodes accordingly to file nodes order
		while ( k < tfiles.length || i < rfiles.length ) {
			res = k >= tfiles.length ? 1
			    : i >= rfiles.length ? -1
			    : this.fileNameSort( tfiles[k], rfiles[i] );

			switch(res) {
			case -1:
				this.trace( tfiles[k].name, "was removed" ) ;
				tfiles[k].destroy() ;

				k++;

				break;
			case 0:
				this.trace( tfiles[k].name, "is kept" ) ;
				this.addControl( tfiles[k] ) ;

				k++;
				i++;

				break;
			case 1:
				this.trace( rfiles[i].name, "was created" ) ;
				if (this.dragAllowed) {
					newNode = this.createComponent( rfiles[i], {kind: "hermes.Node", classes: "hermesFileTree-node", dragAllowed: true, attributes: {draggable : true}} ) ;
				} else {
					newNode = this.createComponent( rfiles[i], {kind: "hermes.Node", classes: "hermesFileTree-node"} ) ;
				}
				this.trace( newNode, "has been created " ) ;

				nfiles = this.getNodeFiles() ;
				/*
				 FIXME: allow to manually change
				 PhoneGap parameters from Ares.
				 DEMANDS to relad Ares after each
				 project.json manual change

				 if (nfiles[i].name === '$project.json') {
				 // project.json file is internal to Ares
				 nfiles[i].hide();
				 }
				 */

				i++;

				break;
			}
		}

		this.$.client.render();
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
	 * @return a hermes.Node for a file or a directory named passed in parameter
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
	 * @return a hermes.Node for a file or a directory id passed in parameter
	 *
	 */

	getNodeWithId: function (id) {
		var idMatch = function(e){
			return (e.file && e.file.id === id) ;
		} ;
		return this.getControls().filter( idMatch )[0];
	},

	filesToNodes: function(inFiles) {
		var nodes = [], f;
		inFiles.sort(this.fileNameSort); // TODO: Other sort orders
		for (var i=0; i < inFiles.length; i++) {
			f=inFiles[i];
			f.service = this.file.service;
			nodes.push({
				file: f,
				name: '$' + f.name, // prefix avoids clobberring non-files components like icon
				content: f.name,
				expandable: f.isDir,
				icon: "$assets/utilities/images/" + (f.isDir ? "arrowRight.png" : "file.png")
			});
		}
		return nodes;
	},
	nodeExpand: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		var subnode = inEvent.originator;
		this.trace("nodeExpand called while node Expanded is ", subnode.expanded) ;
		// update icon for expanded state
		if (subnode.file.isDir) {
			subnode.setIcon("$assets/utilities/images/" + (subnode.expanded ? "arrowDown.png" : "arrowRight.png"));
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
		this.trace(this) ;

		this.trace('running refreshTree with ' +
				   this.controls.length + ' controls with content ' + this.content +
				   ' force select ' + toSelectId );

		tracker.inc() ; // for updadeNodes
		this.updateNodes().
			response(this, function(inSender, inFiles) {
				// expand node if it has clients (sub-nodes) and is expanded
				this.effectExpanded();

				enyo.forEach(this.getNodeFiles(), function(f) {
					var c = this.$[f.name] ; // c is a node
					this.trace('running INNER function of refreshTree on ' + f.name +
							   ' id ' + c.file.id);
					if ( c.file.id === toSelectId ) {
						this.trace('force select of ', c.file.id);
						c.doNodeTap();

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
					errMsg += ": " + enyo.json.parse(inSender.xhrResponse.body).message;
				} catch(e) {
				}
				this.warn(errMsg);
			});

		if( belowTop ) {
			tracker.dec(); // run only for inner calls to refreshTree
		}
		this.trace("refreshTree done") ;
	},
	followNodePath: function (nodes, waypoints, next) {
		if (nodes.length > 0) {
			this.updateNodes().response(this, function () {
				var track = this.getNodeNamed(nodes.shift());
				if (track) {
					waypoints.push(track);
					track.followNodePath(nodes, waypoints, next);
				} else {
					if (typeof next === 'function') {
						next();
					}
				}
			})
				.error(this, function (inSender, inError) {
					if (typeof next === 'function') {
						next(inError);
					}
				});
		} else {
			if (typeof next === 'function') {
				next();
			}
		}
	}
});
