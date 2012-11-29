enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "app onyx",
	fit: true,
	components: [
		{kind: "Panels", /*arrangerKind: "CarouselArranger",*/ classes: "enyo-fit", components: [
			{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument"},
			{kind: "Deimos", onCloseDesigner: "closeDesigner"},
		]},
		{kind: "Slideable", style: "height: 100%; width: 100%", layoutKind: "FittableRowsLayout", classes: "onyx", axis: "v", value: 0, min: -500, max: 0, unit: "px", components: [
			{kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "openDocument"},
			{kind: "onyx.MoreToolbar", components: [
				{kind: "onyx.Grabber", ontap: "toggleFiles"},
				{kind: "onyx.RadioGroup", components: [
				    {content: "file.txt"}
				]}
			]}
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
			this.createComponent({kind: "ares.TestConsoleRunner", reporterKind: "ares.TestConsoleReporter"});
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
				this.$.phobos.openDoc(origin, f, inData, ext, projectUrl);
				this.$.panels.setIndex(this.phobosViewIndex);
				this.hideFiles();
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
		var min = this.getBounds().height-this.$.moreToolbar.getBounds().height;
		this.$.slideable.setMin(-min);
	}
});
