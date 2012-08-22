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
				{name: "left", classes: "panel", showing: false, components: [
				]},
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "docChanged", onSave: "saveDocAction", onCursorChange: "cursorChanged"}
					]}
				]},
				{name: "right", classes: "panel", components: [
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
		]},
		{name: "autocomplete", kind: "Phobos.AutoComplete"}
	],
	handlers: {
	},
	docHasChanged: false,
	debug: false,
	// Container of the code to analyze and of the analysis result
	analysis: {},
	create: function() {
		this.inherited(arguments);
		this.buildDb();
		
		// Pass to the autocomplete compononent a reference to ace
		this.$.autocomplete.setAce(this.$.ace);
	},
	//
	//
	saveDocAction: function() {
		this.showWaitPopup("Saving document...");
		this.bubble("onSaveDocument", {content: this.$.ace.getValue()});
	},
	saveComplete: function() {
		this.hideWaitPopup();
		this.docHasChanged=false;
		this.reparseAction();
	},
	beginOpenDoc: function() {
		this.showWaitPopup("Opening document...");
	},
	openDoc: function(inCode, inExt) {
		this.hideWaitPopup();
		var mode = {json: "json", js: "javascript", html: "html", css: "css"}[inExt] || "text";
		this.$.ace.setEditingMode(mode);
		this.$.ace.setValue(inCode);
		this.reparseAction();
		this.docHasChanged=false;
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
		var tempo = {
			name: "Document",
			code: this.$.ace.getValue()
		};
		this.analysis = tempo;
		this.$.analyzer.index.indexModule(tempo);
		// ad hoc: dump the first object, if it exists
		this.dumpInfo(tempo.objects && tempo.objects[0]);
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
		if (this.docHasChanged) {
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
	docChanged: function(inSender, inEvent) {
		this.docHasChanged=true;
		
		if (this.debug) enyo.log("phobos.docChanged: " + JSON.stringify(inEvent.data));
		
		// Call the autocomplete component
		this.$.autocomplete.start(inEvent, this.analysis);
		
		return true; // Stop the propagation of the event
	},
	cursorChanged: function(inSender, inEvent) {
		if (this.debug) enyo.log("phobos.cursorChanged: " + inSender.id + " " + inEvent.type + " " + JSON.stringify(this.$.ace.getCursorPositionInDocument()));
		return true; // Stop the propagation of the event
	}
});

enyo.kind({
	name : "Phobos.AutoComplete",
	kind : "onyx.Popup",
	centered : false,
	floating : true,
	autoDismiss : false,
	modal : true,
	style : "position: absolute; z-index: 100; width: 140px; height: 0px; padding: 0px; border: 0px",
	published: {
		ace: null
	},
	handlers: {
		onkeyup: "keyUp",
		onkeypress : "keyPress",
		onkeydown : "keyDown"
	},
	components : [ {
		kind : "Select",
		name : "autocompleteSelect",
		attributes : {
			size : 1
		},
		onchange : "autocompleteChanged",
		style : "z-index: 100; width: 140px; display: block; background-color: white; background-position: initial initial; background-repeat: initial initial; ",
		components : [
		    // options elements will be populated programmatically
		]
	} ],
	// Constants
	AUTOCOMP_THIS_DOLLAR: 'this.$.',
	AUTOCOMP_THIS_DOLLAR_LEN: -1,	// Initialized in create function
	ESCAPE_CODE: 27,
	BACKSPACE_CODE: 8,
	debug: false,
	input: "",
	create: function() {
		this.AUTOCOMP_THIS_DOLLAR_LEN = this.AUTOCOMP_THIS_DOLLAR.length;
		this.inherited(arguments);
	},
	start: function(inEvent, inAnalysis) {
		
		/*
		 * Check to see if we need to show-up the auto-complete popup
		 * 
		 * NOTE: currently only done on "this.$."
		 * 
		 * When a '.' is entered, we check is it's the last character
		 * of a "this.$." string.
		 * If yes, we show a popup listing the components available
		 * in the "this.$" map.
		 */
		var data = inEvent.data;
		if (data && data.action === 'insertText') {
			var last = data.text.substr(data.text.length - 1);
			if (last === ".") { // Check that last entered char is a '."
				var line = this.ace.getLine(data.range.end.row);
				var end = data.range.end.column;
				last = line.substr(end - this.AUTOCOMP_THIS_DOLLAR_LEN, this.AUTOCOMP_THIS_DOLLAR_LEN);
				
				if (last == this.AUTOCOMP_THIS_DOLLAR) { // Check if it's part of a 'this.$." string
					this.input = "";
					this.components = inAnalysis.objects[0].components;
					this.position = data.range.end;
					this.showAutocompletePopup();
				}
			}
		}
	},
	showAutocompletePopup: function() {
		var select = this.$.autocompleteSelect;
		// Fill-up the auto-completion list
		select.destroyComponents();
		var input = this.input;
		enyo.forEach(this.components, function(a) {
			if (input.length === 0) {
				select.createComponent({content: a.name});
			} else {
				if (a.name.indexOf(input) === 0) {
					select.createComponent({content: a.name});
				}
			}
		});
		select.nbEntries = select.controls.length;
		var size = Math.max(2, Math.min(select.nbEntries, 10));
		if (this.debug) enyo.log("Nb entries: " + select.nbEntries + " Shown: " + size);
		select.setAttribute("size", size);
		select.setSelected(0);
		select.render();
		
		// Compute the position of the popup
		var ace = this.ace;
		var pos = ace.editor.renderer.textToScreenCoordinates(this.position.row, this.position.column);			
		pos.pageY += ace.getLineHeight(); // Add the font height to be below the line

		// Position the autocomplete popup
		this.applyStyle("top", pos.pageY + "px");
		this.applyStyle("left", pos.pageX + "px");
		this.show();
	},
	hideAutocompletePopup: function() {
		this.hide();
		this.ace.focus();
		return true; // Stop the propagation of the event
	},
	autocompleteChanged: function() {
		// Insert the selected value
		this.hide();
		var ace = this.ace;
		var selected = this.$.autocompleteSelect.getValue();
		selected = selected.substr(this.input.length);
		var pos = enyo.clone(this.position);
		pos.column += this.input.length;
		if (this.debug) enyo.log("Inserting >>" + selected + "<< at " + JSON.stringify(pos));
		this.ace.insertAt(pos, selected);
		ace.focus();
		return true; // Stop the propagation of the event
	},
	keyPress: function(inSender, inEvent) {
		var key = inEvent.keyIdentifier;
		if (key !== 'Enter') {
			var pos = enyo.clone(this.position);
			pos.column += this.input.length;
			var character = String.fromCharCode(inEvent.keyCode);
			this.input += character;
			if (this.debug) enyo.log("Got a keypress ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier + " ==> input: >>" + this.input + "<<");
			if (this.debug) enyo.log("Inserting >>" + character + "<< at " + JSON.stringify(pos));
			this.ace.insertAt(pos, character);
			this.showAutocompletePopup();
		} // else - Don't care
		return true; // Stop the propagation of the event
	},
	keyDown: function(inSender, inEvent) {
		if (this.debug) enyo.log("Got a keydown ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier);
		
		var key = inEvent.keyIdentifier;
		if (key === "Up") {
			var select = this.$.autocompleteSelect;
			var selected = select.getSelected() - 1;
			if (selected < 0) { selected = select.nbEntries - 1;}
			select.setSelected(selected);
		} else if (key === "Down") {
			var select = this.$.autocompleteSelect;
			var selected = (select.getSelected() + 1) % select.nbEntries;
			select.setSelected(selected);
		} // else - Don't care
		return true; // Stop the propagation of the event
	},
	keyUp: function(inSender, inEvent) {
		if (this.debug) enyo.log("Got a keyup ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier);
		
		var key = inEvent.keyIdentifier;
		if (key === "Enter") {
			this.autocompleteChanged();
			this.hideAutocompletePopup();
		} else {
			key = inEvent.keyCode;
			if (key === this.ESCAPE_CODE) {
				this.hideAutocompletePopup();
			} else if (key === this.BACKSPACE_CODE) {
				var str = this.input;
				if (str.length > 0) {
					this.input = str.substr(0, str.length -1);
					if (this.debug) enyo.log("Got a backspace ==> input: >>" + this.input + "<<");
					this.showAutocompletePopup();
					this.ace.undo();
				}
			}// else - Don't care
		}
		
	    this.ace.blur();		// Needed to force ACE to ignore keystrokes after the popup is opened
		
	    return true; // Stop the propagation of the event
	}
});
