enyo.kind({
	name: "Ares",
	kind: "enyo.Panels",
	fit: true,
	components: [
		{kind: "ServiceRegistry"},
		{kind: "Harmonia", onFileDblClick: "openDocument"},
		{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument"},
		{kind: "Deimos", onCloseDesigner: "closeDesigner"},
		{kind: "ProjectView", onFileDblClick: "openDocument"}
	],
	//arrangerKind: "CollapsingArranger",
	handlers: {
		onReloadServices: "handleReloadServices"
	},
	fileViewIndex: 0,
	create: function() {
		this.inherited(arguments);
		if (this.startOnProjectView && this.startOnProjectView === true) {
			this.fileViewIndex = 3;
			this.setIndex(this.fileViewIndex);
		}
	},
	draggable: false,
	handleReloadServices: function(inSender, inEvent) {
		this.$.serviceRegistry.reloadServices();
	},
	openDocument: function(inSender, inEvent) {
		var f = inEvent.file;
		var service = f.service;
		var ext = f.name.split(".").pop();
		this.$.phobos.beginOpenDoc();
		service.getFile(f.id)
			.response(this, function(inEvent, inData) {
				if (inData.content) {
					inData=inData.content;
				} else {
					// no data? Empty file
					inData="";
				}
				this.$.phobos.openDoc(f, inData, ext);
				this.setIndex(1);
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
			})
			.error(this, function(inEvent, inData) {
				enyo.log("Save failed", inData);
				inSender.hideWaitPopup();
			});
	},
	closeDocument: function(inSender, inEvent) {
		this.setIndex(this.fileViewIndex);
	},
	designDocument: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
		this.setIndex(2);
	},
	closeDesigner: function(inSender, inEvent) {
		if (inEvent.docHasChanged) {
			this.$.phobos.updateComponents(inSender, inEvent);
		}
		this.setIndex(1);
	}
});
