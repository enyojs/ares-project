enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "app onyx",
	fit: true,
	components: [
		{kind: "Panels", /*arrangerKind: "CarouselArranger",*/ classes: "enyo-fit", components: [
			{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument"},
			{kind: "Deimos", onCloseDesigner: "closeDesigner"}
		]},
		{kind: "Slideable", style: "height: 100%; width: 100%", layoutKind: "FittableRowsLayout", classes: "onyx", axis: "v", value: 0, min: -500, max: 0, unit: "px", onAnimateFinish: "finishedSliding", components: [
			{kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "doubleclickFile"},
			{name: "bottomBar", kind: "DocumentToolbar", onGrabberTap: "toggleFiles", onSwitchFile: "switchFile", onSave: "", onDesign: "", onNewKind: ""}
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

		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (this.runTest) {
			// in charge of Ares Test Suite when Ares Ide launch with runTest option
			this.createComponent({kind: "ares.TestController"});
		}
		this.calcSlideableLimit();
	},
	rendered: function() {
		this.inherited(arguments);
		this.calcSlideableLimit();
	},
	openFiles: {},
	draggable: false,
	handleReloadServices: function(inSender, inEvent) {
		this.$.serviceRegistry.reloadServices();
	},
	doubleclickFile: function(inSender, inEvent) {
		var f = inEvent.file;
		var d = this.openFiles[inEvent.file.id];
		if (d) {
			this.switchToDocument(d);
		} else {
			this.$.bottomBar.createFileTab(f.name, f.id);
			this.openDocument(inSender, inEvent);
		}
	},
	openDocument: function(inSender, inEvent) {
		var f = inEvent.file;
		var service = f.service;
		var ext = f.name.split(".").pop();
		var origin = service.getConfig().origin;
		var projectUrl = origin + service.getConfig().pathname + "/file" + inEvent.project;
		this.$.phobos.beginOpenDoc();
		service.getFile(f.id)
			.response(this, function(inEvent, inData) {
				if (inData.content) {
					inData=inData.content;
				} else {
					// no data? Empty file
					inData="";
				}
				if (this.openFiles[f.id]) {
					alert("Duplicate File ID in cache!");
				}
				var doc = {
					origin: origin,
					file: f,
					data: inData,
					extension: ext,
					projectUrl: projectUrl
				};
				this.openFiles[f.id] = doc;
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
		this.showFiles();
	},
	designDocument: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
		this.$.panels.setIndex(this.deimosViewIndex);
	},
	closeDesigner: function(inSender, inEvent) {
		if (inEvent.docHasChanged) {
			this.$.phobos.updateComponents(inSender, inEvent);
		}
		this.$.panels.setIndex(this.phobosViewIndex);
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
		if (this.$.slideable.value < 0) {
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
		var d = this.openFiles[inEvent.id];
		if (d) {
			this.switchToDocument(d);
		} else {
			alert("File ID not found in cache!");
		}
	},
	switchToDocument: function(d) {
		this.$.phobos.openDoc(d.origin, d.file, d.data, d.ext, d.projectUrl);
		this.$.panels.setIndex(this.phobosViewIndex);
		this.$.bottomBar.activateFileWithId(d.file.id);
		this.hideFiles();
	},
	finishedSliding: function(inSender, inEvent) {
		if (this.$.slideable.value < 0) {
			this.$.bottomBar.showControls();
		} else {
			this.$.bottomBar.hideControls();
		}
	}
});
