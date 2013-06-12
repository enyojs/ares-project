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
		inEvent.item.$.styleItem.setFieldName(prop[inEvent.index].name);

		var keys = Object.keys(prop[inEvent.index].config);
		enyo.forEach(keys, function(o) {
			// build the correct styleItem object
			if (prop[inEvent.index].config[o] !== true) {
				inEvent.item.$.styleItem.$[o].destroy();
			}				
			// build the picker list if needed
			if (o === "picker" && prop[inEvent.index].config[o]) {
				inEvent.item.$.styleItem.$.picker.values = this.getListItems(prop[inEvent.index].pickerItems);
				this.setUpPickerList(inEvent.item.$.styleItem.$.picker);
			}
		}, this);

		// display properties and values associated to the styleItem object freshly built
		if (this.propUser !== "" || this.propUser !== null) {
			var p = this.propUser.split(";");
			keys = Object.keys(p);
			enyo.forEach(keys, function(o) {
				if (p[o].indexOf(prop[inEvent.index].name) > -1) {
					var s = p[o].split(":");
					for (i=0; i < s.length; i++) {
						// filled-up text kind
						inEvent.item.$.styleItem.setFieldValue(s[i] || "");
						// filled-up slider kind
						if (inEvent.item.$.styleItem.$.slider !== undefined) {
							var val = s[i].match(/\d+\.?\d*/g);
							inEvent.item.$.styleItem.$.slider.setValue(val);   
							inEvent.item.$.styleItem.$.slider.setProgress(val);	
						}
					}
				}
			}, this);

		}
		return true;
	},
	getListItems: function(inList)  {
		var items = [];
		keys = Object.keys(inList);
		enyo.forEach(keys, function(o) {
			items.push(inList[o]);
		}, this);	
		return items;
	},
	setUpPickerList: function(inList)  {
		keys = Object.keys(inList.values);
		enyo.forEach(keys, function(o) {
				inList.createComponent({content: inList.values[o]});
		}, this);
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
