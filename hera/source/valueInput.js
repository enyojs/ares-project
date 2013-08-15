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
			{ fit: true, content:"Inputs"},
				
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
			
			{name: "xyz", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "X Y Z & Color Inputs " },
				{style: "height: 5px"},
				{tag: "br"},
				{name: "namex", tag:"span", content:"X offset  "},
				{kind: "onyx.InputDecorator", components: [
				{kind: "onyx.Input", placeholder: "Enter text here", onchange:"inputx"}
			]},	
			
			{tag: "br"},
			{name: "namey", tag:"span", content:"Y offset  "},
			//	{content: "	"},
			{kind: "onyx.InputDecorator", components: [
				{kind: "onyx.Input", placeholder: "Enter text here", onchange:"inputy"}
			]},
			
				
			{tag: "br"},
				
			{name: "namez", tag:"span", content:"Blur  "},
			{kind: "onyx.InputDecorator", components: [
				{kind: "onyx.Input", placeholder: "Enter text here", onchange:"inputz"}
			]},
		
				
			{name: "sliders0", kind: "Control", showing: true, components: [
				{name: "redSlider0", kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged", style: "height:10px; background-color: red; enyo-unselectable;"},
				{style: "height: 5px"},
				{name: "greenSlider0", kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged", style: "height:10px;  background-color: green; enyo-unselectable" },
				{style: "height: 5px"},

				{ kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged", style: "height:10px;  background-color: blue; enyo-unselectable" },
			]},
		]},	//xyz
			
			{name: "picker", kind: "Control", style: "border: solid black;", showing: false, components: [
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
	misc: 2,	
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
		this.unit = "px;";
		for (var j=5; j<2000; j+=5) {
			this.$.Input.createComponent({content: j, active: !j});
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
		this.$.panels.setIndex(this.blank);
	},
	showssliders: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.panels.setIndex(this.sliders);
	},
	
	showmisc: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.panels.setIndex(1);
	},
	
	showxy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.panels.setIndex(this.xy);
	},
	
	showxyz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.panels.setIndex(this.xyz);
	},
	
	showpicker: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.panels.setIndex(this.picker);
	},
	
	input_picker: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var unit = this.unit;
		console.log(inEvent.content, unit);
		this.misc_picker = inEvent.content + unit;		
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
		var type = this.unit;
		this.x = inSender.value + type;
		this.total();
	},
	
	inputy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var type = this.unit;
		this.y = inSender.value + type;
		this.total();
	},
	
	inputz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var type = this.unit;
		this.z = inSender.value + type;
		this.total();
	},
	
	unit_type: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.unit = inEvent;
		this.doUnitChange(inEvent);
	},
	
	color: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.c = '#' + (this.red + this.green + this.blue).toUpperCase();
		this.total();
	},
	
	total: function(){
	//	console.log("total");
		var valueout = "";
		if(this.x !== undefined){
			valueout = " " + this.x;
			this.x = undefined;
		}		
		if(this.y !== undefined){
			valueout = valueout + " " + this.y;	
			this.y = undefined;
		}
		if(this.z !== undefined){
			valueout = valueout + " " +this.z;
			this.z = undefined;
		}		
		if(this.c !== undefined ){
			valueout = valueout + " " + this.c + ";";
			this.c = undefined;
		}		
		if(this.misc !== undefined){
			valueout = valueout + " " + this.misc;
			this.misc = undefined;
		}
		if(this.misc_picker !== undefined){
			valueout = valueout + " " + this.misc_picker;
			this.misc_picker = undefined;
		}
	
		this.valueout = valueout;
		//console.log(this.valueout, valueout);
		valueout = "";
		this.doValueUpdate();
		
		
	}
});
