enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "onyx",
	fit: true,
	components: [
		{kind: "Panels", arrangerKind: "CarouselArranger", draggable: false, classes:"enyo-fit ares-panels", components: [
			{components: [
				{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument", onUpdate: "phobosUpdate"}
			]},
			{components: [
				{kind: "Deimos", onCloseDesigner: "closeDesigner", onDesignerUpdate: "designerUpdate", onUndo: "designerUndo", onRedo: "designerRedo"}
			]}
		]},
		{kind: "Slideable", layoutKind: "FittableRowsLayout", classes: "onyx ares-files-slider", axis: "v", value: 0, min: -500, max: 0, unit: "px", onAnimateFinish: "finishedSliding", components: [
			{kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "doubleclickFile", onProjectSelected: "projectSelected"},
			{name: "bottomBar", kind: "DocumentToolbar",
				onToggleOpen: "toggleFiles",
				onSwitchFile: "switchFile",
				onSave: "bounceSave",
				onDesign: "bounceDesign",
				onNewKind: "bounceNew",
				onClose: "bounceClose"
			}
		]},
		{kind: "ServiceRegistry"}
	],
	handlers: {
		onReloadServices: "handleReloadServices",
		onUpdateAuth: "handleUpdateAuth"
	},
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	create: function() {
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
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.reloadServices();
	},
	/**
	 * @private
	 */
	handleUpdateAuth: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.setConfig(inEvent.serviceId, {auth: inEvent.auth}, inEvent.next);
	},
	doubleclickFile: function(inSender, inEvent) {
		var f = inEvent.file;
		var id = Ares.Workspace.files.computeId(f);
		var d = Ares.Workspace.files.get(id);
		if (d) {
			this.switchToDocument(d);
		} else {
			this.$.bottomBar.createFileTab(f.name, id);
			this.$.slideable.setDraggable(true);
			this.openDocument(inSender, inEvent);
		}
	},
	projectSelected: function() {
		setTimeout(enyo.bind(this, function() { this.$.deimos.projectSelected(this.$.projectView.currentProject); }), 500);	// <-- TODO - using timeout here because project url is set asynchronously
		return true;
	},
	openDocument: function(inSender, inEvent) {
		var f = inEvent.file;
		var projectData = inEvent.projectData;
		
		var service = projectData.getService();
		this.$.phobos.beginOpenDoc();
		service.getFile(f.id)
			.response(this, function(inEvent, inData) {
				if (inData.content) {
					inData=inData.content;
				} else {
					// no data? Empty file
					inData="";
				}
				var id = Ares.Workspace.files.computeId(f);
				if (Ares.Workspace.files.get(id)) {
					alert("Duplicate File ID in cache!");
				}
				var doc = Ares.Workspace.files.newEntry(f, inData, projectData);
				this.switchToDocument(doc);
			})
			.error(this, function(inEvent, inData) {
				enyo.log("Open failed", inData);
				this.$.phobos.hideWaitPopup();
			});
	},
	saveDocument: function(inSender, inEvent) {
		var service = inEvent.file.service;
		service.putFile(inEvent.file.id, inEvent.content)
			.response(this, function(inEvent, inData) {
				inSender.saveComplete();
				this.$.deimos.saveComplete();
			})
			.error(this, function(inEvent, inData) {
				inSender.saveFailed(inData);
			});
	},
	closeDocument: function(inSender, inEvent) {
		// remove file from cache
		Ares.Workspace.files.removeEntry(inEvent.id);
		this.$.bottomBar.removeTab(inEvent.id);
		this.$.slideable.setDraggable(Ares.Workspace.files.length > 0);
		this.showFiles();
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
			this.$.phobos.updateComponents(inSender, inEvent);
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
			doc = inDoc;
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
	statics: {
		isBrowserSupported: function() {
			if (enyo.platform.ie && enyo.platform.ie <= 8) {
				return false;
			} else {
				return true;
			}
		}
	}
});
