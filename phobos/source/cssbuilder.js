enyo.kind({
	published: {
		red: '00',
		blue: '00',
		green: '00',
		color: "000000",
		toggle: ""
	},
	events: {
		onInsert: ""
	},
	name: "cssBuilder",
	kind: "enyo.FittableRows", components: [
		{kind: "onyx.Toolbar", components: [
			{kind: "onyx.Button", content: "Insert css", ontap:"newCssAction"},
			{kind: "onyx.Button", content: "Reset", ontap:"reset"}
		]},
		{kind: "onyx.Input", name: "input", placeholder: "Enter your class name!..",onchange: "inputChange"},
		{name:"outputBox", kind: "enyo.Panels",	style: "width: 100%; height: 150px; ", classes: "enyo-selectable css_builder_font",	allowHtml: true, Xstyle: "padding: 10px;", components: [
			{name: "bg", allowHtml: true, style: "font-size: 10px;", content: ""},
			{name: "dd", allowHtml: true, content:"  ",style: "height: 10px"}
		]},

		{kind: "Panels", fit:true, classes: "enyo-unselectable",components: [
			{kind: "enyo.Scroller", classes: "enyo-fit",components: [
				{classes: "css_builder_pannel", style: " height: 250px", components: [
					{name: "name", style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;", content:"Color "},

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

					{kind: "onyx.RadioGroup", onActivate:"radioActivated", components:[
						{content:"background", classes: "css_builder_RadioGroup"},
						{content:"Font color", classes: "css_builder_RadioGroup"},
						{content:"Border color", classes: "css_builder_RadioGroup"}
					]}
				]},

				{classes: "css_builder_pannel", style: " height: 350px", components: [
					{name: "fonts", style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;", content:"Fonts "},
					{kind: "onyx.RadioGroup",
					onActivate:"fontActivated",components:[
						{tag: "br"},
						{content:"Serif", style: "font-family: Serif;", classes: "css_builder_RadioGroup"},
						{content:"Sans-serif", style: "font-family: Sans-serif;", classes: "css_builder_RadioGroup"},

						{content:"Helvetica  ", style: "font-family: Helvetica;", classes: "css_builder_RadioGroup"},
						{content:"Monospace", style: "font-family: Monospace;", classes: "css_builder_RadioGroup"},

						{content:" Lucida Sans Unicode ", style: "font-family: Lucida Sans Unicode;", classes: "css_builder_RadioGroup"},
						{content:"Times New Roman  ", style: "font-family: Times New Roman;", classes: "css_builder_RadioGroup"},

						{content:" Courier New ", style: "font-family: Courier New;", classes: "css_builder_RadioGroup"},
						{content:" Arial ", style: "font-family: Arial;", classes: "css_builder_RadioGroup"}
					]},

					{classes: "onyx-toolbar-inline", components: [
						{content: "Font Size", classes: "css_builder_picker"},
						{kind: "onyx.PickerDecorator", components: [
							{style: "min-width: 30px; font-size: 10px;"},
							{name: "fontSizePicker", kind: "onyx.Picker",onSelect: "fontSize"}
						]}
					]},
					{style: "height: 5px"},
					{kind: "onyx.Button", classes: "css_builder_button ", content: "Text Shadow", ontap: "textshadow"}
				]},

				{classes: "css_builder_pannel", style: " height: 200px", components: [
					{name: "imageborder", style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;", content:"Border/Margin..."},

					{kind: "enyo.FittableColumns", components: [
						{classes: "onyx-toolbar-inline", components: [
							{content: "Height", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 60px; font-size: 10px;"},
								{name: "heightSizePicker", kind: "onyx.Picker",onSelect: "heightSize"}
							]}
						]},
						{classes: "onyx-toolbar-inline", components: [
							{content: "Width", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 60px; font-size: 10px;"},
								{name: "widthSizePicker", kind: "onyx.Picker",onSelect: "widthSize"}
							]}
						]}
					]},
					{kind: "enyo.FittableColumns", components: [
						{classes: "onyx-toolbar-inline", components: [
							{content: "Margin Size", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 40px; font-size: 10px;"},
								{name: "marginSizePicker", kind: "onyx.Picker",onSelect: "marginSize"}
							]}
						]},

						{classes: "onyx-toolbar-inline", components: [
							{content: "Border Size", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 40px; font-size: 10px;"},
								{name: "borderSizePicker", kind: "onyx.Picker",onSelect: "borderSize"}
							]}
						]}
					]},

					{kind: "enyo.FittableColumns", components: [
						{classes: "onyx-toolbar-inline", components: [
							{content: "Radius", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 40px; font-size: 10px;"},
								{name: "Radius", kind: "onyx.Picker",onSelect: "radius"}
							]}
						]},

						{classes: "onyx-toolbar-inline", components: [
							{content: "Padding", classes: "css_builder_picker"},
							{kind: "onyx.PickerDecorator", components: [
								{style: "min-width: 40px; font-size: 10px;"},
								{name: "Padding", kind: "onyx.Picker",onSelect: "padding"}
							]}
						]}
					]},
					{kind: "onyx.Button", classes: "css_builder_button ", content: "Box Shadow", ontap: "boxshadow"}
				]},
				
				{classes: "css_builder_pannel", style: " height: 200px", components: [
					{name: "border", style:  "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;", content:"Images..."},

					{style: "height: 5px"},
					{kind: "onyx.Input", name: "imageInput", placeholder: "Enter image url:...", onchange: "imageInput"},
				
					{style: "height: 5px"},
					{kind: "enyo.FittableColumns", components: [
						{kind: "Checkbox",  style: "height: 35px; width: 35px;",onchange: "hrepeat"},
						{content: "Repeat X"}
					]},
					
					{style: "height: 5px"},
					{kind: "enyo.FittableColumns", components: [
						{kind: "Checkbox", style: "height: 35px; width: 35px;", onchange: "vrepeat"},
						{content: "Repeat Y"}
					]},
					
					{style: "height: 5px"},

					{kind: "enyo.FittableColumns", components:[
						{kind: "Checkbox", style: "height: 35px; width: 35px;", onchange: "norepeat"},
						{content: "No Repeat"}
					//	
						
						
					]}
				
				]}
			]}
		]},



		{name: "textShadowPopup", kind: "onyx.Popup", classes: "css_builder_popup", centered: true, modal: true, floating: true, components: [
			{ kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 10px;", components: [
				{name: "shadowBar", content: "Text Shadow"}
			]},

			{classes: "onyx-toolbar-inline", components: [
				{content: "Horizontal shadow", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "TextShadowH", kind: "onyx.Picker",onSelect: "textshadowH"}
				]}
			]},
			{classes: "onyx-toolbar-inline", components: [
				{content: "Vertical shadow--- ", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "TextShadowV", kind: "onyx.Picker",onSelect: "textshadowV"}
				]}
			]},
			{classes: "onyx-toolbar-inline", components: [
				{content: "Blur distance-------", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "TextShadowB", kind: "onyx.Picker",onSelect: "textshadowB"}
				]}
			]},
			{name:"textoutputBox", kind: "enyo.Panels", classes: "css_builder_outputbox2",	allowHtml: true, Xstyle: "padding: 10px;", components: [
				{content: "Text Shadow Color!"}
			]},
			{kind: "enyo.FittableRows", components: [
				{name: "redSlider1", kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged",
					style: "height:10px; background-color: red; enyo-unselectable;"
				},
				{style: "height: 5px"},

				{name: "greenSlider1", kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged",
				style: "height:10px;  background-color: green; enyo-unselectable"
				},
				{style: "height: 5px"},

				{name: "blueSlider1", kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged",
				style: "height:10px;  background-color: blue; enyo-unselectable"
				},
				{style: "height: 5px"},
				{kind: "onyx.Button", content: "Close", ontap: "closePopup"}
			]}
		]},

		{name: "boxShadowPopup", kind: "onyx.Popup", classes: "css_builder_popup", centered: true, modal: true, floating: true, components: [
			{ kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 10px;", components: [
				{name: "boxShadowBar", content: "Box Shadow"}
			]},

			{classes: "onyx-toolbar-inline", components: [
				{content: "Horizontal shadow", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "BoxShadowH", kind: "onyx.Picker",onSelect: "boxshadowH"}
				]}
			]},
			{classes: "onyx-toolbar-inline", components: [
				{content: "Vertical shadow--- ", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "BoxShadowV", kind: "onyx.Picker",onSelect: "boxshadowV"}
				]}
			]},
			{classes: "onyx-toolbar-inline", components: [
				{content: "Blur distance-------", classes: "css_builder_picker"},
				{kind: "onyx.PickerDecorator", components: [
					{style: "min-width: 40px; font-size: 10px;"},
					{name: "BoxShadowB", kind: "onyx.Picker",onSelect: "boxshadowB"}
				]}
			]},
			{name:"outputBox2", kind: "enyo.Panels", classes: "css_builder_outputbox2",	allowHtml: true, Xstyle: "padding: 10px;", components: [
				{content: "Box Shadow Color"}
			]},
			{kind: "enyo.FittableRows", components: [
				{name: "boxredSlider", kind: "onyx.Slider", onChanging: "redSliding", onChange: "redChanged",
				style: "height:10px; background-color: red; enyo-unselectable;"
				},
				{style: "height: 5px"},

				{name: "boxgreenSlider", kind: "onyx.Slider", onChanging: "greenSliding", onChange: "greenChanged",
				style: "height:10px;  background-color: green; enyo-unselectable"
				},
				{style: "height: 5px"},

				{name: "boxblueSlider", kind: "onyx.Slider", onChanging: "blueSliding", onChange: "blueChanged",
				style: "height:10px;  background-color: blue; enyo-unselectable"
				},
				{kind: "onyx.Button", content: "Close", ontap: "closePopup"}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		this.$.outputBox.applyStyle("color", "#FFFFFF");
		this.$.outputBox.applyStyle("background-color", "#000000");

		for (var i=0; i<50; i++) {
			this.$.fontSizePicker.createComponent({content: i, active: !i});
			this.$.borderSizePicker.createComponent({content: i, active: !i});
			this.$.marginSizePicker.createComponent({content: i, active: !i});
			this.$.Radius.createComponent({content: i, active: !i});
			this.$.Padding.createComponent({content: i, active: !i});
			this.$.TextShadowB.createComponent({content: i, active: !i});
			this.$.BoxShadowB.createComponent({content: i, active: !i});
		}

		for (var j=5; j<2000; j+=5) {
			this.$.heightSizePicker.createComponent({content: j, active: !j});
			this.$.widthSizePicker.createComponent({content: j, active: !j});
		}
		for (var k=-25; k<25; k++) {
			this.$.TextShadowH.createComponent({content: k, active: !k});
			this.$.TextShadowV.createComponent({content: k, active: !k});
			this.$.BoxShadowH.createComponent({content: k, active: !k});
			this.$.BoxShadowV.createComponent({content: k, active: !k});
		}

	},

	updateBox: function(){
		var tab = "&nbsp;&nbsp;&nbsp;&nbsp;";
		var outPut = this.className + " " + "{<br>" ;
		var outString =  this.className + " " + "{\n" ;
		var c = '#' + (this.red + this.green + this.blue).toUpperCase();

		if(this.$.toggle == "background"){
			this.$.outputBox.applyStyle("background-color", c);
			this.backgroundColor = c;
		}
		if(this.$.toggle == "Font color"){
			this.$.outputBox.applyStyle("color", c);
			this.fontColor = c;
		}

		if(this.$.toggle == "text-shadow"){
			this.$.textshadowcolor = '#' + (this.red + this.green + this.blue).toUpperCase();
		}

		if(this.$.toggle == "box-shadow"){
			this.$.boxshadowcolor = '#' + (this.red + this.green + this.blue).toUpperCase();
		}



		if(this.$.textshadowcolor != null ){
			outPut = outPut + tab + "text-shadow:" + " " + this.$.textshadowH + "px"  + " " + this.$.textshadowV + "px" +  " " + this.$.textshadowB + "px" + " " + this.$.textshadowcolor  +";<br>";
			outString = outString + "	" + "text-shadow:" + " " + this.$.textshadowH + "px" + " " + this.$.textshadowV + "px" + " " + this.$.textshadowB + "px" + " "  + this.$.textshadowcolor  + ";\n";
			this.$.textoutputBox.applyStyle("background-color", c);
		}

		if(this.$.boxshadowcolor != null ){
			outPut = outPut + tab + "box-shadow:" + " " + this.$.boxshadowH + "px"  + " " + this.$.boxshadowV + "px" +  " " + this.$.boxshadowB + "px" + " " + this.$.boxshadowcolor  +";<br>";
			outString = outString + "	" + "box-shadow:" + " " + this.$.boxshadowH + "px" + " " + this.$.boxshadowV + "px" + " " + this.$.boxshadowB + "px" + " "  + this.$.boxshadowcolor  + ";\n";
			this.$.outputBox2.applyStyle("background-color", c);
		}

		if(this.backgroundColor != null){
			outPut = outPut + tab + "background-color:" + " " + this.backgroundColor + ";" + "<br>";
			outString = outString + "	" + "background-color:" + "	" + this.backgroundColor + ";\n";
		}

		if(this.fontColor != null){
			outPut = outPut + tab + "color:" + " " + this.fontColor + ";"  + "<br>";
			outString = outString + "	" + "color:" + " " + this.fontColor + ";\n";
		}

		if(this.fontFamily != null){
			outPut = outPut +tab + "font-family:" + " " + this.fontFamily + ";" + "<br>";
			outString = outString + "	" + "font-family:" + " " + this.fontFamily + ";\n";
		}

		if(this.$.fontSize != null){
			outPut = outPut + tab + "font-size:" + " " + this.$.fontSize + "px;" + "<br>";
			outString = outString + "	" + "font-size:" + " " + this.$.fontSize + "px;\n";
		}

		if(this.$.marginSize != null){
			outPut = outPut  + tab + "margin:" + " " + this.$.marginSize + "px;" + "<br>";
			outString = outString + "	" + "margin:" + " " + this.$.marginSize + "px;\n";
		}

		if(this.$.borderSize != null){
			outPut = outPut + tab + "border:" + " " + this.$.borderSize + "px";
			outString = outString + "	" + "border:" + " " + this.$.borderSize + "px";

		if(this.toggle == "Border color"){
				outPut = outPut + " " + "sold" + " " + c + ";<br>";
				outString = outString + "	" + "sold" + " " + c + ";\n";
			}else{
			outPut = outPut + ";<br>";
			outString = outString + ";\n";
			}
		}
		if(this.$.heightSize != null){
			outPut = outPut  + tab + "height:" + " " + this.$.heightSize + "px;" + "<br>";
			outString = outString + "	" + "height:" + " " + this.$.heightSize + "px;\n";
		}
		if(this.$.widthSize != null){
			outPut = outPut  + tab + "width:" + " " + this.$.widthSize + "px;" + "<br>";
			outString = outString + "	" + "width:" + " " + this.$.widthSize + "px;\n";
		}

		if(this.$.paddingSize != null){
			outPut = outPut  + tab + "padding:" + " " + this.$.paddingSize + "px;" + "<br>";
			outString = outString + "	" + "padding:" + " " + this.$.paddingSize + "px;\n";
		}

		if(this.$.radiusSize != null){
			outPut = outPut  + tab + "border-radius:" + " " + this.$.radiusSize + "px;" + "<br>";
			outString = outString + "	" + "border-radius:" + " " + this.$.radiusSize + "px;\n";
		}

		if(this.$.bgImage != null){
			outPut = outPut  + tab + "background-image: url('" + this.$.bgImage +"');<br>";
			outString = outString + "	" + "background-image: url('" + this.$.bgImage + "');\n";
		}
		if(this.$.hrepeat != null){
			outPut = outPut  + tab + "background-image: repeat-x;<br>";
			outString = outString + "	" + "background-image: repeat-x;\n";	
		}
		
		if(this.$.vrepeat != null){
			outPut = outPut  + tab + "background-image: repeat-y;<br>";
			outString = outString + "	" + "background-image: repeat-y;\n";	
		}
		
		if(this.$.norepeat != null){
			outPut = outPut  + tab + "background-image: no-repeat;<br>";
			outString = outString + "	" + "background-image: no-repeat;\n";	
		}

		this.$.bg.setContent(outPut + "<br>}");
		outString = outString + "\n}";
		this.outPut = outString;
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
			this.$.toggle = inEvent.originator.getContent();
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
	heightSize: function(inSender, inEvent){
		this.$.heightSize = inEvent.selected.content;
		this.updateBox();
	},
	widthSize: function(inSender, inEvent){
		this.$.widthSize = inEvent.selected.content;
		this.updateBox();
	},
	newCssAction: function(inSender, inEvent) {
		// Insert a new Css at the end of the file
		this.doInsert (inEvent);

	},

	padding: function(inSender, inEvent){
		this.$.paddingSize = inEvent.selected.content;
		this.updateBox();
	},
	radius: function(inSender, inEvent){
		this.$.radiusSize = inEvent.selected.content;
		this.updateBox();
	},

	textshadow: function(inSender, inEvent) {
		this.$.toggle = "text-shadow";
		this.$.textShadowPopup.show();
	},
	textshadowH: function(inSender, inEvent) {
			this.$.textshadowH = inEvent.selected.content;
			this.updateBox();
	},
	textshadowV: function(inSender, inEvent) {
		this.$.textshadowV = inEvent.selected.content;
		this.updateBox();
	},
	textshadowB: function(inSender, inEvent) {
		this.$.textshadowB = inEvent.selected.content;
		this.updateBox();
	},

	closePopup: function() {
		this.updateBox();
		this.$.textShadowPopup.hide();
		this.$.boxShadowPopup.hide();
	},

	boxshadow: function(inSender, inEvent) {
		this.$.toggle = "box-shadow";
		this.$.boxShadowPopup.show();
	},
	boxshadowH: function(inSender, inEvent) {
			this.$.boxshadowH = inEvent.selected.content;
			this.updateBox();
	},
	boxshadowV: function(inSender, inEvent) {
		this.$.boxshadowV = inEvent.selected.content;
		this.updateBox();
	},
	boxshadowB: function(inSender, inEvent) {
		this.$.boxshadowB = inEvent.selected.content;
		this.updateBox();
	},

	imageInput: function(inSender, inEvent) {
		this.$.bgImage = this.$.imageInput.hasNode().value;
		this.updateBox();
		enyo.log(this.$.bgImage, this.$.imageInput.hasNode().value );
	},
	hrepeat: function(inSender) {
		if (inSender.checked === true ){
			this.$.hrepeat = true;
		}else{
			this.$.hrepeat  = null;
		}		
		this.updateBox();
	},
	vrepeat: function(inSender) {
		if (inSender.checked === true ){
			this.$.vrepeat = true;
		}else{
			this.$.vrepeat  = null;
		}		
		this.updateBox();	
	},
	
	norepeat: function(inSender) {
		if (inSender.checked === true ){
			this.$.norepeat = true;
		}else{
			this.$.norepeat  = null;
		}		
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
		this.$.textshadow = null;
		this.$.heightSize = null;
		this.$.widthSize = null;
		this.$.radiusSize =	null;
		this.$.paddingSize = null;
		this.$.boxshadowcolor = null;
		this.$.textshadowcolor = null;
		this.$.hrepeat = null;
		this.$.vrepeat = null;
		this.$.norepeat = null;
		this.$.outPut = null;
		this.updateBox();

	}
});

