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
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "docChanged", onSave: "saveDocAction", onCursorChange: "cursorChanged", onEscape: "handleEscape"}
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
		{name: "autocompletePopup", kind: "enyo.Popup", centered: false, floating: true, autoDismiss: false, modal: true, style: "position: absolute; z-index: 100; width: 140px; height: 10px",
			components: [
			    {kind: "Select", name: "autocompleteSelect", attributes: {size: 1}, onchange: "autocompleteChanged", style: "z-index: 100; width: 140px; display: block; background-color: white; background-position: initial initial; background-repeat: initial initial; ", components: [
			        // options elements will be populated programmatically                  
                ]}
		]}
	],
	handlers: {
	},
	docHasChanged: false,
	// Constants
	AUTOCOMP_THIS_DOLLAR: 'this.$.',
	AUTOCOMP_THIS_DOLLAR_LEN: -1,	// Initialized in create function
	// Container of the code to analyze and of the analysis result
	analysis: {},
	create: function() {
		this.AUTOCOMP_THIS_DOLLAR_LEN = this.AUTOCOMP_THIS_DOLLAR.length;
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
		this.docHasChanged=false;
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
				var ace = this.$.ace;
				var line = ace.getLine(data.range.end.row);
				var end = data.range.end.column;
				last = line.substr(end - this.AUTOCOMP_THIS_DOLLAR_LEN, this.AUTOCOMP_THIS_DOLLAR_LEN);
				
				if (last == this.AUTOCOMP_THIS_DOLLAR) { // Check if it's part of a 'this.$." string
					this.showAutocompletePopup(this.analysis.objects[0].components, data.range.end);
				}
			}
		}
		
		return true; // Stop the propagation of the event
	},
	cursorChanged: function(inSender, inEvent) {
		// enyo.log("phobos.cursorChanged: " + inSender.id + " " + inEvent.type + " " + JSON.stringify(this.$.ace.getCursorPositionInDocument()));
		return true; // Stop the propagation of the event
	},
	showAutocompletePopup: function(conponents, position) {
		var autocompletePopup = this.$.autocompletePopup;
		var select = this.$.autocompleteSelect;
		// Fill-up the auto-completion list
		enyo.forEach(conponents, function(a) {select.createComponent({content: a.name});});
		select.setAttribute("size", Math.min(conponents.length,10));
		
		// Compute the position of the popup
		var ace = this.$.ace;
		var editor = this.$.ace.editor;
		var pos = editor.renderer.textToScreenCoordinates(position.row, position.column);			
		pos.pageY += ace.getLineHeight(); // Add the font height to be below the line

		// Position the autocomplete popup
		autocompletePopup.applyStyle("top", pos.pageY + "px");
		autocompletePopup.applyStyle("left", pos.pageX + "px");
		autocompletePopup.show();
	},
	handleEscape: function(inSender, inEvent) {
		this.$.autocompletePopup.hide();
		return true; // Stop the propagation of the event
	},
	autocompleteChanged: function(inSender, inEvent) {
		// Insert the selected value
		this.$.autocompletePopup.hide();
		var ace = this.$.ace;
		var position = ace.getCursorPositionInDocument();
		ace.insertAt(position, inSender.getValue());
		return true; // Stop the propagation of the event
	}
});

