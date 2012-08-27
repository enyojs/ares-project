enyo.kind({
	published: {
	red: '00',
	blue: '00',
	green: '00',
	color: "000000",
	toggle: ""
	},
	name: "cssBuilder",
	kind: "enyo.FittableRows",
	components: [
		{kind: "onyx.Input", name: "input", placeholder: "Enter your class name!..",onchange: "inputChange"},
		{kind: "onyx.Button", classes: "onyx-negative", content: "Reset", ontap:"reset"},
		{name:"outputBox",
		kind: "enyo.Panels",
		style: "width: 100%; height: 150px; ",
		classes: "enyo-selectable font",
		allowHtml: true,
		Xstyle: "padding: 10px;",
		components: [
			{name: "bg", allowHtml: true, style: "font-size: 15px;", content: ""},
			{name: "dd", allowHtml: true, content:"  ",style: "height: 10px"}
		]},

		{name: "redSlider", kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged",
		style: "height:10px; background-color: red; enyo-unselectable;"
		},

		{style: "height: 5px"},

		{name: "greenSlider", kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged",
		style: "height:10px;  background-color: green; enyo-unselectable"
		},

		{style: "height: 5px"},

		{name: "blueSlider", kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged",
		style: "height:10px;  background-color: blue; enyo-unselectable"
		},
		{kind: "onyx.RadioGroup", onActivate:"radioActivated",
		components:[
			{content:"background", classes: "RadioGroup"},
			{content:"Font color", classes: "RadioGroup"},
			{content:"Border color", classes: "RadioGroup"},
		]},
		{tag: "br"},
		{kind: "Panels", fit:true, classes: "enyo-unselectable",
		components: [
			{kind: "enyo.Scroller", classes: "enyo-fit",
			components: [
				{style: "height: 5px"},

				{kind: "onyx.RadioGroup",
				onActivate:"fontActivated",components:[
					{content:"Serif", style: "font-family: Serif;", classes: "RadioGroup"},
					{content:"Sans-serif", style: "font-family: Sans-serif;", classes: "RadioGroup"},
					{tag: "br"},

					{content:"Helvetica  ", style: "font-family: Helvetica;", classes: "RadioGroup"},
					{content:"Monospace", style: "font-family: Monospace;", classes: "RadioGroup"},
					{tag: "br"},

					{content:" Lucida Sans Unicode ", style: "font-family: Lucida Sans Unicode;", classes: "RadioGroup"},
					{content:"Times New Roman  ", style: "font-family: Times New Roman;", classes: "RadioGroup"},
					{tag: "br"},

					{content:" Courier New ", style: "font-family: Courier New;", classes: "RadioGroup"},
					{content:" Arial ", style: "font-family: Arial;", classes: "RadioGroup"}

				]},

				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Font Size", classes: "picker"},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px; font-size: 10px;"},
						{name: "fontSizePicker", kind: "onyx.Picker",onSelect: "fontSize"}
					]}
				]},
				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Margin Size", classes: "picker"},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px; font-size: 10px;"},
						{name: "marginSizePicker", kind: "onyx.Picker",onSelect: "marginSize"}
					]}
				]},
				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Border Size", classes: "picker"},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px; font-size: 10px;"},
						{name: "borderSizePicker", kind: "onyx.Picker",onSelect: "borderSize"}
					]}
				]},
			]}
		]}
	],


	create: function() {
		this.inherited(arguments);
		this.$.outputBox.applyStyle("color", "#FFFFFF");
		this.$.outputBox.applyStyle("background-color", "#000000");
		for (var i=1; i<50; i++) {
			this.$.fontSizePicker.createComponent({content: i, active: !i});
		}
		for (var i=1; i<50; i++) {
			this.$.marginSizePicker.createComponent({content: i, active: !i});
		}
		for (var i=1; i<50; i++) {
			this.$.borderSizePicker.createComponent({content: i, active: !i});
		}

	},

	updateBox: function(){
	var tab = "&nbsp;&nbsp;&nbsp;&nbsp;";
	var className = ".classname";
	var styleOut = ""
	var outPut = this.className + " " + "{<br>" ;
	var c = '#' + (this.red + this.green + this.blue).toUpperCase();

	if(this.toggle == "background"){
		this.$.outputBox.applyStyle("background-color", c);
		this.backgroundColor = c;
	}
	if(this.toggle == "Font color"){
		this.$.outputBox.applyStyle("color", c);
		this.fontColor = c;
	}

	if(this.backgroundColor != null){
		outPut = outPut + tab + "background-color:" + " " + this.backgroundColor + ";" + "<br>" ;
	}

	if(this.fontColor != null){
		outPut = outPut + tab + "color:" + " " + this.fontColor + ";"  + "<br>";
	}

	if(this.fontFamily != null){
		outPut = outPut +tab + "font-family:" + " " + this.fontFamily + ";" + "<br>" ;
	}

	if(this.$.fontSize != null){
		outPut = outPut + tab + "font-size:" + " " + this.$.fontSize + "px;" + "<br>" ;
	}

	if(this.$.marginSize != null){
		outPut = outPut  + tab + "margin:" + " " + this.$.marginSize + "px;" + "<br>";
	}

	if(this.$.borderSize != null){
		outPut = outPut + tab + "border:" + " " + this.$.borderSize + "px";

		if(this.toggle == "Border color"){
			outPut = outPut + " " + "sold" + " " + c + ";";
		}else{
		outPut = outPut + ";";
		}
	}




	this.$.bg.setContent(outPut + "<br>}");
	},

	redChanged: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.red = h;
		this.updateBox();
	},

	greenChanged: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.green = h;
		this.updateBox();
	},

	blueChanged: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.blue = h;
		this.updateBox();
	},

	redSliding: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.red = h;
		this.updateBox();
	},

	greenSliding: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.green = h;
		this.updateBox();
	},

	blueSliding: function(inSender, inEvent){
		var x = Math.floor(inEvent.value*255/100);
		var h = x.toString(16);
		if (h.length==1){
			h = '0' + h;
		}
		this.blue = h;
		this.updateBox();
	},

	radioActivated: function(inSender, inEvent) {
		if (inEvent.originator.getActive()) {
			this.color = "#000000";
			this.toggle = inEvent.originator.getContent();
			this.updateBox();
		}
	},

	fontActivated: function(inSender, inEvent) {
		if (inEvent.originator.getActive()) {
			this.fontFamily = inEvent.originator.getContent();
			this.updateBox();
		}
	},
	inputChange: function(inSender, inEvent){
		this.className = this.$.input.hasNode().value;
		this.updateBox();
	},
	fontSize: function(inSender, inEvent) {
		this.$.fontSize = inEvent.selected.content;
		this.updateBox();
	},
	marginSize: function(inSender, inEvent){
		this.$.marginSize = inEvent.selected.content;
		this.updateBox();
	},
	borderSize: function(inSender, inEvent){
		this.$.borderSize = inEvent.selected.content;
		this.updateBox();
	},
	reset: function(){
		this.className = null;
		this.backgroundColor = null;
		this.fontColor  = null;
		this.$.borderSize = null;
		this.fontFamily = null;
		this.$.marginSize = null;
		this.$.fontSize = null;
		this.$.outPut = null;
		this.updateBox();

	}
});