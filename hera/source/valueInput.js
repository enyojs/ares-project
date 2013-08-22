  // Copyright 2013, $ORGANIZATION
// All rights reserved.
/* global ares */
enyo.kind({
	name: "valueInput",
	kind: "Control",
	published: {
	},
	events: {
		onValueUpdate: "",
		onUnitChange: "",
		onRegisterMe: "",
	},
	components: [
		{kind: "Panels", arrangerKind: "CardArranger",  style: "border: solid black thin;", classes: "enyo-fit",	components: [
			{name: "blank", kind: "Control", showing: true, components: [
		]},
		
			{name: "sliders", kind: "Control", showing: false, components: [
			{style: "height: 5px"},
			{style: "height: 15px;  text-align: center; ", content: "Color Sliders" },
			{style: "height: 5px"},
			{name: "redSlider", kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged", style: "height:10px; background-color: red; enyo-unselectable;"},
			{style: "height: 5px"},

			{name: "greenSlider", kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged", style: "height:10px;  background-color: green; enyo-unselectable" },
			{style: "height: 5px"},

			{name: "blueSlider", kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged", style: "height:10px;  background-color: blue; enyo-unselectable" },
		]},	// sliders
		
			{name: "misc", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "Misc Input" },
				{style: "height: 5px"},
							
				{kind: "FittableColumns", fit: true, components: [
					{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", placeholder: "Enter text here", onchange:"input_misc"},
				]},

			]},
		]},	// misc		
			
			{name: "xy", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "X and Y Inputs" },
				{style: "height: 5px"},
				{ fit: true, content:"Inputs xy"},
				{kind: "onyx.PickerDecorator", components: [		
			]}
		]}, // xy
			
			{name: "xyz", kind: "Control", showing: false, classes:"left-input-box", components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "X Y Z & Color Inputs " },
				{style: "height: 5px"},
				{tag: "br"},
				
					{kind: "FittableColumns", fit: true, classes:"left-input-col",  components: [
					{style: "text-align: right;", content:"X Y & Z offset"},
					{tag:"span"	, content:"  "},
					{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [						
						{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
						{name: "Inputx", kind: "onyx.Picker", classes:"left-input-dec", content: "0", onSelect: "inputx"},
					]},
					{kind: "onyx.PickerDecorator", components: [						
						{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
						{name: "Inputy", kind: "onyx.Picker", onSelect: "inputy"},
					]},
					{kind: "onyx.PickerDecorator", components: [						
						{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
						{name: "Inputz", kind: "onyx.Picker", onSelect: "inputz"},
					]},	
					{kind: "onyx.PickerDecorator", style: " width: 40px;", components: [
						{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
						{kind: "onyx.Picker", onSelect: "unit_type", components: [
							{content: "px", active: true},
							{content: "cm"},
							{content: "em"},
							{content: "ern"},
							{content: "rem"},
							{content: "%"}
						]}
					]},
				]},	
			{tag: "br"},
			{tag: "br"},	
			{kind: "Control", showing: true, components: [
				{kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged", style: "height:10px; background-color: red; enyo-unselectable;"},
				{style: "height: 5px"},
				{kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged", style: "height:10px;  background-color: green; enyo-unselectable" },
				{style: "height: 5px"},
				{ kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged", style: "height:10px;  background-color: blue; enyo-unselectable" },
			]},
		]},	//xyz
			
			{name: "Picker", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "Picker Inputs" },
				{style: "height: 5px", tag: "br"},
				{kind: "FittableColumns", fit: true, components: [			
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 80px; font-size: 10px;"},
						{name: "Input", kind: "onyx.Picker", onSelect: "input_picker"},
					]},
				
				{kind: "onyx.PickerDecorator", style: "width: 40px;", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "Unit", kind: "onyx.Picker", onSelect: "unit_type", components: [
						{content: "px", active: true},
						{content: "cm"},
						{content: "em"},
						{content: "ern"},
						{content: "rem"},
						{content: "%"}
					]}
				]},
			]}
		]},	// picker
			
		]}
	],
	
	blank: 0,
	sliders: 1,
	inputbox: 2,	
	xy: 3,
	xyz: 4,
	picker: 5,	
	
	debug: false,

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
		this.doRegisterMe({name:"valueInput", reference:this});
		this.red = "00";
		this.blue = "00";
		this.green = "00";
		this.misc = "";
		this.unit = "px";
		var step = 1;
		for (var j = 0; j < 2000; j+= step) {
			if(j <= 9){
				this.$.Inputx.createComponent({content: j, active: !j});
				this.$.Inputy.createComponent({content: j, active: !j});
				this.$.Inputz.createComponent({content: j, active: !j});
				this.$.Input.createComponent({content: j, active: !j});
			}
			if(j >= 10 && j <= 40){
				step = 2;
				this.$.Input.createComponent({content: j, active: !j});
			}
			if(j > 40){
				step = 10;
				this.$.Input.createComponent({content: j, active: !j});
			}
		}
	},
	
	redChanged: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length === 1){
			h = '0' + h;
		}
		this.red = h;
		this.color();
	},
	
	redSliding: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);	
		if (h.length == 1){
			h = '0' + h;
		}
		this.red = h;
		this.color();
	},
	
	blueChanged: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.blue = h;
		this.color();
	},
			
	blueSliding: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.blue = h;
		this.color();
	},
	
	greenChanged: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.green = h;
		this.color();
	},
	
	greenSliding: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.green = h;
		this.color();
	},
	
	showsblank: function(inSender,inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.blank);
	},
	
	showssliders: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.sliders);
	},
	
	showmisc: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.inputbox);
	},
	
	showxy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.xy);
	},
	
	showxyz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.xyz);
	},
	
	showpicker: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.clear();
		this.$.panels.setIndex(this.picker);
	},
	
	input_picker: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var unit = this.unit;
		this.misc_picker = inEvent.content;		
		this.total();
	},
	
	input_misc: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var type = this.unit;
		this.misc = inEvent.value + type;
		this.total();
	},
	
	inputx: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.x = inEvent.content;
		this.total();
	},
	
	inputy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.y = inEvent.content ;
		this.total();
	},
	
	inputz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.z = inEvent.content;
		this.total();
	},
	
	unit_type: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.unit = inEvent;
		this.total(inEvent);
	},
	
	color: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.c = '#' + (this.red + this.green + this.blue).toUpperCase();
		this.total();
	},
	
	total: function(inSender, inEvent){
		var valueout = "";
		if (this.unit.content === undefined){
			this.unit = "px";
		}else{
			this.unit = this.unit.content;
		}
		
		if(this.x !== undefined){
			valueout = valueout +" " + this.x  + this.unit;
			
		}		
		if(this.y !== undefined){
			valueout = valueout + " " + this.y  + this.unit;	
		
		}
		if(this.z !== undefined){
			valueout = valueout + " " + this.z + this.unit;
			
		}		
		if(this.c !== undefined ){
			valueout = valueout + " " + this.c;		
		}		
		if(this.misc !== undefined){
			valueout = valueout + " " + this.misc;			
		}
		if(this.misc_picker !== undefined){
			valueout = valueout + " " + this.misc_picker + this.unit;
			
		}
		this.valueout = valueout + ";";
		valueout = "";
		this.doValueUpdate();
		
		
	},
	
	clear: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.c = undefined;
		this.x = undefined;
		this.y = undefined;
		this.z = undefined;
		this.misc = undefined;
		this.misc_picker = undefined;
		this.valueout = undefined;
	}
	
});
