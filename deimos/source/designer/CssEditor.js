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
		{category: "Padding",	properties: [
			{name: "padding-top", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "padding-bottom", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "padding-right", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "padding-left", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			}
		]},
		{category: "Padding-ShortHand",	properties: [
			{name: "padding", inputKind:  {kind:"Inspector.Config.Text"}}
		]},
		{category: "Margin",	properties: [
			{name: "margin-top", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "margin-bottom", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "margin-right", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			},
			{name: "margin-left", inputKind: {kind: "Inspector.Config.Size",
					values: ["px","cm","em","ern","rem", "%"]
				}
			}
		]},
		{category: "Margin-ShortHand",	properties: [
			{name: "margin", inputKind:  {kind:"Inspector.Config.Text"}}
		]},
		{category: "Font-Style", properties: [
			{name: "font-family", inputKind: {kind: "Inspector.Config.Event",
					values: ["arial", "arial black", "comic sans ms", "courier new", "georgia", 
										"helvetica",  "times new roman", "trebuchet ms", "verdana" ]
				}
			},
			{name: "font-style", inputKind: {kind: "Inspector.Config.Event",
					values: ["normal", "italic", "oblique" ]
				}
			},
			{name: "font-variant", inputKind: {kind: "Inspector.Config.Event",
					values: ["normal", "small-caps"]
				}
			},
			{name: "font-weight", inputKind: {kind: "Inspector.Config.Event",
					values: ["normal", "bold", "bolder","lighter"]
				}
			},
			{name: "font-size", inputKind: "Inspector.Config.Size"},
			{name: "line-height", inputKind: "Inspector.Config.Size"},
			{name: "color",	inputKind: "Inspector.Config.Color"}
		]},			
		{category: "Text-Style", properties: [
			{name: "text-align", inputKind: {kind: "Inspector.Config.Event",
					values: ["center", "left", "right"]
				}
			},
			{name: "text-decoration", inputKind: {kind: "Inspector.Config.Event",
					values: ["overline", "line-through", "underline"]
				}
			},
			{name: "text-indent", inputKind: "Inspector.Config.Size"},
			{name: "text-justify", inputKind: {kind: "Inspector.Config.Event",
					values: ["auto", "inter-word", "inter-ideograph", "inter-cluster", "distribute", "kashida", "trim", "none"]
				}
			}
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
			this.createComponent({kind: "CssEditor.Category", propUser: this.styleProps, config: category, owner: this, onChange: "change"});
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

		// Update lastModifiedCategory
		enyo.forEach(this.cssEditorConfig, function(category) {
			var keys = Object.keys(category.properties);
			enyo.forEach(keys, function(item) {
				if (category.properties[item].name === n) {
					this.inspectorObj.lastModifiedCategory = category.category;
				}
			}, this);	
		}, this);	
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		// do not trimWhitespace in case of shorthand form
		if (((inStr).split(" ")).length === 1) {
			inStr.replace(/\s/g, "");
		} 
		return inStr;
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
			{name:"drawer", kind: "onyx.Drawer", open:false, components: [
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
		var open = this.$.drawer.getOpen();
		if ((this.owner.inspectorObj.lastModifiedCategory === undefined) || 
					(this.owner.inspectorObj.lastModifiedCategory === this.config.category)) {
			this.owner.inspectorObj.lastModifiedCategory = this.config.category;
			this.$.drawer.setOpen(!open);
			this.$.indicator.addRemoveClass("css-editor-turned", !open);
		} else {
			this.$.drawer.setOpen(open);
			this.$.indicator.addRemoveClass("css-editor-turned", open);			
		}
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
