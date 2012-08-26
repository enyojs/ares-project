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

		{name:"outputBox",
		kind: "enyo.Panels",
		style: "font-family: fontFamily; font-size: 10px; border: 1px solid #000000; width: 100%; height: 150px;",
		classes: "enyo-selectable",
		allowHtml: true,
		Xstyle: "padding: 10px;",
		components: [
			{name: "bg", allowHtml: true, style: "font-size: 12px; font-Family: fontFamily", content: ""},
			{name: "dud",allowHtml: true, content:"  ",style: "height: 10px"}
		]},



		{kind: "Panels", fit:true,
		components: [
			{kind: "enyo.Scroller", classes: "enyo-fit",
			components: [
				{kind: "onyx.Slider",
			name: "redSlider",
			onChanging: "redSliding",
			onChange: "redChanged",
			style: "height:10px; background-color: red; enyo-unselectable;"
			},

				{style: "height: 5px"},

				{kind: "onyx.Slider",
			name: "greenSlider",onChanging: "greenSliding",
			onChange: "greenChanged",
			style: "height:10px;  background-color: green; enyo-unselectable"
			},

				{style: "height: 5px"},

				{kind: "onyx.Slider",
			name: "blueSlider",onChanging: "blueSliding",
			onChange: "blueChanged",
			style: "height:10px;  background-color: blue; enyo-unselectable"
			},

				{style: "height: 5px"},

				{kind: "onyx.RadioGroup",
			onActivate:"radioActivated",
			components:[
				{content:"background", active: true, style: "width: 135px; height: 40px"},
				{content:"Font color", style: "width: 135px; height: 40px"}
			]},
				{tag: "br"},

				{kind: "onyx.RadioGroup",
			//style:
			//width: "50 px",
			onActivate:"fontActivated",
			components:[
				{content:"Serif", style: "font-family: Serif; width: 140px; height: 40px"},
				{content:"Sans-serif", style: "font-family: Sans-serif; width: 140px; height: 40px"},
				{tag: "br"},
				{tag: "br"},
				{content:"Helvetica  ", style: "font-family: Helvetica; width: 140px; height: 40px"},
				{content:"Monospace", style: "font-family: Monospace; width: 140px; height: 40px"},
				{tag: "br"},
				{tag: "br"},
				{content:" Lucida Sans Unicode ", style: "font-family: Lucida Sans Unicode; width: 140px; height: 50px"},
				{content:"Times New Roman  ", style: "font-family: Times New Roman; width: 140px; height: 50px"},
				{tag: "br"},
				{tag: "br"},
				{content:" Courier New ", style: "font-family: Courier New; width: 140px; height: 40px"},
				{content:" Arial ", style: "font-family: Arial; width: 140px; height: 40px"}

			]},

				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Font Size",},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px;"},
						{name: "fontSizePicker", kind: "onyx.Picker",onSelect: "fontSize"}
					]}
				]},
				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Margin Size",},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px;"},
						{name: "marginSizePicker", kind: "onyx.Picker",onSelect: "marginSize"}
					]}
				]},
				{tag: "br"},
				{classes: "onyx-toolbar-inline", components: [
					{content: "Border Size",},
					{kind: "onyx.PickerDecorator", components: [
						{style: "min-width: 60px;"},
						{name: "borderSizePicker", kind: "onyx.Picker",onSelect: "borderSize"}
					]}
				]},
			]}
		]}
	],


	create: function() {

		this.inherited(arguments);
		this.$.outputBox.applyStyle("color", "#FFFFFF");
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
	//var fontSize = "";
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
		outPut = outPut + tab + "background-color:" + " " + this.backgroundColor + ";";
	}

	if(this.fontColor != null){
		outPut = outPut + "<br>" + tab + "color:" + " " + this.fontColor + ";";
	}

	if(this.fontFamily != null){
		outPut = outPut + "<br>" +tab + "font-family:" + " " + this.fontFamily + ";";
	}

	if(this.$.fontSize != null){
		outPut = outPut + "<br>" +tab + "font-size:" + " " + this.$.fontSize + "px;";
	}

	if(this.$.marginSize != null){
		outPut = outPut + "<br>" +tab + "margin:" + " " + this.$.marginSize + "px;";
	}

	if(this.$.borderSize != null){
		outPut = outPut + "<br>" +tab + "border:" + " " + this.$.borderSize + "px;";
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
	}
});