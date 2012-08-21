enyo.kind({
	name: "Ares",
	kind: "enyo.Panels",
	fit: true,
	components: [
		{kind: "HermesService", name: "service"},
		{kind: "Harmonia", onFileDblClick: "openDocument"},
		{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument"},
		{kind: "Deimos", onCloseDesigner: "closeDesigner"}
	],
	//arrangerKind: "CollapsingArranger",
	draggable: false,
	openDocument: function(inSender, inEvent) {
		var f = inEvent.file;
		this.fileId = f.id;
		var ext = f.name.split(".").pop();
		this.$.phobos.beginOpenDoc();
		this.$.service.getFile(f.id)
			.response(this, function(inEvent, inData) {
				if (inData.content) {
					inData=inData.content;
				} else {
					// no data? Empty file
					inData="";
				}
				this.$.phobos.openDoc(inData, ext);
				this.setIndex(1);
			})
			.error(this, function(inEvent, inData) {
				enyo.log("Open failed", inData);
				inSender.hideWaitPopup();
			});
	},
	saveDocument: function(inSender, inEvent) {
		this.$.service.putFile(this.fileId, inEvent.content)
			.response(this, function(inEvent, inData) {
				inSender.saveComplete();
			})
			.error(this, function(inEvent, inData) {
				enyo.log("Save failed", inData);
				inSender.hideWaitPopup();
			});
	},
	closeDocument: function(inSender, inEvent) {
		this.setIndex(0);
	},
	designDocument: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
		this.setIndex(2);
	},
	closeDesigner: function(inSender, inevent) {
		this.setIndex(1);
	}
});
