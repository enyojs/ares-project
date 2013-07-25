/* global ares */

enyo.kind({
	name: "CssEditor",
	kind: "FittableRows",
	events: {
		onChange: ""
	},
	cssEditorConfig: [
		{category: "Background-Style", properties: [
			{name: "background-color",	inputKind: "Inspector.Config.Color"}
		]},
		{category: "Border-Style",	properties: [
			{name: "border-color", inputKind: "Inspector.Config.Color"},
			{name: "border-style", inputKind: {kind: "Inspector.Config.Event",
					values: ["dotted", "dashed", "double", "groove", "hidden", "ridge",  "solid", "inset", "outset"]
				}
			},
			{name: "border-width", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			}
		]},
		{category: "Paddings-Margins",	properties: [
			{name: "padding", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "margin", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			}
		]},

		{category: "Font-Style", properties: [
			{name: "font-size", inputKind: "Inspector.Config.Size"},
			{name: "font-family", inputKind: {kind: "Inspector.Config.Event",
					values: ["arial", "arial black", "comic sans ms", "courier new", "georgia", 
										"helvetica",  "times new roman", "trebuchet ms", "verdana" ]
				}
			},
			{name: "text-indent", inputKind: "Inspector.Config.Size"}
		]}
	],
	fieldName: null,
	fieldValue: null,
	
	create: function() {
		this.inherited(arguments);

		// Convert css string to hash
		this.styleProps = {};
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(this.currentStyle), this.styleProps);

		enyo.forEach(this.cssEditorConfig, function(category) {
			this.createComponent({kind: "CssEditor.Category", propUser: this.styleProps, config: category, onChange: "change"});
		}, this);
	},	
	change: function(inSender, inEvent) {
		if (!inEvent.target) {
			return true;
		}
		
		var v = this.trimWhitespace(inEvent.target.fieldValue),
			n = this.trimWhitespace(inEvent.target.fieldName);
		
		// If no fieldname, something is wrong
		if (n === "") {
			return true;
		}

		// Add/replace new style
		this.styleProps[n] = v;
		
		// Set relevant properties
		this.fieldName = "style";
		this.fieldValue = enyo.Control.domStylesToCssText(this.styleProps);
		
		// Update change event target
		inEvent.target = this;
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		return inStr.replace(/\s/g, "");
	}
});

enyo.kind({
	name: "CssEditor.Category",
	components: [
		{classes: "css-editor-category", components: [
			{ontap:"toggleDrawer", classes: "css-editor-category-name", components: [
				{name: "indicator", classes: "css-editor-turned css-editor-indicator "},
				{name: "name", tag:"span"}
			]},
			{name:"drawer", kind: "onyx.Drawer", open:true, components: [
				{name: "list", kind: "Repeater", onSetupItem: "setupItem", components: [
					{name: "item"}
				]}
			]}
		]}
	],
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.$.name.setContent(this.config.category);
		this.$.list.setCount((this.config.properties).length);
		this.$.list.build();			
	},
	toggleDrawer: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("css-editor-turned", !open);
	},
	setupItem: function(inSender, inEvent) {
		var prop = this.config.properties[inEvent.index];
		var item = inEvent.item.$.item;
		var value = this.propUser[prop.name];
		var kind = prop.inputKind;
		if (kind && kind instanceof Object) {
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {fieldName: prop.name, fieldValue: value});
		} else {
			kind = {kind: kind, fieldName: prop.name, fieldValue: value};
		}
		this.trace("CREATE", kind);
		item.createComponent(kind, {owner: this});
		return true;
	}
});

enyo.kind({
	name: "PalettePicker",
	components: [
		{kind: "ColorPicker", onColorSelected: "onPick"}
	],
	events: {
		onChange: ""
	},
	onPick: function(inSender, color){
		this.doChange({target:this.$.colorPicker});
		return true;
	}
});
