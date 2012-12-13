enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "onyx",
	fit: true,
	components: [
		{kind: "Panels", arrangerKind: "CarouselArranger", classes:"enyo-fit ares-panels", components: [
			{components: [
				{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument"}
			]},
			{components: [
				{kind: "Deimos", onCloseDesigner: "closeDesigner"}
			]}
		]},
		{kind: "Slideable", layoutKind: "FittableRowsLayout", classes: "onyx ares-files-slider", axis: "v", value: 0, min: -500, max: 0, unit: "px", onAnimateFinish: "finishedSliding", components: [
			{kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "doubleclickFile"},
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
		onReloadServices: "handleReloadServices"
	},
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	create: function() {
		this.inherited(arguments);
		this.$.panels.setIndex(this.phobosViewIndex);
		this.adjustBarMode();

		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (Ares.TestController) {
			WorkspaceData.loadProjects("com.enyojs.ares.tests", true);
			// in charge of Ares Test Suite
			this.createComponent({kind: "Ares.TestController", aresObj: this});
		} else {
			WorkspaceData.loadProjects();
		}
		this.calcSlideableLimit();
	},
	rendered: function() {
		this.inherited(arguments);
		this.calcSlideableLimit();
	},
	draggable: false,
	handleReloadServices: function(inSender, inEvent) {
		this.$.serviceRegistry.reloadServices();
	},
	doubleclickFile: function(inSender, inEvent) {
		var f = inEvent.file;
		var id = WorkspaceData.files.computeId(f);
		var d = WorkspaceData.files.get(id);
		if (d) {
			this.switchToDocument(d);
		} else {
			this.$.bottomBar.createFileTab(f.name, id);
			this.$.slideable.setDraggable(true);
			this.openDocument(inSender, inEvent);
		}
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
				var id = WorkspaceData.files.computeId(f);
				if (WorkspaceData.files.get(id)) {
					alert("Duplicate File ID in cache!");
				}
				var doc = WorkspaceData.files.newEntry(f, inData, projectData);
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
		WorkspaceData.files.removeEntry(inEvent.id);
		this.$.bottomBar.removeTab(inEvent.id);
		this.$.slideable.setDraggable(WorkspaceData.files.length > 0);
		this.showFiles();
	},
	designDocument: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
		this.$.panels.setIndex(this.deimosViewIndex);
		this.adjustBarMode();
	},
	closeDesigner: function(inSender, inEvent) {
		if (inEvent.docHasChanged) {
			this.$.phobos.updateComponents(inSender, inEvent);
		}
		this.$.panels.setIndex(this.phobosViewIndex);
		this.adjustBarMode();
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
		if (this.$.slideable.value < 0 || WorkspaceData.files.length === 0) {
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
		var d = WorkspaceData.files.get(inEvent.id);
		if (d) {
			this.switchToDocument(d);
		} else {
			alert("File ID not found in cache!");
		}
	},
	switchToDocument: function(d) {
		// save document state
		if (this.activeDocument) {
			this.activeDocument.setData(this.$.phobos.getEditorContent());
		}
		if (!this.activeDocument || d !== this.activeDocument) {
			this.$.phobos.openDoc(d);
		}
		this.$.panels.setIndex(this.phobosViewIndex);
		this.adjustBarMode();
		this.$.bottomBar.activateFileWithId(d.getId());
		this.hideFiles();
		this.activeDocument = d;
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
	}
});
