enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.MoreToolbar",
	events: {
		onGrabberTap: "",
		onSwitchFile: ""
	},
	components: [
		{kind: "onyx.Grabber", ontap: "doGrabberTap"},
		{kind: "onyx.Drawer", classes: "ares-filedrawer", orient: "h", open: false, components: [
			{kind: "FittableColumns", components: [
				{kind: "onyx.Button", content: "Save"},
				{kind: "onyx.Button", content: "New Kind"},
				{kind: "onyx.Button", content: "Designer"}
			]}
		]}
	],
	documents: [],
	showControls: function() {
		this.$.drawer.setOpen(true);
	},
	hideControls: function() {
		this.$.drawer.setOpen(false);
	},
	createFileTab: function(file) {
		this.createComponent({
			kind: "onyx.Button",
			classes: "ares-tab-button",
			components: [
				{kind: "onyx.IconButton", src: "$lib/onyx/images/progress-button-cancel.png"},
		    	{content: file.name},
			],
			ontap: "switchFile",
			file: file
		}, {owner: this}).render();
	},
	switchFile: function(inSender, inEvent) {
		this.doSwitchFile({file: inSender.file});
	}
});
