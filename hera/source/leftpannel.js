/*global ares, enyo */

enyo.kind({
	name: "Ares.Hera.ColorItem",
	events: {
		onPickdeclaration: "",
		onUncheck: "",
	},
	handlers: {
		onUnTap: "unhighlight"
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "drawName", tag:"span", content:"Color"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "colorlist", kind: "Repeater", classes: "list-sample-list enyo-border-box", count: 0, onSetupItem: "setupItem", components: [					
					{name: "item", classes: "list-sample-item ", components: [
						{name: "declaration", ontap: "tap"}
					]}
				]}
			]}
		]}  
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.$.colorlist.setCount(this.dec.length);
	},
	/**
	* @private
	* 
	*/
	toggleDrawer: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},

	setupItem: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		var item = inEvent.item;
		var dec = this.dec[index];
	
		if(item !== undefined){
			item.$.declaration.setContent(dec.name);
			if (this.highlight === index){
				this.$.colorlist.addRemoveClass("list-sample-selected", this.selected);
				item.$.declaration.addRemoveClass("list-sample-selected", this.selected);	// dose just the text	
			}
		}
		/* stop propagation */
		return true;
	},	
	
	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doUncheck();
		this.highlight = index;	
		this.selected = true;
		this.$.colorlist.renderRow(index);
		
		this.doPickdeclaration(this.dec[index]);
	},

	unhighlight: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.selected = false;
		for(var i = 0; i < this.dec.length; i++){
			this.$.colorlist.renderRow(i);
		}
	},
	
	dec: [
		{name: "background-color", input:"color"},
		{name: "outline-color", input:"color"}
	]
	
});

enyo.kind({
	name: "Ares.Hera.FontsItem",
	events: {
		onPickdeclaration: "",
		onUncheck: "",		
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Font"}
			]},
			{kind: "onyx.Drawer", name: "drawer", open:true, components: [
				{name: "Fontlist", kind: "Repeater", classes: "list-sample-list", count: 0, onSetupItem: "setupItem", components: [					
					{name: "item", classes: "list-sample-item enyo-border-box", components: [
						{name: "font", ontap: "tap"}
					]}
					
				]}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.$.Fontlist.setCount(this.fonts.length);
	},

	toggleDrawer: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},

	setupItem: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		var item = inEvent.item;
		var fonts = this.fonts[index];

		if(item !== undefined){
			item.$.font.setContent(fonts.name);
			item.$.font.setStyle("font-family:" + fonts.name + ";");
		
			if (this.highlight === index){
				item.$.font.addRemoveClass("list-sample-selected", this.selected);
			}
		}
		/* stop propagation */
		return true;
	},	
	
	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		this.doUncheck();
		this.highlight = index;	
		this.selected = true;		
		this.$.Fontlist.renderRow(index);	
		this.doPickdeclaration(this.fonts[index]);
	},
	
	unhighlight: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.selected = false;
		for(var i = 0; i < this.fonts.length; i++){
			this.$.Fontlist.renderRow(i);
		}
	},
	fonts: [
		{name: "color", input: "color"},
		{name: "font-size", input: "picker"},
		{name: "text-shadow", input: "xyz"},
		{name: "Serif", input: "font"},
		{name: "Sans-serif", input:"font"},
		{name: "Helvetica ", input: "font"},
		{name: "Monospace", input: "font"},
		{name: "Lucida Sans Unicode", input:"font"},
		{name: "text-align", input:"lrc"}
	]
	
});

enyo.kind({
	name: "Ares.Hera.BorderItem",
	events: {
		onPickdeclaration: "",
		onUncheck: "",
	},
	handlers: {
		onUnTap: "unhighlight"
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Border/Margin.."}
			]},
			{kind: "onyx.Drawer", name: "drawer", open:true, components: [
				{name: "borderlist", kind: "Repeater", classes: "list-sample-list", count: 0, onSetupItem: "setupItem", components: [					
					{name: "item", classes: "list-sample-item enyo-border-box", components: [
						{name: "border", ontap: "tap"}
					]}
					
				]}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.$.borderlist.setCount(this.borders.length);
	},

	toggleDrawer: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	
	setupItem: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		var item = inEvent.item;
		var border = this.borders[index];
		
		if(item !== undefined){
			if (this.highlight === index){
				item.$.border.addRemoveClass("list-sample-selected", this.selected);
			}
			item.$.border.setContent(border.name);	
		}
		/* stop propagation */
		return true;
	},	

	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doUncheck();
		this.highlight = index;	
		this.selected = true;
		this.$.borderlist.renderRow(index);		
		this.doPickdeclaration(this.borders[index]);
	},
	
	unhighlight: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.selected = false;
		for(var i = 0; i < this.borders.length; i++){
			this.$.borderlist.renderRow(i);
		}
	},
	
	borders: [
		{name: "width", input:"picker"},
		{name: "padding", input:"picker"},
		{name: "height", input:"picker"},
		{name: "border-color", input:"color"},
		{name: "box-shadow", input:"xyz"},
		{name: "border-radius", input:"xy"},
		{name: "border-top-color", input:"color"},
		{name: "border-right-color", input:"color"},
		{name: "border-left-color", input:"color"},
		{name: "border-bottom-color", input:"color"},
		{name: "border-width", input: "borderwidth"},
		{name: "padding-top", input: "picker"},
		{name: "padding-left", input: "picker"},
		{name: "padding-right", input: "picker"},
		{name: "padding-bottom", input: "picker"},
		{name: "margin", input: "picker"},
		{name: "margin-top", input: "picker"},
		{name: "margin-right", input: "picker"},
		{name: "margin-left", input: "picker"},
		{name: "margin-bottom", input: "picker"},
		
	]
	
});

enyo.kind({
	name: "Ares.Hera.ImageItem",
	events: {
		onPickdeclaration: "",
		onUncheck: "",
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Image"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "imagelist", kind: "Repeater", classes: "list-sample-list", count: 0, onSetupItem: "setupItem", components: [					
					{name: "item", classes: "list-sample-item enyo-border-box", components: [
						{name: "image", ontap: "tap"}
					]}
					
				]}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.$.imagelist.setCount(this.image.length);
	},

	toggleDrawer: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	
	setupItem: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		var item = inEvent.item;
		var image = this.image[index];
		
		if(item !== undefined){
			item.$.image.setContent(image.name);
			if (this.highlight === index){
				item.$.image.addRemoveClass("list-sample-selected", this.selected);
			}
		}
		/* stop propagation */
		return true;
	},	

	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;
		this.doUncheck();
		this.highlight = index;	
		this.selected = true;
		this.$.imagelist.renderRow(index);		
		this.doPickdeclaration(this.image[index]);
	},
	
	unhighlight: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.selected = false;
		for(var i = 0; i < this.image.length; i++){
			this.$.imagelist.renderRow(i);
		}
	},
	
	image: [
		{name: "background-image", input:"filepicker"},
		{name: "background-position", input:"xy"},
		{name: "background-clip", input:"bgc"},
		{name: "background-repeat", input:"bgr"}
	]
	
});

enyo.kind({
	name: "Ares.Hera.Leftpannel",
	kind: "Control",
	published: {
		
	},
	events: {
		onPickdeclaration: "",
		onUntap: "",
	},
	handlers: {
		onUncheck: "selected",
	},
	components: [
		{kind: "enyo.FittableRows", classes: "enyo-fit", components: [
			{kind: "Scroller", fit: true, components: [
				{kind: "Ares.Hera.ColorItem"},
				{kind: "Ares.Hera.FontsItem"},
				{kind: "Ares.Hera.BorderItem"},
				{kind: "Ares.Hera.ImageItem"},
			]},
		]},
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
	},
	
	selected: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.colorItem.unhighlight();
		this.$.fontsItem.unhighlight();
		this.$.borderItem.unhighlight();
		this.$.imageItem.unhighlight();
	}
});
