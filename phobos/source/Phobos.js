enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{name: "enyoAnalyzer", kind: "Analyzer", onIndexReady: "enyoIndexReady"},
		{name: "projectAnalyzer", kind: "Analyzer", onIndexReady: "projectIndexReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		{kind: "DragAvatar", components: [
			{tag: "img", src: "$deimos/images/icon.png"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", Xstyle: "padding: 10px;", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 10px;", components: [
				{kind: "onyx.Button", content: "Close", ontap: "closeDocAction"},
				{name: "documentLabel", content: "Document"},
				{kind: "onyx.Button", content: "Save", ontap: "saveDocAction"},
				{name: "newKindButton", kind: "onyx.Button", Showing: "false", content: "New kind", ontap: "newKindAction"},
				{fit: true},
				{name: "designerButton", kind: "onyx.Button", content: "Designer", ontap: "designerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "left", kind: "leftPanels", showing: false,	arrangerKind: "CardArranger", onCss: "newcssAction"},
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
	events: {
		onSaveDocument: "",
		onDesignDocument: "",
		onCloseDocument: ""
	},
	handlers: {
		onCss: "newcssAction",
		onReparseAsked: "reparseAction"
	},
	docHasChanged: false,
	debug: false,
	// Container of the code to analyze and of the analysis result
	analysis: {},
	mode: "",				// js, css, ...
	file: null,			
	create: function() {
		this.inherited(arguments);
		this.buildEnyoDb();

		// Pass to the autocomplete compononent a reference to ace
		this.$.autocomplete.setAce(this.$.ace);
	},
	//
	//
	saveDocAction: function() {
		this.showWaitPopup("Saving document...");
		this.doSaveDocument({content: this.$.ace.getValue(), file: this.file});
	},
	saveComplete: function() {
		this.hideWaitPopup();
		this.docHasChanged=false;
		this.reparseAction();
	},
	beginOpenDoc: function() {
		this.showWaitPopup("Opening document...");
	},
	openDoc: function(inFile, inCode, inExt, inProjectUrl) {
		this.hideWaitPopup();
		this.analysis = null;
		this.file = inFile;
		this.mode = {json: "json", js: "javascript", html: "html", css: "css"}[inExt] || "text";
		this.$.ace.setEditingMode(this.mode);
		this.adjustPanelsForMode(this.mode);
		this.$.ace.setValue(inCode);
		this.reparseAction();
		this.buildProjectDb(inProjectUrl);
		this.docHasChanged=false;
		this.$.documentLabel.setContent(this.file.name);
	},
	adjustPanelsForMode: function(mode) {
		var modes = {
			json:		{leftShowing: false, rightShowing: false, leftIndex: 0, rightIndex: 0, newKindButton: false, designer: false},
			javascript:	{leftShowing: false, rightShowing: true,  leftIndex: 1, rightIndex: 1, newKindButton: true,  designer: true},
			html:		{leftShowing: false, rightShowing: false, leftIndex: 2, rightIndex: 2, newKindButton: false, designer: false},
			css:		{leftShowing: false, rightShowing: true,  leftIndex: 3, rightIndex: 3, newKindButton: false, designer: false},
			text:		{leftShowing: false, rightShowing: false, leftIndex: 0, rightIndex: 0, newKindButton: false, designer: false}
		};
		var settings = modes[mode]||modes['text'];
		this.$.left.setIndex(settings.leftIndex);
		this.$.left.setShowing(settings.leftShowing);
		this.$.right.setIndex(settings.rightIndex);
		this.$.right.setShowing(settings.rightShowing);
		this.$.newKindButton.setShowing(settings.newKindButton);
		this.$.designerButton.setShowing(settings.designer);
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
	buildEnyoDb: function() {
		this.$.enyoAnalyzer.analyze(["$enyo/source", "$lib/layout", "$lib/onyx"]);
	},
	buildProjectDb: function(inProjectUrl) {
		this.log("projectUrl: " + inProjectUrl);			// TODO TBC
//		this.$.projectAnalyzer.analyze(["http://127.0.0.1:44799/some/files/file/NewProject/AutoComplete"]); // TODO TBR
		this.$.projectAnalyzer.analyze([inProjectUrl]);
	},
	enyoIndexReady: function() {
		// Pass to the autocomplete component a reference to the enyo indexer
		this.$.autocomplete.setEnyoIndexer(this.$.enyoAnalyzer.index);
	},
	projectIndexReady: function() {
		// Pass to the autocomplete component a reference to the project indexer
		this.$.autocomplete.setProjectIndexer(this.$.projectAnalyzer.index);
	},
	dumpInfo: function(inObject) {
		var c = inObject;
		if (!c || !c.superkinds) {
		//console.log(this.$.right.$.dump);
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
		if (this.mode === 'javascript') {
			var module = {
				name: this.file.name,
				code: this.$.ace.getValue()
			};
			try {
				this.analysis = module;
				this.$.projectAnalyzer.index.indexModule(module);
				this.updateObjectsLines(module);
	
				// dump the object where the cursor is positioned, if it exists
				this.dumpInfo(module.objects && module.objects[module.currentObject]);
				
				// Give the information to the autocomplete component
				this.$.autocomplete.setAnalysis(this.analysis);
			} catch(error) {
				enyo.log("An error occured during the code analysis: " + error);
				this.dumpInfo(null);
				this.$.autocomplete.setAnalysis(null);
			}
		} else {
			this.analysis = null;
			this.$.autocomplete.setAnalysis(null);
		}
	},
	/**
	 * Add for each object the corresponding range of lines in the file
	 * Update the information about the object currently referenced
	 * by the cursor position
	 * TODO: see if this should go in Analyzer2
	 */
	updateObjectsLines: function(module) {
		module.ranges = [];
		if (module.objects && module.objects.length > 0) {
			var start = 0;
			for( var idx = 1; idx < module.objects.length ; idx++ ) {
				var range = { first: start, last: module.objects[idx].line - 1};
				module.ranges.push(range);	// Push a range for previous object
				start = module.objects[idx].line;
			}

			// Push a range for the last object
			range = { first: start, last: 1000000000};
			module.ranges.push(range);
		}

		var position = this.$.ace.getCursorPositionInDocument();
		module.currentObject = this.findCurrentEditedObject(position);
		module.currentRange = module.ranges[module.currentObject];
		module.currentLine = position.row;
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
					var start = o.componentsBlockStart;
					var end = o.componentsBlockEnd;
					var js = c.substring(start, end);
					var o = eval("(" + js + ")"); // Why eval? Because JSON.parse doesn't support unquoted keys...
					kinds.push({name: name, kind: kind, components: o});
				}
			}
			if (kinds.length > 0) {
				this.doDesignDocument(kinds);
				return;
			}
		}
		alert("No kinds found in this file");
	},
	/**
	 * Lists the handler methods mentioned in the "handlers"
	 * attributes and in the sub-components of the kind object
	 * passed as a parameter
	 * @param object: the kind definition to explore
	 * @param declared: list of handler methods already listed
	 * @returns the list of declared handler methods
	 */
	listHandlers: function(object, declared) {
		declared = this.listDeclaredComponentsHandlers(object.components, declared);
		for(var i = 0; i < object.properties.length; i++) {
			var p = object.properties[i];
			try {
				if (p.name === 'handlers') {
					for(var j = 0; i < p.value[0].properties.length; j++) {
						var q = p.value[0].properties[j];
						var name = q.value[0].name;
						name = name.replace(/["']{1}/g, '');
						if (name.substr(0, 2) !== 'do') {	// Exclude doXXXX methods
							declared[name] = "";
						}
					}
				}
			} catch(error) {
				enyo.log("Unexpected error: " + error);		// TODO TBC
			}
		}
		return declared;
	},
	/**
	 * Recursively lists the handler methods mentioned in the "onXXXX"
	 * attributes of the components passed as an input parameter 
	 * @param components: components to walk thru
	 * @param declared: list of handler methods already listed
	 * @returns the list of declared handler methods
	 * @protected
	 */
	listDeclaredComponentsHandlers: function(components, declared) {
		for(var i = 0; i < components.length; i++) {
			var c = components[i];
			for(var k = 0 ; k < c.properties.length ; k++) {
				var p = c.properties[k];
				if (p.name.substr(0, 2) === 'on') {
					var name = p.value[0].name.replace(/["']{1}/g, '');
					if (name.substr(0, 2) !== 'do') {	// Exclude doXXXX methods
						declared[name] = "";
					}
				}
			}
			if (components.components) {
				this.listDeclaredComponentsHandlers(components.components, declared);
			}
		}
		return declared;
	},
	/**
	 * This function checks all the kinds and add the missing
	 * handler functions listed in the "onXXXX" attributes
	 * @protected
	 * Note: This implies to reparse/analyze the file before
	 * and after the operation. 
	 */
	insertMissingHandlers: function() {
		if (this.analysis) {
			// Reparse to get the definition of possibly added onXXXX attributes
			this.reparseAction();
			
			/*
			 * Insert missing handlers starting from the end of the
			 * file to limit the need of reparsing/reanalysing
			 * the file 
			 */  
			for( var i = this.analysis.objects.length -1 ; i >= 0 ; i-- ) {
				this.insertMissingHandlersIntoKind(this.analysis.objects[i]);
			}
	
			// Reparse to get the definition of the newly added methods
			this.reparseAction();
		} else {
			// There is no parser data for the current file
			console.log("Unable to insert missing handler methods");
		}
	},
	/**
	 * This function checks the kind passed as an inout parameter
	 *  and add the missing handler functions listed in the "onXXXX" attributes
	 * @param object
	 * @protected
	 */
	insertMissingHandlersIntoKind: function(object) {
		// List existing handlers
		var existing = {};
		var commaTerminated = false;
		for(var j = 0 ; j < object.properties.length ; j++) {
			var p = object.properties[j];
			commaTerminated = p.commaTerminated;
			if (p.value[0].name === 'function') {
				existing[p.name] = "";
			}
		}
		
		// List the handler methods declared in the components and in handlers map
		var declared = this.listHandlers(object, {});
		
		// Prepare the code to insert
		var codeToInsert = "";
		for(var item in declared) {
			if (existing[item] === undefined) {
				codeToInsert += (commaTerminated ? "" : ",\n");
				commaTerminated = false;
				codeToInsert += ("    " + item + ": function(inSender, inEvent) {\n        // TO"
						+ "DO - Auto-generated code\n    }"); 
			}
		}

		// insert the missing handler methods code in the editor
		if (object.block) {
			if (codeToInsert !== "") {
				codeToInsert += "\n";
				var pos = object.block.end - 1;
				var c = this.$.ace.getValue();
				var pre = c.substring(0, pos);
				var post = c.substring(pos);
				var code = pre + codeToInsert + post;
				this.$.ace.setValue(code);
			}
		} else {
			// There is no block information for that kind - Parser is probably not up-to-date
			console.log("Unable to insert missing handler methods");
		}
	},
	// called when designer has modified the components
	updateComponents: function(inSender, inEvent) {
		for( var i = this.analysis.objects.length -1 ; i >= 0 ; i-- ) {
			if (inEvent.contents[i]) {
				// Insert the new version of components
				var c = this.$.ace.getValue();
				var start = this.analysis.objects[i].componentsBlockStart;
				var end = this.analysis.objects[i].componentsBlockEnd;
				var pre = c.substring(0, start);
				var post = c.substring(end);
				var code = pre + inEvent.contents[i] + post;
				this.$.ace.setValue(code);
			}
		}
		/*
		 * Insert the missing handlers
		 * NB: reparseAction() is invoked by insertMissingHandlers()
		 */
		this.insertMissingHandlers();
		this.docHasChanged = true;
	},
	closeDocAction: function(inSender, inEvent) {
		if (this.docHasChanged) {
			this.$.savePopup.show();
		} else {
			this.beforeClosingDocument();
			this.doCloseDocument({});
		}
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		this.beforeClosingDocument();
		this.doCloseDocument({});
	},
	// called when the "Cancel" is selected in save popup
	cancelCloseAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
	},
	docChanged: function(inSender, inEvent) {
		this.docHasChanged=true;

		if (this.debug) this.log(JSON.stringify(inEvent.data));

		if (this.analysis) {
			// Call the autocomplete component
			this.$.autocomplete.start(inEvent);
		}
		return true; // Stop the propagation of the event
	},
	cursorChanged: function(inSender, inEvent) {
		var position = this.$.ace.getCursorPositionInDocument();
		if (this.debug) this.log(inSender.id + " " + inEvent.type + " " + JSON.stringify(position));

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
		this.$.autocomplete.start(null);
	},
	newKindAction: function() {
		// Insert a new empty enyo kind at the end of the file
		var newKind = 'enyo.kind({\n	name : "@cursor@",\n	kind : "enyo.Control",\n	components : []\n});';
		this.$.ace.insertAtEndOfFile(newKind, '@cursor@');
	},
	newcssAction: function(inSender, inEvent){
		this.$.ace.insertAtEndOfFile(inEvent.outPut);
	},
	/*
	 * Perform a few actions before closing a document
	 * @protected
	 */
	beforeClosingDocument: function() {
		this.$.autocomplete.setProjectIndexer(null);
	}
});

enyo.kind({
	name: "rightPanels",kind: "Panels", wrap: false,
	events: {
		onCss: "",
		onReparseAsked: ""
	},
	components: [
		{// right panel for JSON goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit", components: [
			{name: "right", classes: "border panel enyo-fit",style: "margin: 8px;", components: [
				{kind: "enyo.Scroller", classes: "panel enyo-fit",components: [
					{kind: "onyx.Button", content: "Reparse",  ontap: "doReparseAsked"},
					{name: "dump", allowHtml: true}
				]}
			]}
		]},
		{// right panel for HTML goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit",	components: [ // right panel for CSS here
			{kind: "cssBuilder", classes: "border panel enyo-fit",style: "margin: 8px;", onInsert: "test"}
		]}
	],

	create: function() {
		this.inherited(arguments);
	},
	test: function(inEvent) {
		this.doCss(inEvent);
	}
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
