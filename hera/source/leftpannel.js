// Copyright 2013, $ORGANIZATION
// All rights reserved.
/* global ares */

enyo.kind({
	name: "ColorItem",
	events: {
		onPickdeclaration: "",
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Color"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "Colorlist", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					
					{name:"item", classes: "list-sample-item enyo-border-box", components: [
						{tag:"span", name: "declaration", ontap: "tap"}
					]}
				]}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.$.Colorlist.setCount(this.dec.length);
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
		var dec = this.dec[index];
		item.$.declaration.setContent(dec.name);
		
		/* stop propagation */
		return true;
	},	
	
	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doPickdeclaration(this.dec[index]);
	},

	
	dec: [
		{name: "background-color", input:"color"},		
	]
	
});

enyo.kind({
	name: "FontsItem",
	events: {
		onPickdeclaration: "",
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Font"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "Fontlist", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					
					{name:"item", classes: "list-sample-item enyo-border-box", components: [
						{tag:"span", name: "font", style: "font-family: Serif;", ontap: "tap"}
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
		item.$.font.setContent(fonts.name);
		item.$.font.setStyle("font-family:" + fonts.name + ";");
		/* stop propagation */
		return true;
	},	
	
	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doPickdeclaration(this.fonts[index]);
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
	]
	
});

enyo.kind({
	name: "BorderItem",
	events: {
		onPickdeclaration: "",
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Border/Margin.."}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "borderlist", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					
					{name:"item", classes: "list-sample-item enyo-border-box", components: [
						{tag:"span", name: "border", ontap: "tap"}
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

	toggleDrawer: function() {
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
		item.$.border.setContent(border.name);
		
		/* stop propagation */
		return true;
	},	

	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doPickdeclaration(this.borders[index]);
	},
	
	borders: [
		{name: "width", input:"picker"},
		{name: "padding", input:"picker"},
		{name: "height", input:"picker"},
		{name: "box-shadow", input:"xyz"},
	]
	
});

enyo.kind({
	name: "ImageItem",
	events: {
		onPickdeclaration: "",
	},
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span", content:"Image"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "imagelist", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					
					{name:"item", classes: "list-sample-item enyo-border-box", components: [
						{tag:"span", name: "image", ontap: "tap"}
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

	toggleDrawer: function() {
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
		item.$.image.setContent(image.name);
		
		/* stop propagation */
		return true;
	},	

	tap: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var index = inEvent.index;	
		this.doPickdeclaration(this.image[index]);
	},
	
	image: [
		{name: "background-image", input:"misc"},
	]
	
});

enyo.kind({
	name: "leftpannel",
	kind: "Control",
	published: {
	},
	events: {
		onPickdeclaration: "",
	},
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "Scroller", fit: true, components: [
				
				{kind: "ColorItem"},
				{kind: "FontsItem"},
				{kind: "BorderItem"},
				{kind: "ImageItem"},
			]},
		]},
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		
	},
	

});


