enyo.kind({
	name: "CategoryStyle",
	components: [
		{classes: "css-editor-category", components: [
			{ontap:"toggleDrawer", classes: "css-editor-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span"},
			]},
			{name:"drawer", kind: "onyx.Drawer", open:true, components: [
				{name: "list", kind: "Repeater", onSetupItem: "setupItem", components: [
					{name: "styleItem", kind: "Inspector.Config.Number"}
				]}
			]}
		]}
	],
	propList: [],
	toggleDrawer: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	setModel: function(inCategory) {
		this.propList = inCategory.properties;
		this.$.name.setContent(inCategory.cssStyleName);
		this.$.list.setCount(((inCategory.properties).split(",")).length);
		this.$.list.build();			
	},
	setupItem: function(inSender, inEvent) {
		var prop = (this.propList) && (this.propList).split(",");
		inEvent.item.$.styleItem.setFieldName(prop[inEvent.index]+":");

		if (this.propUser !== "" || this.propUser !== null) {
			var p = this.propUser.split(";");
			var keys = Object.keys(p);
			enyo.forEach(keys, function(o) {
				if (p[o].indexOf(prop[inEvent.index]) > -1) {
					var s = p[o].split(":");
					for (i=0; i < s.length; i++) {
						inEvent.item.$.styleItem.setFieldValue(s[i] || "");	
					}
				}
			}, this);

		}
		return true;
	}
});

enyo.kind({
	name: "CssEditor",
	kind: "FittableRows",
	events: {
		onChange: ""
	},
	cssEditorConfig: [
		{cssStyleName: "Background-Style", properties: "background-color,background-image,background-position"},
		{cssStyleName: "Border-Style", properties: "border-style,border-width"},
		{cssStyleName: "Font-Style", properties: "font-size,font-family"},
		{cssStyleName: "Text-Style", properties: "text-indent"},
		{cssStyleName: "Position-Style", properties: "top,left,right,bottom"}
	],
	create: function() {
		this.inherited(arguments);
		var keys = Object.keys(this.cssEditorConfig);
		enyo.forEach(keys, function(o) {
			var category = this.createComponent({kind: "CategoryStyle", propUser: this.currentControlStyle});
			category.setModel(this.cssEditorConfig[o]);
		}, this);
	}
});
