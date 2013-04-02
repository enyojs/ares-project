/**
 *
 * ares.Node kind represents a direcroty or a file in HermesFileTree.
 * this kind inherits from enyo.Node
 *
 */

enyo.kind({
	name: "ares.Node",
	kind: "Node",
	events: {
		onFileClick: "",
		onFolderClick: "",
		onFileDblClick: "",
		onAdjustScroll: ""
	},
	published: {
		service: null
	},

	// expandable nodes may only be opened by tapping the icon; tapping the content label
	// will fire the nodeTap event, but will not expand the node.
	onlyIconExpands: true,

	debug: false,


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
		var hasPrefix = function(e){
			return (e.name === '$'+ name) ;
		} ;
		return this.getControls().filter( hasPrefix )[0];
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
				var errMsg = "Error refreshing the file list (" + inError + ")";
				try {
					errMsg += ": " + JSON.parse(inSender.xhrResponse.body).message;
				} catch(e) {
				}
				this.showErrorPopup(errMsg);
			});

		if( belowTop ) {
			tracker.dec(); // run only for inner calls to refreshTree
		}
		this.debug && this.log("refreshTree done") ;
	}

});

