// Copyright 2013, $ORGANIZATION
// All rights reserved.

/* global ares */

enyo.kind({
	name: "Hera",
	kind: "Control",
	published: {
		red: '00',
		blue: '00',
		green: '00',
		color: "000000",
		x: "0",
		y: "0",
		z: "0",
		misc: "",
		toggle: ""
	},
	events: {
		onRegisterMe: "",
		onNewcss: "",			// insert at end of file
		onReplacecss: "",		// replace it in ace
		
	},	
	handlers: {
		onPickdeclaration: "radioActivated",
		onValueUpdate: "change",
		onUnitChange: "unitchange",
		//onCloseCss: "save"
	},
	components: [
		{kind: "enyo.FittableColumns", style: "width: 33%; height: 100%;", components:[
			
			{name: "cssleft", style: "width: 100%; height: 90%; ", classes:"ares_deimos_left", kind: "leftpannel"},
			
			{name: "center", kind: "enyo.FittableRows", style: "width: 100%; height: 100%; ", components: [
				{name:"sampleBox", kind: "enyo.Panels",	style: "width: 100%; height: 60%; ", fit: "true", classes: "css_builder_font", allowHtml: true, Xstyle: "padding: 10px;", components: [
				
			//	{ name: "Sample", kind: "onyx.Button", style: "float: center;",	content: "Sample Button"},
					{name: "Sample", allowHtml: true, style: "height: 60%; font-size: 10px;", content: "Sample Box"},
				]},					
				
				{name:"outputBox", kind: "enyo.Panels",	style: "width: 100%; height: 40%; ", classes: "css_builder_font", allowHtml: true, Xstyle: "padding: 10px;", components: [
					{name: "bg", allowHtml: true, style: "font-size: 13px;", content: ""},
				]},	
			]},// center
			
			{kind: "FittableRows", fit: true, style: "width: 100%; height: 100%;", components: [
				{kind: "Panels",  style: "width: 100%; height: 60%;", classes: "enyo-unselectable", components: [
					{name: "list", kind: "List", count: 100, multiSelect: false, classes: "enyo-fit list-sample-list", onSetupItem: "setupItem", components: [
						{name: "item", classes: "list-sample-item enyo-border-box", ontap: "classGrabber", components: [
							{name: "name2"}
						]},				
					]},
				]},
				{kind: "Panels", style: "width: 100%; height: 40%;", classes: "enyo-unselectable", components: [
					{name: "valueinput", kind: "valueInput", onUpdate: "change"},
					
				]},
			]},	// right
		]}, 
	
		{kind: "onyx.Popup", modal: true, floating: true, centered: true, classes: "css_builder_popup", canGenerate: false, name: "newCssPopup", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", name: "toolbar4", components: [
					{kind: "Control", content: "Enter you new class name", name: "newCssName"}
				]},
			{kind: "onyx.Input", placeholder: "Enter your class name!..", name: "input"},
			{kind: "onyx.Button", classes: "ok", content: "Ok", ontap:"newDeclaration"}
		]}
	],
	
	declaration: [],
	pro: [],			
	value: [],
	
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.doRegisterMe({name:"hera", reference:this});
		this.$.outputBox.applyStyle("color", "#FFFFFF");
		this.$.outputBox.applyStyle("background-color", "#000000");
		this.trace("Just created a new", this.name, "object", this);
		this.unit = "px";
	},	
	
	cssload: function(data){
		this.trace("data", data);
		var d = data.originator.$.ace.value;
		this.dePuzzle(d);
	},
	
	csssave: function(inSender, inEvent){
		this.log("sender:", inSender, ", event:", inEvent);
		if(this.mode === "reset"){
			return;
		}
		if(this.mode === "new"){
			console.log(this);
			this.doNewcss();
			this.reset();
		}
		
		if(this.mode === "editing"){
			this.doReplacecss();
			this.reset();
		}
	
	//	this.doCloseCss(event);		
		return true;
	},
	
	change: function(inSender, inEvent){
	//	console.log(inSender,inEvent);
		this.trace("sender:", inSender, ", event:", inEvent);
		var a = 0;
		this.newvalue = inEvent.originator.valueout;
		
		while(this.pro[a] !== undefined && this.pro[a] !== "null"){
			if(this.pro[a].indexOf(this.$.property) !== -1 ){
				break;	
			}
			a++;
		}
		this.pro[a] = "\t" + this.$.property;
		this.value[a] = this.newvalue;
		this.updateBox();
	},

	updateBox: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var a = 0;
		var s = "";
		var tab = "&nbsp;&nbsp;&nbsp;&nbsp;";
		var outPut = this.className + " " + "{<br>" ;
		var outString =  this.className + " " + "{\n" ;
	
		while(this.pro[a] !== undefined && this.pro[a] !== "null"){
		//	console.log(this.pro[a], ":", this.value[a],a);
			if(this.pro[a] === "font-family"){
				this.pro[a] =  "\t" + this.pro[a];
			}
			outPut = outPut + tab + this.pro[a] + ":" + this.value[a] + "<br>";
			outString = outString + this.pro[a] + ":" + this.value[a] + "\n";
			this.$.Sample.applyStyle(this.pro[a], this.value[a]);
			a++;
		}		
			this.$.bg.setContent(outPut + "}");											// write in to the preview box
			outString = outString + "}\n";
			this.out = outString;			
	},

	radioActivated: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var a = 0;
		this.$.property = inEvent.name;
	
		if(inEvent.input === 'color'){
			this.$.valueinput.showssliders();
		}
			
		if (inEvent.input === "misc"){
			this.$.valueinput.showmisc();
		}
			
		if (inEvent.input === "font"){
			this.$.valueinput.showsblank();
			this.$.property = "font-family";
			
			while(this.pro[a] !== undefined && this.pro[a] !== "null"){
				if(this.pro[a].indexOf(this.$.property) !== -1 ){
					break;	
				}
				a++;
			}
			this.pro[a] = this.$.property;
			this.value[a] = " " + inEvent.name +  ";";
			this.updateBox();		
		
		
		//	this.change();
		}
		
		if (inEvent.input === "xy"){
			this.$.valueinput.showxy();
		}
		
		if (inEvent.input === "xyz"){
			this.$.valueinput.showxyz();
		}
		
		if (inEvent.input === "picker"){
			this.$.valueinput.showpicker();
		}
		
	
//		this.mode = "editing"
		this.updateBox();
	
	},

	newDeclaration: function(inSender, inEvent){		// used to start a new CSS declarations
		this.trace("sender:", inSender, ", event:", inEvent);
		if(this.$.property !== undefined ){	// save the old frist
		//	this.mode = "old"; 
		//	this.save();
			console.log(this.$.property," save old frist");
		}
		
		this.className = this.$.input.hasNode().value;
		this.$.newCssPopup.hide();
		
		this.mode ="new";
		this.updateBox();
		return;
	},

	unitchange: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.unit = inEvent.content;
		//this.change();
	},
	
	reset: function(){
		this.trace();
		this.className = null;
	
		this.$.bgImage = null;
		this.$.hrepeat  = null;
		this.$.vrepeat  = null;
		this.$.norepeat  = null;
		

		this.x = null;
		this.y = null;
		this.z = null;	
		this.outPut = null;
		this.$.outPut = null;
		outString = "";
		
		this.$.property = null;
		this.old = null;
		this.mode = "rest";
		this.$.outputBox.applyStyle("color", "#FFFFFF");
		this.$.outputBox.applyStyle("background-color", "#000000");
		this.$.bg.setContent("");	
		this.updateBox();

	},

	dePuzzle: function(inSender,inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var j = 0;
		this.file = inSender;
		var line = inSender.split("\n");
		for (var i=0; i < line.length; i++) {
			if ("." === line[i].charAt(0) || "#" === line[i].charAt(0) ){
				n = line[i].split("{");				
				this.declaration[j] = n[0];
	
				j++;
				k = 0;
				n = "";
			}
		}
	this.$.list.setCount(j);
	this.addNewItem();
	this.$.list.reset();
	},

	classGrabber: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var a = 0;
		var s = "";
		var c = inEvent.index;
		var notme = "notfound";
		this.$.skiped = "";
		this.reset();
		n = (this.file.split("\n"));			// split the file up by lines

		if ( this.declaration[c] === "New"){		// check to see if were making a new declartion	
			this.mode = "new";
			this.$.newCssPopup.show();
			this.updateBox();
			//return;
		}else{
			this.mode = "editing";
			for (var i=0; i < n.length; i++) {
				r = n[i].split("{");
				if(this.declaration[c] === r[0]){
					this.className = this.declaration[c];
					for(var j = i+1;  j < n.length; j++){
					
						s = n[j].split(":");
						if(s[0].indexOf("}") === 0){
							break;
						}
						this.pro[a] = s[0];
						this.value[a] = s[1];						
						a++;
					
					
					//	console.log("notfound", notme);
						if (notme == "notfound"){
							this.$.skiped = this.$.skiped + n[j] + "\n";
							notme = "notfound";
						}
					}
					this.delcss(this.className);
					this.updateBox();
				}
			}
		}
	},

	/*
	*  hang on to the old info so we know what too replace
	*/	
	delcss: function (inSender,inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		var n = "";
		var j = 0;
		var old = "";
		
		n = (this.file.split("\n"));
		for( j = 0;  j < n.length; j++){
			if(n[j].indexOf(inSender) == 0 ){
				old = old + n[j] + "\n";
				for (var i = j + 1; i < n.length; i++) {
					old = old + n[i] + "\n";
					if(n[i].indexOf("}")=== 0 ){
						this.old = old;
						return;
					}
				}
			}
		}
		
		return;
	},
	
	/*
	undo: function(){
		this.trace("sender:", inSender, ", event:", inEvent);
			
		this.className = this.bufferclassName;
		this.background_color = this.bufferbackgroundColor;
		this.$.fontColor  = this.$.bufferfontColor;
		this.$.borderSize = this.$.bufferborderSize;
		this.$.fontFamily = this.$.bufferfontFamily;
		this.$.marginSize = this.$.buffermarginSize;
		this.$.fontSize = this.$.bufferfontSize;

		this.$.textshadow = this.$.buffertextshadow;
		this.$.textshadowV = this.$.buffertextshadowV;
		this.$.textshadowH = this.$.buffertextshadowH;
		this.$.textshadowcolor = this.$.buffertextshadowcolor;

		this.$.heightSize = this.$.bufferheightSize;
		this.$.widthSize = this.$.bufferwidthSize;
		this.$.radiusSize =	this.$.bufferradiusSize;
		this.$.paddingSize = this.$.bufferpaddingSize;

		this.$.boxshadowV = this.$.bufferboxshadowV;
		this.$.boxshadowB = this.$.bufferboxshadowB;
		this.$.boxshadowcolor = this.$.bufferboxshadowcolor;

		this.$.bgImage = this.$.bufferbgImage;
		this.$.hrepeat  = this.$.bufferhrepeat;
		this.$.vrepeat  = this.$.buffervrepeat;
		this.$.norepeat  = this.$.buffernorepeat;
		
		this.$.property = null;
		this.property = null;
		this.mode = null;
		this.outPut = this.buffer;
		this.$.bg.setContent(this.previewbuffer + "}");
		if(this.mode === "grabed"){		// insert at cursor
			//this.doInsertInplace();
			this.mode = "editing";
		}
	},
	*/
	
	
	/*
	* display the list for right CSS declarations
	*/
	setupItem: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
	//	console.log(inSender, inEvent);
		var i = inEvent.index;
		var n = this.declaration[i];
		this.$.item.addRemoveClass("list-sample-selected", inSender.isSelected(i));
		this.$.name2.setContent(n);
		return true;
	},
	
	/*
	* build the list for right CSS declarations
	*/
	addNewItem: function( inSender, inEvent ) {
		this.trace("sender:", inSender, ", event:", inEvent);
        var index = this.$.list.getCount();
        this.$.list.setCount( index+1 );
        this.declaration[index] = "New";
        this.$.list.reset();
    },


});
