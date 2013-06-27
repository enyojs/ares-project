/* global Ares, async, ares, alert */

enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "onyx",
	fit: true,
	debug: false,
	components: [
		{kind: "Panels", arrangerKind: "CarouselArranger", draggable: false, classes:"enyo-fit ares-panels", components: [
			{components: [
				{kind: "Phobos", onSaveDocument: "saveDocument", onSaveAsDocument: "saveAsDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument", onUpdate: "phobosUpdate"}
			]},
			{components: [
				{kind: "Deimos", onCloseDesigner: "closeDesigner", onDesignerUpdate: "designerUpdate", onUndo: "designerUndo", onRedo: "designerRedo"}
			]}
		]},
		{kind: "Slideable", layoutKind: "FittableRowsLayout", classes: "onyx ares-files-slider", axis: "v", value: 0, min: -500, max: 0, unit: "px", onAnimateFinish: "finishedSliding", components: [
			{name: "projectView", kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "openDocument", onProjectSelected: "projectSelected"},
			{name: "bottomBar", classes:"ares-bottom-bar", kind: "DocumentToolbar",
				onToggleOpen: "toggleFiles",
				onSwitchFile: "switchFile",
				onSave: "bounceSave",
				onDesign: "bounceDesign",
				onNewKind: "bounceNew",
				onClose: "bounceClose"
			}
		]},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/assets/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Ongoing...", style: "padding-top: 10px;"}
		]},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error", details: ""},
		{kind: "ServiceRegistry"},
		{kind: "Ares.PackageMunger", name: "packageMunger"}
	],
	handlers: {
		onReloadServices: "handleReloadServices",
		onUpdateAuth: "handleUpdateAuth",
		onShowWaitPopup: "showWaitPopup",
		onHideWaitPopup: "hideWaitPopup",
		onError: "showError",
		onTreeChanged: "_treeChanged",
		onChangingNode: "_nodeChanging"
	},
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value

		this.inherited(arguments);
		this.$.panels.setIndex(this.phobosViewIndex);
		this.adjustBarMode();

		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (Ares.TestController) {
			Ares.Workspace.loadProjects("com.enyojs.ares.tests", true);
			this.createComponent({kind: "Ares.TestController", aresObj: this});
		} else {
			Ares.Workspace.loadProjects();
		}
		this.calcSlideableLimit();
		Ares.instance = this;
	},
	rendered: function() {
		this.inherited(arguments);
		this.calcSlideableLimit();
	},
	draggable: false,
	/**
	 * @private
	 */
	handleReloadServices: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.reloadServices();
	},
	/**
	 * @private
	 */
	handleUpdateAuth: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.setConfig(inEvent.serviceId, {auth: inEvent.auth}, inEvent.next);
	},
	projectSelected: function() {
		setTimeout(enyo.bind(this, function() { this.$.deimos.projectSelected(this.$.projectView.currentProject); }), 500);	// <-- TODO - using timeout here because project url is set asynchronously
		return true;
	},
	openDocument: function(inSender, inEvent) {
		this._openDocument(inEvent.projectData, inEvent.file, function(inErr) {});
	},
	/** @private */
	_openDocument: function(projectData, file, next) {
		var self = this;
		var fileDataId = Ares.Workspace.files.computeId(file);
		var fileData = Ares.Workspace.files.get(fileDataId);
		if (fileData) {
			this.switchToDocument(fileData);
		} else {
			this.showWaitPopup(this, {msg: $L("Opening...")});
			this.$.bottomBar.createFileTab(file.name, fileDataId);
			this.$.slideable.setDraggable(true);
			this._fetchDocument(projectData, file, function(inErr, inContent) {
				self.hideWaitPopup();
				if (inErr) {
					self.warn("Open failed", inErr);
					if (typeof next === 'function') {
						next(inErr);
					}
				} else {
					fileData = Ares.Workspace.files.newEntry(file, inContent, projectData);
					self.switchToDocument(fileData);
					if (typeof next === 'function') {
						next();
					}
				}
			});
		}
	},
	/** @private */
	_fetchDocument: function(projectData, file, next) {
		this.trace("projectData:", projectData, ", file:", file);
		var service = projectData.getService();
		service.getFile(file.id)
			.response(this, function(inEvent, inData) {
				next(null, inData && inData.content || "");
			})
			.error(this, function(inEvent, inErr) {
				next(inErr);
			});
	},
	saveDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var self = this;
		this._saveDocument(inEvent.content, {service: inEvent.file.service, fileId: inEvent.file.id}, function(err) {
			if (err) {
				self.$.phobos.saveFailed(err);
			} else {
				self.$.phobos.saveComplete();
				self.$.deimos.saveComplete();
			}
		});
	},
	_saveDocument: function(content, where, next) {
		var req;
		if (where.fileId) {
			req = where.service.putFile(where.fileId, content);
		} else {
			req = where.service.createFile(where.folderId, where.name, content);
		}
		req.response(this, function(inEvent, inData) {
			next(null, inData);
		}).error(this, function(inEvent, inErr) {
			next(inErr);
		});

	},
	saveAsDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var self = this,
		    file = inEvent.file,
		    name = inEvent.name;

		if (!file) {
			_footer(new Error("Internal error: missing file/folder description"));
			return;
		}

		async.waterfall([
			this._closeDocument.bind(this, inEvent.docId),
			_prepareNewLocation.bind(this),
			this._saveDocument.bind(this, inEvent.content),
			_savedToOpen.bind(this),
			this._openDocument.bind(this, inEvent.projectData)
		], _footer);

		function _prepareNewLocation(next) {
			var where, err;
			if (file.isDir && name) {
				// create given file in given dir
				where = {
					service: file.service,
					folderId: file.id,
					name: name
				};
			} else if (!file.isDir && !name) {
				// overwrite the given file
				where = {
					service: file.service,
					fileId: file.id
				};
			} else if (!file.isDir && name) {
				// create a new file in the same folder as the
				// given file
				where = {
					service: file.service,
					folderId: file.parent.id,
					name: name
				};
			} else {
				err = new Error("Internal error: wrong file/folder description");
			}
			next(err, where);
		}

		function _savedToOpen(inData, next) {
			this.$.projectView.refreshFile(file);
			// FIXME: only HermesFileTree report built-in file#service
			var hermesFile = inData[0];
			hermesFile.service = file.service;
			hermesFile.name = ares.basename(hermesFile.path);
			next(null, hermesFile);
		}

		function _footer(err, result) {
			if (self.debug) { enyo.log("err:", err, "result:", result); }
			if (typeof inEvent.next === 'function') {
				inEvent.next(err, result);
			}
		}
	},
	closeDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var self = this;
		this._closeDocument(inEvent.id, function() {
			self.showFiles();
		});
	},
	/** @private */
	_closeDocument: function(docId, next) {
		if (docId) {
			// remove file from cache
			Ares.Workspace.files.removeEntry(docId);
			this.$.bottomBar.removeTab(docId);
			this.$.slideable.setDraggable(Ares.Workspace.files.length > 0);
		}
		if (typeof next === 'function') {
			next();
		}
	},
	designDocument: function(inSender, inEvent) {
		this.syncEditedFiles();
		this.$.deimos.load(inEvent);
		this.$.panels.setIndex(this.deimosViewIndex);
		this.adjustBarMode();
		this.activeDocument.setCurrentIF('designer');
	},
	//* A code change happened in Phobos - push change to Deimos
	phobosUpdate: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
	},
	//* A design change happened in Deimos - push change to Phobos
	designerUpdate: function(inSender, inEvent) {
		if (inEvent && inEvent.docHasChanged) {
			(inEvent.viewHasChanged) ? this.$.phobos.updateView(inSender, inEvent) : this.$.phobos.updateComponents(inSender, inEvent);
		}
	},
	closeDesigner: function(inSender, inEvent) {
		this.designerUpdate(inSender, inEvent);
		this.$.panels.setIndex(this.phobosViewIndex);
		this.adjustBarMode();
		this.activeDocument.setCurrentIF('code');
	},
	//* Undo event from Deimos
	designerUndo: function(inSender, inEvent) {
		this.$.phobos.undoAndUpdate();
	},
	//* Redo event from Deimos
	designerRedo: function(inSender, inEvent) {
		this.$.phobos.redoAndUpdate();
	},
	handleBeforeUnload: function() {
		if (window.location.search.indexOf("debug") == -1) {
			return 'You may have some unsaved data';
		}
	},
	hideFiles: function(inSender, inEvent) {
		this.$.slideable.animateToMin();
	},
	showFiles: function(inSender, inEvent) {
		this.$.slideable.animateToMax();
	},
	toggleFiles: function(inSender, inEvent) {
		if (this.$.slideable.value < 0 || Ares.Workspace.files.length === 0) {
			this.showFiles();
		} else {
			this.hideFiles();
		}
	},
	resizeHandler: function(inSender, inEvent) {
		this.inherited(arguments);
		this.calcSlideableLimit();
		if (this.$.slideable.value < 0) {
			this.$.slideable.setValue(this.$.slideable.min);
		}
	},
	calcSlideableLimit: function() {
		var min = this.getBounds().height-this.$.bottomBar.getBounds().height;
		this.$.slideable.setMin(-min);
	},
	switchFile: function(inSender, inEvent) {
		var d = Ares.Workspace.files.get(inEvent.id);
		if (d) {
			this.switchToDocument(d);
		} else {
			alert("File ID not found in cache!");
		}
	},
	switchToDocument: function(d) {
		// We no longer save the data as the ACE edit session will keep the data for us
		if (!this.activeDocument || d !== this.activeDocument) {
			this.$.phobos.openDoc(d);
		}
		var currentIF = d.getCurrentIF();
		this.activeDocument = d;
		if (currentIF === 'code') {
			this.$.panels.setIndex(this.phobosViewIndex);
		} else {
			this.$.phobos.designerAction();
		}
		this.adjustBarMode();
		this.$.bottomBar.activateFileWithId(d.getId());
		this.hideFiles();
	},
	finishedSliding: function(inSender, inEvent) {
		if (this.$.slideable.value < 0) {
			this.$.bottomBar.showControls();
		} else {
			this.$.bottomBar.hideControls();
		}
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceSave: function(inSender, inEvent) {
		this.$.phobos.saveDocAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceDesign: function(inSender, inEvent) {
		var editorMode = this.$.panels.getIndex() == this.phobosViewIndex;
		if (editorMode) {
			this.$.phobos.designerAction(inSender, inEvent);
		} else {
			this.$.deimos.closeDesignerAction();
		}
	},
	adjustBarMode: function() {
		var designMode = this.$.panels.getIndex() == this.deimosViewIndex;
		this.$.bottomBar.setDesignMode(designMode);
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceNew: function(inSender, inEvent) {
		this.$.phobos.newKindAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring
	// Close is a special case, because it can be invoked on a document other than the currently-active one
	bounceClose: function(inSender, inEvent) {
		this.switchFile(inSender, inEvent);
		enyo.asyncMethod(this.$.phobos, "closeDocAction");
	},
	//* Update code running in designer
	syncEditedFiles: function() {
		var files = Ares.Workspace.files,
			model,
			i;
		
		for(i=0;i<files.models.length;i++) {
			model = files.models[i];
			
			if(model.getFile().name === "package.js") {
				continue;
			}

			this.updateCode(files.get(model.id));
		}
	},
	updateCode: function(inDoc) {
		var filename = inDoc.getFile().path,
			code = inDoc.getAceSession().getValue();

		if(filename.slice(-4) === ".css") {
			this.syncCSSFile(filename, code);
		} else if(filename.slice(-3) === ".js") {
			this.syncJSFile(code);
		}
	},
	syncCSSFile: function(inFilename, inCode) {
		this.$.deimos.syncCSSFile(inFilename, inCode);
	},
	syncJSFile: function(inCode) {
		this.$.deimos.syncJSFile(inCode);
	},
	showWaitPopup: function(inSender, inEvent) {
		this.$.waitPopupMessage.setContent(inEvent.msg);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	showError: function(inSender, inEvent) {
		this.trace("event:", inEvent, "from sender:", inSender);
		this.hideWaitPopup();
		this.showErrorPopup(inEvent);
		return true; //Stop event propagation
	},
	showErrorPopup : function(inEvent) {
		this.$.errorPopup.raise(inEvent);
	},
	/**
	 * Event handler for user-initiated file or folder changes
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent as defined by calls to HermesFileTree#doTreeChanged
	 */
	_treeChanged: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.packageMunger.changeNodes(inEvent, (function(err) {
			if (err) {
				this.warn(err);
			}
		}).bind(this));
	},
	/**
	 * Event handler for system-initiated file or folder changes
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent as defined by calls to Ares.PackageMunger#doChangingNode
	 */
	_nodeChanging: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var docId = Ares.Workspace.files.computeId(inEvent.node);
		this._closeDocument(docId);
	},

	statics: {
		isBrowserSupported: function() {
			if (enyo.platform.ie && enyo.platform.ie <= 8) {
				return false;
			} else {
				return true;
			}
		},
		instance: null
	}
});
