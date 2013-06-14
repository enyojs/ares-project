enyo.kind({
	name: "PalettePicker",
	components: [
		{kind: "ColorPicker", onColorPick: "onPick", onColorSlide: "onPick"}
	],
	events: {
		onChange: ""
	},
	onPick: function(inSender, color){
		this.doChange({target:this.$.colorPicker});
		return true;
	}
});

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
					{name: "styleItem", kind: "Inspector.Config.MultiType"}
				]}
			]}
		]}
	],
	cssConfig: null,
	toggleDrawer: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	setModel: function(inCategory) {
		this.cssConfig = inCategory;
		this.$.name.setContent(inCategory.cssStyleName);
		this.$.list.setCount((inCategory.properties).length);
		this.$.list.build();			
	},
	setupItem: function(inSender, inEvent) {
		var prop = this.cssConfig.properties;
		var item = inEvent.item.$.styleItem;
		item.setFieldName(prop[inEvent.index].name);
		item.setConfig(this.cssConfig.properties[inEvent.index], item);		
		item.setValues(this.cssConfig.properties[inEvent.index], this.propUser, item);
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
		{cssStyleName: "Background-Style", 
		properties: [
			{name: "background-color",
			config: {"text": true, 
				"palette": true, 
				"aspect": false, 
				"family": false, 
				"slider": false,
				"unit": false,
				"colorUnit": true},
			}
		]
		},
		{cssStyleName: "Border-Style",
		properties: [
			{name: "border-color",
			config: {"text": true, 
				"palette": true, 
				"aspect": false, 
				"family": false, 
				"slider": false,
				"unit": false,
				"colorUnit": true}
			},
			{name: "border-style",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": false,
				"unit": false,
				"colorUnit": false}
			},
			{name: "border-width",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": true,
				"unit": true,
				"colorUnit": false}
			}
		]
		},
		{cssStyleName: "Font-Style",
		properties: [
			{name: "font-size",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": true,
				"unit": true,
				"colorUnit": false}
			},
			{name: "font-family",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": false,
				"unit": false,
				"colorUnit": false}
			},
		]
		},
		{cssStyleName: "Paddings-Margins",
		properties: [
			{name: "padding",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": true,
				"unit": true,
				"colorUnit": false}
			},
			{name: "margin",
			config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": true,
				"unit": true,
				"colorUnit": false}
			}
		]
		},
		{cssStyleName: "Text-Style",
		properties: [
			{
				name: "text-indent",
				config: {"text": true, 
				"palette": false, 
				"aspect": false, 
				"family": false, 
				"slider": true,
				"unit": true,
				"colorUnit": false}
			}
		]
		}
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
		this.fieldName = "style";
		this.fieldValue = "";	
		if (inEvent.target.fieldValue !== "" &&
			inEvent.target.fieldName) {
				this.fieldValue = (inEvent.target.fieldName) + ":" + (inEvent.target.fieldValue) + ";";				
		}

		var u = this.currentControlStyle;
		var p = (u !== undefined) && (u.split(";"));
		if (!p) {
			// no style property defined, add one 
			this.currentControlStyle = v;
		} else {
			if (p.length <= 2 && 
				p[0].search(inEvent.target.fieldName) > -1 &&
				(this.fieldValue === "" || this.fieldValue === null)) {
				// remove the existing css style property
				this.currentControlStyle = "";
			} else {
				var added = false;
				// modify the value of the existing css style property list
				for (i=0; i < p.length; i++) {
					if (p[i].search(inEvent.target.fieldName) > -1) {
						this.currentControlStyle = u.replace(p[i]+";", this.fieldValue);
						added = true;
					}
				}
				if (!added) {
					this.currentControlStyle = u + this.fieldValue;
				}															
			}
		}
		this.fieldValue = this.currentControlStyle;
		this.doChange({target: this});
		return true;
	}
});
