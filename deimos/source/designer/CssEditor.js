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
		inEvent.item.$.styleItem.setFieldName(prop[inEvent.index]);

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
		{cssStyleName: "Background-Style", properties: "background-color"},
		{cssStyleName: "Border-Style", properties: "border-style,border-width,border-color"},
		{cssStyleName: "Font-Style", properties: "font-size,font-family"},
		{cssStyleName: "Paddings-Margins", properties: "padding,margin"},
		{cssStyleName: "Text-Style", properties: "text-indent"}
	],
	fieldName: null,
	fieldValue: null,
	
	create: function() {
		this.inherited(arguments);
		var keys = Object.keys(this.cssEditorConfig);
		enyo.forEach(keys, function(o) {
			var category = this.createComponent({kind: "CategoryStyle", propUser: this.currentControlStyle, onChange: "change"});
			category.setModel(this.cssEditorConfig[o]);
		}, this);
	},	
	change: function(inSender, inEvent) {
		if (!inEvent.target) {
			return true;
		}
		
		var v = this.trimWhitespace(inEvent.target.fieldValue),
			n = this.trimWhitespace(inEvent.target.fieldName),
			styleProps = {},
			updatedProp = {}
		;
		
		// If no fieldname, something is wrong
		if (n == "") {
			return true;
		}
		
		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(this.currentControlStyle), styleProps);

		// Add/replace new style
		styleProps[n] = v;
		
		// Set relevant properties
		this.fieldName = "style";
		this.fieldValue = enyo.Control.domStylesToCssText(styleProps);
		
		// Update change event target
		inEvent.target = this;
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		return inStr.replace(/\s/g, "");
	}
});
