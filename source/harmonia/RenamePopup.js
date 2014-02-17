enyo.kind({
	name: "RenamePopup",
	kind: "NamePopup",
	create: function() {
		this.inherited(arguments);
		this.$.confirmButton.setContent("Rename");
	}
});
