enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{kind: "Analyzer", onIndexReady: "indexReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		{kind: "DragAvatar", components: [
			{tag: "img", src: "images/icon.png"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", Xstyle: "padding: 10px;", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 10px;", components: [
				{kind: "onyx.Button", content: "Close", ontap: "closeDocAction"},
				{name: "documentLabel", content: "Document"},
				{kind: "onyx.Button", content: "Save", ontap: "saveDocAction"},
				{fit: true},
				{kind: "onyx.Button", content: "Designer", ontap: "designerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "left",kind: "leftPanels",showing: false,arrangerKind: "CardArranger",fit: true},
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "changed"}
					]}
				]},
				{name: "right", classes: "panel", showing: false, components: [
					// neccesary nesting here for 'margin: 8px;"
					{kind: "enyo.Scroller", classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "onyx.Button", content: "Reparse", ontap: "reparseAction"},
						{name: "dump", style: "padding: 10px;", allowHtml: true}
					]}
				]}
			]}
		]},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Saving document...", style: "padding-top: 10px;"}
		]},
		{name: "savePopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{name: "message", content: "Document was modified! Save it before closing?", style: "padding: 10px;"},
			{kind: "FittableColumns", components: [
				{kind: "onyx.Button", content: "Cancel", ontap: "cancelCloseAction"},
				{kind: "onyx.Button", content: "Don't Save", ontap: "abandonDocAction"},
			]}
		]}
	],
	handlers: {
	},
	docChanged: false,
	create: function() {
		this.inherited(arguments);
		this.buildDb();
	},
	//
	//
	saveDocAction: function() {
		this.showWaitPopup("Saving document...");
		this.bubble("onSaveDocument", {content: this.$.ace.getValue()});
	},
	saveComplete: function() {
		this.hideWaitPopup();
		this.docChanged=false;
	},
	beginOpenDoc: function() {
		this.showWaitPopup("Opening document...");
	},
	openDoc: function(inCode, inExt) {
		this.hideWaitPopup();
		var mode = {json: "json", js: "javascript", html: "html", css: "css"}[inExt] || "text";
		if (mode == "json"){
			this.$.left.setIndex(0);
			this.$.left.setShowing(false);
			this.$.right.setShowing(false);
		};
		if (mode == "javascript"){
			this.$.left.setIndex(1);
			this.$.left.setShowing(false);
			this.$.right.setShowing(true);
		};
		if ( mode == "html"){
			this.$.left.setIndex(2);
			this.$.left.setShowing(false);
			this.$.right.setShowing(false);
		};
		if( mode == "css"){
			this.$.left.setIndex(3);
			this.$.left.setShowing(true);
			this.$.right.setShowing(false);
		};

		this.$.ace.setEditingMode(mode);
		this.$.ace.setValue(inCode);
		this.reparseAction();
		this.docChanged=false;
	},
	showWaitPopup: function(inMessage) {
		this.$.waitPopupMessage.setContent(inMessage);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	//
	//
	buildDb: function() {
		this.$.analyzer.analyze(["$enyo/source", "$lib/layout", "$lib/onyx"]);
	},
	indexReady: function() {
		this.testDb();
	},
	testDb: function() {
		//var c = this.$.db.findByName("enyo.Control");
		//var c = this.$.db.findByName("onyx.Button");
		var c = this.$.analyzer.index.findByName("enyo.FittableRows");
		this.dumpInfo(c);
	},
	dumpInfo: function(inObject) {
		var c = inObject;
		if (!c || !c.superkinds) {
			this.$.dump.setContent("(no info)");
			return;
		}
		//
		var h$ = "<h3>" + c.name + "</h3>";
		//
		var h = [];
		for (var i=0, p; p=c.superkinds[i]; i++) {
			h.push(p);
		}
		h$ += "<h4>Extends</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		var h = [];
		for (var i=0, p; p=c.components[i]; i++) {
			h.push(p.name);
		}
		if (h.length) {
			h$ += "<h4>Components</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		}
		//
		h = [];
		for (var i=0, p; p=c.properties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		h = [];
		for (var i=0, p; p=c.allProperties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>All Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		this.$.dump.setContent(h$);
	},
	reparseAction: function() {
		var module = {
			name: "Document",
			code: this.$.ace.getValue()
		};
		this.$.analyzer.index.indexModule(module);
		// ad hoc: dump the first object, if it exists
		this.dumpInfo(module.objects && module.objects[0]);
	},
	designerAction: function() {
		// TODO: Crib more of this from Ares2v1
		var c = this.$.ace.getValue();
		var module = {
			name: "Document",
			code: c
		};
		this.$.analyzer.index.indexModule(module);
		var o = module.objects && module.objects[0];
		if (o) { // must have kind definition...
			var comps = o.components;
			if (comps) { // ...and components block
				var start = o.components[0].start;
				var end=c.lastIndexOf("]")+1;
				var js = eval("([\n"+c.substring(start, end)+")");
				this.bubble("onDesignDocument", {content: js});
			}
		}
	},
	closeDocAction: function(inSender, inEvent) {
		if (this.docChanged) {
			this.$.savePopup.show();
		} else {
			this.bubble("onCloseDocument", {});
		}
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		this.bubble("onCloseDocument", {});
	},
	// called when the "Cancel" is selected in save popup
	cancelCloseAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
	},
	changed: function(inSender, inEvent) {
		this.docChanged=true;
	}
});


enyo.kind({
	name: "leftPanels",
	kind: "Panels",

	published: {
	red: '00',
	blue: '00',
	green: '00',
	color: "000000",
	toggle: ""
	},
	wrap: false,
	components: [
		{// left panel jason go here
		},
		{// left panel javascript og here
		},
		{// left panel html go here
		},

		{kind: "enyo.FittableRows",		// left panel css
		classes: "border panel enyo-fit",
		style: "margin: 8px; border: 1px solid #000000; ",
		components: [
			{name:"outputBox",
			style: "font-size: 10px; border: 1px solid #000000; width: 100%; height: 150px;",
			classes: "enyo-selectable",
			allowHtml: true,
			components: [
				{name: "bg", allowHtml: true, style: "font-size: 12px;", content: ""},
				{name: "dud",allowHtml: true, content:"  ",style: "height: 10px"},
			]},

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
				{content:"background", active: true},
				{content:"Font color"},
			]},
			{tag: "br"},
		]},
	],

	create: function() {
		this.inherited(arguments);
		this.updateBox();
	},

	updateBox: function(){
	var tab = "&nbsp;&nbsp;&nbsp;&nbsp;";
	var c = '#' + (this.red + this.green + this.blue).toUpperCase();

		if(this.toggle == "background"){
			this.$.outputBox.applyStyle("background-color", c);
			this.backgroundColor = c;
			if (this.fontColor == null){
				this.$.bg.setContent(".SomeClass {<br>" + tab + "background-color:" + " " +this.backgroundColor + ";<br>}");
			}else{
			this.$.bg.setContent(".SomeClass {<br>" + tab + "background-color:" + " " +this.backgroundColor + ";<br>" + tab + "color:" + " " + this.fontColor + ";<br>}");
			}
		}

		if(this.toggle == "Font color"){
			this.$.outputBox.applyStyle("color", c);
			this.fontColor = c;
			if (this.backgroundColor == null){
				this.$.bg.setContent(".SomeClass {<br>" + tab + "color:" + " " + this.fontColor + ";<br>}");
			}else{
			this.$.bg.setContent(".SomeClass {<br>" + tab + "background-color:" + " " +this.backgroundColor + ";<br>" + tab + "color:" + " " + this.fontColor + ";<br>}");
			}
		}
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
		}
	},
});
