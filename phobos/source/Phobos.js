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
				{name: "left", kind: "leftPanels", showing: false,	arrangerKind: "CardArranger"},
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "docChanged", onSave: "saveDocAction", onCursorChange: "cursorChanged", onAutoCompletion: "startAutoCompletion"}
					]}
				]},
				{name: "right", kind: "rightPanels", showing: false,	arrangerKind: "CardArranger"}
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
				{kind: "onyx.Button", content: "Don't Save", ontap: "abandonDocAction"}
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
		this.analysis = null;
		var mode = {json: "json", js: "javascript", html: "html", css: "css"}[inExt] || "text";
		this.$.ace.setEditingMode(mode);
		this.adjustPanelsForMode(mode);
		this.$.ace.setValue(inCode);
		this.docHasChanged=false;
	},
	adjustPanelsForMode: function(mode) {
		var modes = {
			json:		{leftShowing: false, rightShowing: false, leftIndex: 0, rightIndex: 0},
			javascript:	{leftShowing: false, rightShowing: true,  leftIndex: 1, rightIndex: 1},
			html:		{leftShowing: false, rightShowing: false, leftIndex: 2, rightIndex: 2},
			css:		{leftShowing: false, rightShowing: true,  leftIndex: 3, rightIndex: 3},
			text:		{leftShowing: false, rightShowing: false, leftIndex: 0, rightIndex: 0}
		};
		var settings = modes[mode]||modes['text'];
		this.$.left.setIndex(settings.leftIndex);
		this.$.left.setShowing(settings.leftShowing);
		this.$.right.setIndex(settings.rightIndex);
		this.$.right.setShowing(settings.rightShowing);
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
		console.log(this.$.right.$.dump);
			this.$.right.$.dump.setContent("(no info)");
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
		h = [];
		for (i=0, p; p=c.components[i]; i++) {
			h.push(p.name);
		}
		if (h.length) {
			h$ += "<h4>Components</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		}
		//
		h = [];
		for (i=0, p; p=c.properties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		h = [];
		for (i=0, p; p=c.allProperties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>All Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		this.$.right.$.dump.setContent(h$);
	},
	reparseAction: function() {
		var module = {
			name: "Document",
			code: this.$.ace.getValue()
		};
		try {
			this.analysis = module;
			this.$.analyzer.index.indexModule(module);
			this.updateObjectsLines(module);

			// dump the object where the cursor is positioned, if it exists
			this.dumpInfo(module.objects && module.objects[module.currentObject]);
		} catch(error) {
			enyo.log("An error occured during the code analysis: " + error);
			this.dumpInfo(null);
		}
	},
	/**
	 * Add for each object the corresponding range of lines in the file
	 * Update the information about the object currently referenced
	 * by the cursor position
	 * TODO: see if this should go in Analyzer2
	 */
	updateObjectsLines: function(tempo) {
		tempo.ranges = [];
		if (tempo.objects && tempo.objects.length > 0) {
			var start = 0;
			for( var idx = 1; idx < tempo.objects.length ; idx++ ) {
				var range = { first: start, last: tempo.objects[idx].line - 1};
				tempo.ranges.push(range);	// Push a range for previous object
				start = tempo.objects[idx].line;
			}

			// Push a range for the last object
			range = { first: start, last: 1000000000};
			tempo.ranges.push(range);
		}

		var position = this.$.ace.getCursorPositionInDocument();
		tempo.currentObject = this.findCurrentEditedObject(position);
		tempo.currentRange = tempo.ranges[tempo.currentObject];
		tempo.currentLine = position.row;
	},
	/**
	 * Return the index (in the analyzer result ) of the enyo kind
	 * currently edited (in which the cursor is)
	 * Otherwise return -1
	 * @returns {Number}
	 */
	findCurrentEditedObject: function(position) {
		if (this.analysis && this.analysis.ranges) {
			for( var idx = 0 ; idx < this.analysis.ranges.length ; idx++ ) {
				if (position.row <= this.analysis.ranges[idx].last) {
					return idx;
				}
			}
		}
		return -1;
	},
	designerAction: function() {
		var c = this.$.ace.getValue();
		this.reparseAction();
		if (this.analysis) {
			var kinds = [];
			for (var i=0; i < this.analysis.objects.length; i++) {
				var o = this.analysis.objects[i];
				var comps = o.components;
				var name = o.name;
				var kind = o.superkind;
				if (comps) { // only include kinds with components block
					var start = comps[0].start;
					var end = comps[comps.length - 1].end;
					var js = eval("(["+c.substring(start, end)+"])");
					kinds.push({name: name, kind: kind, components: js});
				}
			}
			if (kinds.length > 0) {
				this.bubble("onDesignDocument", kinds);
				return;
			}
		}
		alert("No kinds found in this file");
	},
	// called when designer has modified the components
	updateComponents: function(inSender, inEvent) {
		var c = this.$.ace.getValue();
		var i = inEvent.index;
		var comp = this.analysis.objects[i].components;
		//TODO: Indexer doesn't quite capture the right locations for Components start and end...
		// Indexer returns the start of the first component block, and we really want the location of the opening "["
		// similarly for the end. Or, need to change serializer to not return the [], which might be easier, and less disruptive to people's formatting.
		var start = comp[0].start;
		var end = comp[comp.length-1].end;
		var pre = c.substring(0, start);
		pre = pre.substring(0, pre.lastIndexOf("["));
		var post = c.substring(end);
		post = post.substring(post.indexOf("]")+1);
		var code = pre + inEvent.content + post;
		this.$.ace.setValue(code);
		this.reparseAction();
		this.docHasChanged = true;
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

		if (this.analysis) {
			// Call the autocomplete component
			this.$.autocomplete.start(inEvent, this.analysis);
		}
		return true; // Stop the propagation of the event
	},
	cursorChanged: function(inSender, inEvent) {
		var position = this.$.ace.getCursorPositionInDocument();
		if (this.debug) enyo.log("phobos.cursorChanged: " + inSender.id + " " + inEvent.type + " " + JSON.stringify(position));

		// Check if we moved to another enyo kind and display it in the right pane
		var tempo = this.analysis;
		if (tempo && tempo.currentLine !== undefined && tempo.currentLine != position.row) {	// If no more on the same line
			tempo.currentLine = position.row;

			// Check if the cursor references another object
			if (tempo.currentRange !== undefined && (position.row < tempo.currentRange.first || position.row > tempo.currentRange.last)) {
				tempo.currentObject = this.findCurrentEditedObject(position);
				tempo.currentRange = tempo.ranges[tempo.currentObject];

				this.dumpInfo(tempo.objects && tempo.objects[tempo.currentObject]);
			}
		}
		return true; // Stop the propagation of the event
	},
	startAutoCompletion: function() {
		this.$.autocomplete.start(null, this.analysis);
	}
});

enyo.kind({
	name : "Phobos.AutoComplete",
	kind : "onyx.Popup",
	centered : false,
	floating : true,
	autoDismiss : false,
	modal : true,
	classes: "ares_phobos_autocomp",
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
		classes : "ares_phobos_autocomp_select",
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

		if (inAnalysis.objects && inAnalysis.objects.length > 0) {
			var go = false;
			if (inEvent) {
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
							this.position = data.range.end;
							go = true;
						}
					}
				}
			} else {
				// Triggered by a Ctrl-Space coming from the user
				var position = this.ace.getCursorPositionInDocument();
				var line = this.ace.getLine(position.row);
				last = line.substr(position.column - this.AUTOCOMP_THIS_DOLLAR_LEN, this.AUTOCOMP_THIS_DOLLAR_LEN);

				if (last == this.AUTOCOMP_THIS_DOLLAR) { // Check if it's part of a 'this.$." string
					this.position = position;
					go = true;
				}
			}
			if (go === true) {
				this.input = "";
				this.components = inAnalysis.objects[inAnalysis.currentObject].components;
				this.showAutocompletePopup();
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
		if (select.nbEntries > 0) {
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
		} else {
			this.hideAutocompletePopup();
		}
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

enyo.kind({name: "rightPanels",kind: "Panels", wrap: false,
	components: [
		{// right panel for JSON goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit", components: [
			{name: "right", classes: "border panel enyo-fit", style: "margin: 8px;", components: [
				{kind: "enyo.Scroller", classes: "panel enyo-fit",components: [
					{kind: "onyx.Button", content: "Reparse", ontap: "reparseAction"},
					{name: "dump", allowHtml: true}
				]}
			]}
		]},
		{// right panel for HTML goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit",	components: [ // right panel for CSS here
			{kind: "cssBuilder", classes: "border panel enyo-fit",style: "margin: 8px;"}
		]}
	]
});
enyo.kind({name: "leftPanels",kind: "Panels", wrap: false,
	components: [
		{// left panel for JSON goes here
		},
		{// left panel for javascript goes here
		},
		{// left panel for HTML goes here
		},
		{ // left panel for CSS goes here
		}
	]
});
