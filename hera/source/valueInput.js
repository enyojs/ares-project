/* global ares, Ares*/
enyo.kind({
	name: "Ares.Hera.ValueInput",
	kind: "Control",
	published: {
	},
	events: {
		onValueUpdate: "",
		onUnitChange: "",
		onRegisterMe: "",
		onUrlout: "",
	},
	handlers: {
		onTotalx: "inputx",
		onTotaly: "inputy",
		onTotalz: "inputz",
	},
	
	components: [
		{kind: "Panels", arrangerKind: "CardArranger",  style: "border: solid black thin;", classes: "enyo-fit", components: [
			{name: "blank", kind: "Control", showing: true},
		
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
				{kind: "FittableColumns", fit: true, classes:"left-input-col",  components: [
					{kind: "Ares.Hera.Xinput"},
					{kind: "Ares.Hera.Yinput"},
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
				]}
			]}, // xy
			
			{name: "xyz", kind: "Control", showing: false, classes:"left-input-box", components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "X Y Z & Color Inputs " },
				{style: "height: 5px"},
				{tag: "br"},
				
				{kind: "FittableColumns", fit: true, classes:"left-input-col",  components: [
					{tag:"span"	, content:"  "},
					{kind: "Ares.Hera.Xinput"},
					{kind: "Ares.Hera.Yinput"},
					{kind: "Ares.Hera.Zinput"},
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
			
			{name: "pickinput", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "Picker Inputs" },
				{style: "height: 5px", tag: "br"},
				{kind: "FittableColumns", fit: true, components: [			
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 80px; font-size: 10px;"},
						{name: "pinput", kind: "onyx.Picker", onSelect: "input_picker"},
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
			
			{kind: "Ares.Hera.Lrc"},
			
			{name: "filepicker", kind: "Control", showing: false, components: [
				{style: "height: 5px"},
				{style: "height: 15px;  text-align: center; ", content: "File Picker Input" },
			]},
			
			{kind: "Ares.Hera.Bc"},
			
			{kind: "Ares.Hera.Bgr"},
			
			{kind: "Ares.Hera.BorderWidth"}
		]},
		{name: "selectFilePopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, folderChooser: false, allowToolbar: false, onFileChosen: "fileChosen"}
	],
	
	blank: 0,
	sliders: 1,
	inputbox: 2,	
	xy: 3,
	xyz: 4,
	picker: 5,	
	lrc: 6,
	filepicker: 7,
	bc: 8,
	br: 9,
	borderwidth: 10,
	
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
		this.doRegisterMe({name: "valueInput", reference:this});
		this.red = "00";
		this.blue = "00";
		this.green = "00";
		this.misc = "";
		this.unit = "px";
		var step = 1;
		for (var j = 0; j < 2000; j+= step) {
			if(j <= 9){
				this.$.pinput.createComponent({content: j, active: !j});
			}
			if(j >= 10 && j <= 40){
				step = 2;
				this.$.pinput.createComponent({content: j, active: !j});
			}
			if(j > 40){
				step = 10;
				this.$.pinput.createComponent({content: j, active: !j});
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
	
	fileChosen: function(inSender, inEvent){
		this.event = inEvent;	
		this.doUrlout(this.event);
	},
	
	input_picker: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
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
		this.x = inEvent;
		this.total();
	},
	
	inputy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.y = inEvent;
		this.total();
	},
	
	inputz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.z = inEvent;
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
	},
	
	inputtype: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var project = Ares.Workspace.projects.getActiveProject();
		this.clear();
		
		if(inSender === "picker"){
			this.$.panels.setIndex(this.picker);
		}
		
		if(inSender === "color"){
			this.$.panels.setIndex(this.sliders);
		}
		
		if(inSender === "misc"){
			this.$.panels.setIndex(this.inputbox);
		}

		if(inSender === "xy"){
			this.$.panels.setIndex(this.xy);
		}

		if(inSender === "xyz"){
			this.$.panels.setIndex(this.xyz);
		}
		
		if(inSender === "lrc"){
			this.$.panels.setIndex(this.lrc);
		}
		
		if(inSender === "bgc"){
			this.$.panels.setIndex(this.bc);
		}
		
		if(inSender === "bgr"){
			this.$.panels.setIndex(this.br);
		}
		
		if( inSender === "borderwidth"){
			this.$.panels.setIndex(this.borderwidth);
		}
		
		if(inSender === "filepicker"){
			this.$.selectFilePopup.connectProject(project, (function() {
				this.$.selectFilePopup.setHeaderText("Select image");
				this.$.selectFilePopup.show();
			}).bind(this));
			this.$.panels.setIndex(this.filepicker);
			this.$.selectFilePopup.reset();	
		}
	},
});

enyo.kind({
	name: "Ares.Hera.Xinput",
	kind: "Control",
	published: {
	},
	events: {
		onTotalx: ""
	},
	components: [
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [						
			{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
			{name: "inputx", kind: "onyx.Picker", classes:"left-input-dec", content: "0", onSelect: "inputx"},
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
		var step = 1;
		for (var j = 0; j < 11; j+= step) {
			this.$.inputx.createComponent({content: j, active: !j});
		}
	},
	inputx: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var x = inEvent.content;
		x = x.toString();
		this.doTotalx(x);
	},
});

enyo.kind({
	name: "Ares.Hera.Yinput",
	kind: "Control",
	published: {
	},
	events: {
		onTotaly: ""
	},
	components: [
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [						
			{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
			{name: "inputy", kind: "onyx.Picker", classes:"left-input-dec", content: "0", onSelect: "inputy"},
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
		var step = 1;
		for (var j = 0; j < 11; j+= step) {
			this.$.inputy.createComponent({content: j, active: !j});
		}
	},
	inputy: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var y = inEvent.content;
		y = y.toString();
		this.doTotaly(y);
	},
});

enyo.kind({
	name: "Ares.Hera.Zinput",
	kind: "Control",
	published: {
	},
	events: {
		onTotalz: ""
	},
	components: [
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [						
			{style: "min-width: 40px; font-size: 10px; padding-right: 4px;"},
			{name: "inputz", kind: "onyx.Picker", classes:"left-input-dec", content: "0", onSelect: "inputz"},
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
		var step = 1;
		for (var j = 0; j < 11; j+= step) {
			this.$.inputz.createComponent({content: j, active: !j});
		}
	},
	inputz: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var z = inEvent.content;
		z = z.toString();
		this.doTotalz(z);
	},
});

enyo.kind({
	name: "Ares.Hera.Lrc",
	kind: "Control",
	published: {
	},
	events: {
		onValueUpdate: "",
	},
	components: [
		{style: "height: 15px;  text-align: center; ", content: "Left Right Center ..... " },
		{style: "height: 15px"},
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
			{kind: "onyx.PickerButton", content: "Pick One...", style: "width: 200px"},
			{kind: "onyx.Picker", onSelect: "itemSelected", components: [
				{content: "left"},
				{content: "right"},
				{content: "justify"},
				{content: "start"},
				{content: "end"},
				{content: "match-parent"},
				{content: "start end"},
				{content: "'.'"},
				{content: "start '.'"},
				{content: "'.' start"},
				{content: "inherit"},
			]}
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
	},
	itemSelected: function(inSender, inEvent){
		this.valueout = "	" + inEvent.content + ";";
		this.doValueUpdate();
	}
});

enyo.kind({
	name: "Ares.Hera.Bc",
	kind: "Control",
	published: {
	},
	events: {
		onValueUpdate: "",
	},
	components: [
		{style: "height: 15px;  text-align: center; ", content: "background-clip ..... " },
		{style: "height: 15px"},
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
			{kind: "onyx.PickerButton", content: "Pick One...", style: "width: 200px"},
			{kind: "onyx.Picker", onSelect: "itemSelected", components: [
				{content: "border-box"},
				{content: "padding-box"},
				{content: "content-box"},
				{content: "inherit"}
			]}
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
	},
	itemSelected: function(inSender, inEvent){
		this.valueout = "	" + inEvent.content + ";";
		this.doValueUpdate();
	}
});

enyo.kind({
	name: "Ares.Hera.Bgr",
	kind: "Control",
	published: {
	},
	events: {
		onValueUpdate: "",
	},
	components: [
		{style: "height: 15px;  text-align: center; ", content: "background-repeat ..... " },
		{style: "height: 15px"},
		{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
			{kind: "onyx.PickerButton", content: "Pick One...", style: "width: 200px"},
			{kind: "onyx.Picker", onSelect: "itemSelected", components: [
				{content: "repeat-x"},
				{content: "repeat-y"},
				{content: "repeat"},
				{content: "space"},
				{content: "round"},
				{content: "no-repeat"},
				
			]}
		]},
	],
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
	},
	itemSelected: function(inSender, inEvent){
		this.valueout = "	" + inEvent.content + ";";
		this.doValueUpdate();
	}
});

enyo.kind({
	name: "Ares.Hera.BorderWidth",
	kind: "Control",
	published: {
	},
	
	events: {
		onValueUpdate: "",
	},
	
	components: [
		{style: "text-align: center; ", content: "Border-width ..... \n" },
		{style: "height: 15px"},
		{style: "height: 15px;  text-align: center; ", content: "border-width: width                  /* One-value syntax */" },
		{style: "text-align: center; ", content: "border-width: horizontal vertical    /* Two-value syntax */" },
		{style: "text-align: center; ", content: "border-width: top vertical bottom    /* Three-value syntax */" },
		{style: "text-align: center; ", content: "border-width: top right bottom left  /* Four-value syntax */" },
		{style: "height: 15px"},
		{kind: "enyo.FittableColumns", style: "width: 15%; height: 100%;", components:[
			{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
				{kind: "onyx.PickerButton", content: "Pick One...", classes: "border_width_input"},
				{kind: "onyx.Picker", onSelect: "one_value", components: [
					{content: "thin"},
					{content: "medium"},
					{content: "thick"}
				]},
			]},
			{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
				{name: "bwPicker2", showing: false,kind: "onyx.PickerButton", content: "Pick One...", classes: "border_width_input"},
				{kind: "onyx.Picker", onSelect: "two_value", components: [
					{content: "thin"},
					{content: "medium"},
					{content: "thick"}
				]},
			]},
			{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
				{name: "bwPicker3", showing: false,kind: "onyx.PickerButton", content: "Pick One...", classes: "border_width_input"},
				{kind: "onyx.Picker", onSelect: "three_value", components: [
					{content: "thin"},
					{content: "medium"},
					{content: "thick"}
				]},
			]},
			{kind: "onyx.PickerDecorator", classes:"left-input-dec", components: [
				{name: "bwPicker4", showing: false, kind: "onyx.PickerButton", content: "Pick One...", },
				{kind: "onyx.Picker", onSelect: "four_value", components: [
					{content: "thin"},
					{content: "medium"},
					{content: "thick"}
				]},
			]}
		]},
	],
	
	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		// initialization code goes here
	},
	
	one_value: function(inSender, inEvent){
		this.bw1 = inEvent.content;
		this.valueout = "	" + this.bw1 + ";";
		this.$.bwPicker2.setShowing(true);
		this.doValueUpdate();
	},
	
	two_value: function(inSender, inEvent){
		this.bw2 = inEvent.content;
		this.valueout = "	" + this.bw1 + " " + " " + this.bw2 + ";";
		this.$.bwPicker3.setShowing(true);
		this.doValueUpdate();
	},
	
	three_value: function(inSender, inEvent){
		this.bw3 = inEvent.content;
		this.valueout = "	" + this.bw1 + " " + this.bw2 + " " + this.bw3 + ";";
		this.$.bwPicker4.setShowing(true);
		this.doValueUpdate();
	},
	
	four_value: function(inSender, inEvent){
		this.bw4 = inEvent.content;
		this.valueout = "	" + this.bw1 + " " + this.bw2 + " " + this.bw3 + " " + this.bw4 + ";";
		this.doValueUpdate();
	}
});