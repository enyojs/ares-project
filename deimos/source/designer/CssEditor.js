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
		// {cssStyleName: "Background-Style", properties: "background-color"},
		{cssStyleName: "Border-Style",
		properties: [
			{name: "border-color",
			config: {"text": true, 
				"palette": true, 
				"picker": null, 
				"slider": false,
				"unit": false},
			},
			{name: "border-style",
			config: {"text": true, 
				"palette": false, 
				"picker": true, 
				"slider": false,
				"unit": false},
			pickerItems: ["", "dotted", "dashed", "double", "groove", "hidden", 
							"ridge",  "solid", "inset", "outset" ]
			},
			{name: "border-width",
			config: {"text": true, 
				"palette": false, 
				"picker": null, 
				"slider": true,
				"unit": true}
			}
		]
		},
		{cssStyleName: "Font-Style",
		properties: [
			{name: "font-size",
			config: {"text": true, 
				"palette": false, 
				"picker": null, 
				"slider": true,
				"unit": true}
			},
			{name: "font-family",
			config: {"text": true, 
				"palette": false, 
				"picker": true, 
				"slider": false,
				"unit": false},
			pickerItems: ["", "arial", "arial black", "comic sans ms", "courier new", "georgia", 
							"helvetica",  "times new roman", "trebuchet ms", "verdana" ]
			},
		]
		},
		{cssStyleName: "Paddings-Margins",
		properties: [
			{name: "padding",
			config: {"text": true, 
				"palette": false, 
				"picker": null, 
				"slider": true,
				"unit": true}
			},
			{name: "margin",
			config: {"text": true, 
				"palette": false, 
				"picker": null, 
				"slider": true,
				"unit": true}
			}
		]
		},
		{cssStyleName: "Text-Style",
		properties: [
			{
				name: "text-indent",
				config: {"text": true, 
					"palette": false, 
					"picker": null, 
					"slider": true,
					"unit": true}
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
