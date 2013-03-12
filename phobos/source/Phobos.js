/*global alert, Documentor, ProjectCtrl */
enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{kind: "DragAvatar", components: [
			{tag: "img", src: "$deimos/images/icon.png"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", Xstyle: "padding: 10px;", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", components: [
				{name: "documentLabel", content: "Document"},
				{name: "saveButton", kind: "onyx.Button", content: $L("Save"), ontap: "saveDocAction"},
				{name: "newKindButton", kind: "onyx.Button", Showing: "false", content: $L("New Kind"), ontap: "newKindAction"},
				{fit: true},
				{name: "editorButton", kind: "onyx.Button", content: "Editor Settings", ontap: "editorSettings"},
				{name: "designerButton", kind: "onyx.Button", content: $L("Designer"), ontap: "designerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "docChanged", onSave: "saveDocAction", onCursorChange: "cursorChanged", onAutoCompletion: "startAutoCompletion", onFind: "findpop", onScroll: "handleScroll"},
						{name: "imageViewer", kind: "enyo.Image"}
					]}
				]},
				{name: "right", kind: "rightPanels", showing: false,	arrangerKind: "CardArranger"}
			]}
		]},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Saving document...", style: "padding-top: 10px;"}
		]},
		{name: "savePopup", kind: "Ares.ActionPopup", onAbandonDocAction: "abandonDocAction"},
		{name: "autocomplete", kind: "Phobos.AutoComplete"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{name: "findpop", kind: "FindPopup", centered: true, modal: true, floating: true, onFindNext: "findNext", onFindPrevious: "findPrevious", onReplace: "replace", onReplaceAll:"replaceAll", onHide: "focusEditor", onClose: "findClose", onReplaceFind: "replacefind"},
		{name: "editorSettingsPopup", kind: "EditorSettings", classes: "ares_phobos_settingspop", centered: true, modal: true, floating: true,
		onChangeTheme: "changeTheme", onChangeHighLight: "changeHighLight", onClose: "closeEditorPop", onWordWrap: "changeWordWrap", onFontsizeChange: "changeFont", onTabSizsChange: "tabSize"}
	],
	events: {
		onSaveDocument: "",
		onDesignDocument: "",
		onCloseDocument: "",
		onUpdate: ""
	},
	handlers: {
		onCss: "newcssAction",
		onReparseAsked: "reparseAction"
	},
	debug: false,
	// Container of the code to analyze and of the analysis result
	analysis: {},
	create: function() {
		this.inherited(arguments);
	},
	getProjectController: function() {
		this.projectCtrl = this.projectData.getProjectCtrl();
		if ( ! this.projectCtrl) {
			this.projectCtrl = new ProjectCtrl({projectData: this.projectData});
			this.projectData.setProjectCtrl(this.projectCtrl);
		}
	},
	//
	saveDocAction: function() {
		this.showWaitPopup("Saving document...");
		this.doSaveDocument({content: this.$.ace.getValue(), file: this.docData.getFile()});
	},
	saveComplete: function() {
		this.hideWaitPopup();
		this.docData.setEdited(false);		// TODO: The user may have switched to another file
		this.reparseAction();
	},
	saveNeeded: function() {
		return this.docData.getEdited();
	},
	saveFailed: function(inMsg) {
		this.hideWaitPopup();
		this.log("Save failed: " + inMsg);
		this.showErrorPopup("Unable to save the file");
	},
	beginOpenDoc: function() {
		this.showWaitPopup("Opening document...");
	},
	openDoc: function(inDocData) {
		// If we are changing documents, reparse any changes into the current projectIndexer
		if (this.docData && this.docData.getEdited()) {
			this.reparseAction(true);
		}

		// Set up the new doucment
		this.docData = inDocData;
		this.projectData = this.docData.getProjectData();
		this.getProjectController();
		this.setAutoCompleteData();

		// Save the value to set it again after data has been loaded into ACE
		var edited = this.docData.getEdited();

		var file = this.docData.getFile();
		var extension = file.name.split(".").pop();
		this.hideWaitPopup();
		this.analysis = null;
		var mode = {json: "json", js: "javascript", html: "html", css: "css", jpg: "image", png: "image", gif: "image", design: "json"}[extension] || "text";
		this.docData.setMode(mode);
		var hasAce = this.adjustPanelsForMode(mode);
		
		if (hasAce) {
			var aceSession = this.docData.getAceSession();
			if (aceSession) {
				this.$.ace.setSession(aceSession);
			} else {
				aceSession = this.$.ace.createSession(this.docData.getData(), mode);
				this.docData.setData(null);			// We no longer need this data as it is now handled by the ACE edit session
				this.$.ace.setSession(aceSession);
				this.docData.setAceSession(aceSession);
			}
			
			// Pass to the autocomplete compononent a reference to ace
			this.$.autocomplete.setAce(this.$.ace);
			this.focusEditor();

			/* set editor to user pref */
			this.$.ace.editingMode = mode;
			this.$.ace.highlightActiveLine = localStorage.highlight;
			if(!this.$.ace.highlightActiveLine || this.$.ace.highlightActiveLine.indexOf("false") != -1){
				this.$.ace.highlightActiveLine = false;
			}
			this.$.ace.highlightActiveLineChanged();
			this.$.ace.wordWrap = localStorage.wordwrap;

			if(!this.$.ace.wordwrap || this.$.ace.wordWrap.indexOf("false") != -1){
				this.$.ace.wordWrap = false;
			}
			this.$.ace.wordWrapChanged();

			this.fSize = localStorage.fontsize;
			if(this.fSize ===  undefined){
				this.fSize = "11px";
			}

			this.$.ace.setFontSize(this.fSize);
		}
		else {
			var origin = this.projectData.getService().getConfig().origin;
			this.$.imageViewer.setAttribute("src", origin + file.pathname);
		}
		this.projectCtrl.buildProjectDb();
		this.reparseAction(true);
		this.$.documentLabel.setContent(file.name);

		this.docData.setEdited(edited);
		this.$.toolbar.resized();
	},
	adjustPanelsForMode: function(mode) {
		// whether to show or not a panel, imageViewer and ace cannot be enabled at the same time
		var showModes = {
			json:		{imageViewer: false, ace: true , saveButton: true , newKindButton: false, designerButton: false,  right: false },
			javascript:	{imageViewer: false, ace: true , saveButton: true , newKindButton: true,  designerButton: true ,  right: true  },
			html:		{imageViewer: false, ace: true , saveButton: true , newKindButton: false, designerButton: false,  right: false },
			css:		{imageViewer: false, ace: true , saveButton: true , newKindButton: false, designerButton: false,  right: true  },
			text:		{imageViewer: false, ace: true , saveButton: true , newKindButton: false, designerButton: false,  right: false },
			image:		{imageViewer: true , ace: false, saveButton: false, newKindButton: false, designerButton: false,  right: false }
		};

		var showSettings = showModes[mode]||showModes['text'];
		for (var stuff in showSettings) {
			this.$[stuff].setShowing( showSettings[stuff] ) ;
		}

        // xxxIndex: specify what to show in the "RightPanels" kinds (declared at the end of this file)
        // xxxIndex is ignored when matching show setting is false
		var modes = {
			json:		{rightIndex: 0},
			javascript:	{rightIndex: 1},
			html:		{rightIndex: 2},
			css:		{rightIndex: 3},
			text:		{rightIndex: 0},
			image:		{rightIndex: 0}
		};

		var settings = modes[mode]||modes['text'];
		this.$.right.setIndex(settings.rightIndex);
		this.$.body.reflow();
		return showSettings.ace ;
	},
	showWaitPopup: function(inMessage) {
		this.$.waitPopupMessage.setContent(inMessage);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	//
	setAutoCompleteData: function() {
		this.$.autocomplete.hide();
		this.$.autocomplete.setProjectData(this.projectData);
	},
	resetAutoCompleteData: function() {
		this.$.autocomplete.setProjectData(null);
	},
	projectIndexReady: function(model, value, options) {
		// Pass to the autocomplete component a reference to the project indexer
		this.$.autocomplete.setProjectIndexer(value);
	},
	dumpInfo: function(inObject) {
		var c = inObject;
		if (!c || !c.superkinds) {
		//enyo.log(this.$.right.$.dump);
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
	//* Updates the projectIndexer (notifying watchers by default) and resets the local analysis file
	reparseAction: function(inhibitUpdate) {
		var mode = this.docData.getMode();
		var module = {
			name: this.docData.getFile().name,
			code: this.$.ace.getValue(),
			path: this.projectCtrl.projectUrl + this.docData.getFile().dir + this.docData.getFile().name
		};
		switch(mode) {
			case "javascript":
				try {
					this.analysis = module;
					this.projectData.getProjectIndexer().reIndexModule(module);
					if (inhibitUpdate !== true) {
						this.projectData.updateProjectIndexer();
					}
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
				break;
			case "json":
				if (module.name.slice(-7) == ".design") {
					this.projectData.getProjectIndexer().reIndexDesign(module);
					if (inhibitUpdate !== true) {
						this.projectData.updateProjectIndexer();
					}
				}
				this.analysis = null;
				this.$.autocomplete.setAnalysis(null);
				break;
			default:
				this.analysis = null;
				this.$.autocomplete.setAnalysis(null);
				break;
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
			var start = 0, range;
			for( var idx = 1; idx < module.objects.length ; idx++ ) {
				range = { first: start, last: module.objects[idx].line - 1};
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
	//* Navigate from Phobos to Deimos. Pass Deimos all relevant info.
	designerAction: function() {
		// Update the projectIndexer and notify watchers
		this.reparseAction();
		
		var kinds = this.extractKindsData(),
			data = {
				kinds: kinds,
				projectData: this.projectData,
				fileIndexer: this.analysis
			};
		
		if (kinds.length > 0) {
			// Request to design the current document, passing info about all kinds in the file
			this.doDesignDocument(data);
		} else {
			alert("No kinds found in this file");
		}
	},
	//* Extract info about kinds from the current file needed by the designer
	extractKindsData: function() {
		var isDesignProperty = {
				layoutKind: true,
				attributes: true,
				classes: true,
				content: true,
				controlClasses: true,
				defaultKind: true,
				fit: true,
				src: true,
				style: true,
				tag: true,
				name: true
			},
			c = this.$.ace.getValue(),
			kinds = [];
		
		if (this.analysis) {
			for (var i=0; i < this.analysis.objects.length; i++) {
				var o = this.analysis.objects[i];
				var start = o.componentsBlockStart;
				var end = o.componentsBlockEnd;
				var name = o.name;
				var kind = o.superkind;
				var comps = [];
				if (start && end) {
					var js = c.substring(start, end);
					comps = eval("(" + js + ")"); // Why eval? Because JSON.parse doesn't support unquoted keys...
				}
				var comp = {
					name: name,
					kind: kind,
					components: comps
				};
				for (var j=0; j < o.properties.length; j++) {
					var prop = o.properties[j];
					var pName = prop.name;
					if (isDesignProperty[pName]) {
						var value = Documentor.stripQuotes(prop.value[0].name);
						comp[pName] = value;
					}
				}
				kinds.push(comp);
			}
		}
		return kinds;
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
			this.reparseAction(true);

			/*
			 * Insert missing handlers starting from the end of the
			 * file to limit the need of reparsing/reanalysing
			 * the file
			 */
			for( var i = this.analysis.objects.length -1 ; i >= 0 ; i-- ) {
				var obj = this.analysis.objects[i];
				if (obj.components) {
					this.insertMissingHandlersIntoKind(obj);
				}
			}
			// Reparse to get the definition of the newly added methods
			this.reparseAction(true);
		} else {
			// There is no parser data for the current file
			enyo.log("Unable to insert missing handler methods");
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
			if (item !== "" && existing[item] === undefined) {
				codeToInsert += (commaTerminated ? "" : ",\n");
				commaTerminated = false;
				codeToInsert += ("\t" + item + ": function(inSender, inEvent) {\n\t\t// TO");
				codeToInsert += ("DO - Auto-generated code\n\t}");
			}
		}

		// insert the missing handler methods code in the editor
		if (object.block) {
			if (codeToInsert !== "") {
				// Get the corresponding Ace range to replace/insert the missing code
				// NB: ace.replace() allow to use the undo/redo stack.
				var pos = object.block.end - 2;
				var range = this.$.ace.mapToLineColumnRange(pos, pos);
				this.$.ace.replaceRange(range, codeToInsert);
			}
		} else {
			// There is no block information for that kind - Parser is probably not up-to-date
			enyo.log("Unable to insert missing handler methods");
		}
	},
	// called when designer has modified the components
	updateComponents: function(inSender, inEvent) {
		for( var i = this.analysis.objects.length -1 ; i >= 0 ; i-- ) {
			if (inEvent.contents[i]) {
				// Insert the new version of components (replace components block, or insert at end)
				var obj = this.analysis.objects[i];
				var comps = inEvent.contents[i];
				var start = obj.componentsBlockStart;
				var end = obj.componentsBlockEnd;
				if (!(start && end)) {
					// If this kind doesn't have a components block yet, insert a new one
					// at the end of the file
					var last = obj.properties[obj.properties.length-1];
					if (last) {
						comps = (last.commaTerminated ? "" : ",") + "\n\t" + "components: " + comps;
						start = obj.block.end - 2;
						end = obj.block.end - 2;
					}
				}
				// Get the corresponding Ace range to replace the component definition
				// NB: ace.replace() allow to use the undo/redo stack.
				var range = this.$.ace.mapToLineColumnRange(start, end);
				this.$.ace.replaceRange(range, comps);
			}
		}
		/*
		 * Insert the missing handlers
		 * NB: reparseAction() is invoked by insertMissingHandlers()
		 */
		this.insertMissingHandlers();
		this.docData.setEdited(true);
	},
	closeDocAction: function(inSender, inEvent) {
		if (this.docData.getEdited() === true) {
			this.$.savePopup.setName("Document was modified! Save it before closing?");
			this.$.savePopup.setActionButton("Don't Save");
			this.$.savePopup.applyStyle("padding-top: 10px");
			this.$.savePopup.show();
		} else {
			var id = this.docData.getId();
			this.beforeClosingDocument();
			this.doCloseDocument({id: id});
		}
		return true; // Stop the propagation of the event
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		var docData = this.docData;
		this.beforeClosingDocument();
		this.doCloseDocument({id: docData.getId()});
	},
	docChanged: function(inSender, inEvent) {
		this.docData.setEdited(true);

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

		this.$.autocomplete.cursorChanged(position);
		return true; // Stop the propagation of the event
	},
	startAutoCompletion: function() {
		this.$.autocomplete.start(null);
	},
	newKindAction: function() {
		// Insert a new empty enyo kind at the end of the file
		var newKind = 'enyo.kind({\n	name : "@cursor@",\n	kind : "Control",\n	components : []\n});';
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
		this.$.ace.destroySession(this.docData.getAceSession());
		// NOTE: docData will be clear when removed from the Ares.Workspace.files collections
		this.resetAutoCompleteData();
		this.docData = null;
		this.projectData = null;
	},
	// Show Find popup
	findpop: function(){
		this.$.findpop.show();
		return true;
	},
	findNext: function(inSender, inEvent){
		var options = {backwards: false, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.find(this.$.findpop.findValue, options);
	},

	findPrevious: function(){
		var options = {backwards: true, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.find(this.$.findpop.findValue, options);
	},

	replaceAll: function(){
		this.$.ace.replaceAll(this.$.findpop.findValue , this.$.findpop.replaceValue);
	},
	
	replacefind: function(){
		var options = {backwards: false, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.replacefind(this.$.findpop.findValue , this.$.findpop.replaceValue, options);	
	},

	//ACE replace doesn't replace the currently-selected match. It instead replaces the *next* match. Seems less-than-useful
	replace: function(){
		//this.$.ace.replace(this.$.findpop.findValue , this.$.findpop.replaceValue);
	},

	focusEditor: function(inSender, inEvent) {
		this.$.ace.focus();
	},
	getEditorContent: function() {
		return this.$.ace.getValue();
	},
	handleScroll: function(inSender, inEvent) {
		this.$.autocomplete.hide();
	},

	findClose: function(){
		this.$.findpop.hide();
	},
	/*  editor setting */

	editorSettings: function() {
		this.$.editorSettingsPopup.show();
	},

	closeEditorPop: function(){
		this.$.editorSettingsPopup.hide();
	},

	changeHighLight: function(){
		this.$.ace.highlightActiveLine = this.$.editorSettingsPopup.highlight;
		this.$.ace.highlightActiveLineChanged();
	},
	changeTheme: function() {
		this.$.ace.theme = this.$.editorSettingsPopup.theme;
		this.$.ace.themeChanged();
	},
	changeWordWrap: function() {
		this.$.ace.wordWrap = this.$.editorSettingsPopup.wordWrap;
		this.$.ace.wordWrapChanged();
	},
	changeFont: function(){
		var fs = this.$.editorSettingsPopup.fSize;
			this.$.ace.setFontSize(fs);
	},

	tabSize: function() {
		var ts = this.$.ace.editorSettingsPopup.Tsize;
		this.$.ace.setTabSize(ts);
	},
	
	//* Trigger an Ace undo and bubble updated code
	undoAndUpdate: function() {
		this.$.ace.undo();
		this.bubbleCodeUpdate();
	},
	//* Trigger an Ace undo and bubble updated code
	redoAndUpdate: function() {
		this.$.ace.redo();
		this.bubbleCodeUpdate();
	},
	//* Send up an updated copy of the code
	bubbleCodeUpdate: function() {
		// Update the projectIndexer and notify watchers
		this.reparseAction(true);
		
		var data = {kinds: this.extractKindsData(), projectData: this.projectData, fileIndexer: this.analysis};
		if (data.kinds.length > 0) {
			this.doUpdate(data);
		} else {
			enyo.warn("No kinds found in this file");
		}
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
