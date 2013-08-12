/* global analyzer, ares, Ares, ProjectCtrl */

enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{kind: "FittableRows", classes: "enyo-fit", Xstyle: "padding: 10px;", components: [
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "docChanged", onSave: "saveDocAction", onCursorChange: "cursorChanged", onAutoCompletion: "startAutoCompletion", onFind: "findpop", onScroll: "handleScroll", onWordwrap: "toggleww", onFkey: "fkeypressed"},
						{name: "imageViewer", kind: "enyo.Image"}
					]}
				]},
				{name: "right", kind: "rightPanels", showing: false, classes: "ares_phobos_right", arrangerKind: "CardArranger"}
			]}
		]},
		{name: "savePopup", kind: "saveActionPopup", onAbandonDocAction: "abandonDocAction", onSave: "saveBeforeClose", onCancel: "cancelClose"},
		{name: "saveAsPopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, headerText: $L("Save as..."), folderChooser: false, allowCreateFolder: true, allowNewFile: true, allowToolbar: true, onFileChosen: "saveAsFileChosen"},
		{name: "autocomplete", kind: "Phobos.AutoComplete"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{name: "findpop", kind: "FindPopup", centered: true, modal: true, floating: true, onFindNext: "findNext", onFindPrevious: "findPrevious", onReplace: "replace", onReplaceAll:"replaceAll", onHide: "focusEditor", onClose: "findClose", onReplaceFind: "replacefind"},
		{name: "editorSettingsPopup", kind: "EditorSettings", classes: "enyo-unselectable", centered: true, modal: true, floating: true, autoDismiss: false,
		onChangeSettings:"applySettings", onChangeRightPane: "changeRightPane", onClose: "closeEditorPop", onHide:"hideTest", onTabSizsChange: "tabSize"}
	],
	events: {
		onShowWaitPopup: "",
		onHideWaitPopup: "",
		onSaveDocument: "",
		onSaveAsDocument: "",
		onDesignDocument: "",
		onCloseDocument: "",
		onUpdate: "",
		onRegisterMe: ""
	},
	handlers: {
		onCss: "newcssAction",
		onReparseAsked: "reparseAction"
	},
	published: {
		projectData: null
	},
	debug: false,
	// Container of the code to analyze and of the analysis result
	analysis: {},
	helper: null,			// Analyzer.KindHelper
	closeAll: false,
	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.helper = new analyzer.Analyzer.KindHelper();
		this.doRegisterMe({name:"phobos", reference:this});
	},
	getProjectController: function() {
		this.projectCtrl = this.projectData.getProjectCtrl();
		if ( ! this.projectCtrl) {
			this.projectCtrl = new ProjectCtrl({projectData: this.projectData});
			this.projectData.setProjectCtrl(this.projectCtrl);
		}
	},
	fileMenuItemSelected: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		if (typeof this[inEvent.selected.value] === 'function') {
			this[inEvent.selected.value]();
		} else {
			this.warn("Unexpected event or missing function: event:", inEvent.selected.value);
		}
	},
	saveDocAction: function() {
		this.showWaitPopup($L("Saving ..."));
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
	saveAsDocAction: function() {
		var file = this.docData.getFile();
		this.$.saveAsPopup.connectProject(this.docData.getProjectData(), (function() {
			var path = file.path;
			var relativePath = path.substring(path.indexOf(this.projectData.id) + this.projectData.id.length, path.length);
			this.$.saveAsPopup.pointSelectedName(relativePath, true);
			this.$.saveAsPopup.show();
		}).bind(this));
	},
	saveAsFileChosen: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);

		if (!inEvent.file) {
			// no file or folder chosen
			return;
		}
		var self = this;
		var relativePath = inEvent.name.split("/");
		var name = relativePath[relativePath.length-1];
		this.showWaitPopup($L("Saving ..."));
		this.doSaveAsDocument({
			docId: this.docData.getId(),
			projectData: this.docData.getProjectData(),
			file: inEvent.file,
			name: name,
			content: this.$.ace.getValue(),
			next: function(err) {
				self.hideWaitPopup();
				if (typeof inEvent.next === 'function') {
					inEvent.next();
				}
			}
		});
		return true; //Stop event propagation
	},
	saveBeforeClose: function(){
		this.saveDocAction();
		var id = this.docData.getId();
		this.beforeClosingDocument();
		this.doCloseDocument({id: id});
		this.closeNextDoc();
	},
	openDoc: function(inDocData) {

		// If we are changing documents, reparse any changes into the current projectIndexer
		if (this.docData && this.docData.getEdited()) {
			this.reparseAction(true);
		}

		// Set up the new doucment
		this.docData = inDocData;
		this.setProjectData(this.docData.getProjectData());
		this.getProjectController();
		this.setAutoCompleteData();

		// Save the value to set it again after data has been loaded into ACE
		var edited = this.docData.getEdited();

		var file = this.docData.getFile();
		var extension = file.name.split(".").pop();

		this.hideWaitPopup();
		this.analysis = null;

		var mode = {
			json: "json",
			design: "json",
			js: "javascript",
			html: "html",
			css: "css",
			coffee: "coffee",
			dot: "dot",
			patch: "diff",
			diff: "diff",
			jade: "jade",
			less: "less",
			md: "markdown",
			markdown: "markdown",
			svg: "svg",
			xml: "xml",
			jpeg: "image",
			jpg: "image",
			png: "image",
			gif: "image"
		}[extension] || "text";

		this.docData.setMode(mode);

		var hasAce = this.adjustPanelsForMode(mode, this.$.editorSettingsPopup.getSettings().rightpane);
		
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
			this.$.ace.applyAceSettings(this.$.editorSettingsPopup.getSettings());

			this.$.ace.editingMode = mode;
		}
		else {
			var origin = this.projectData.getService().getConfig().origin;
			this.$.imageViewer.setAttribute("src", origin + file.pathname);
		}
		this.manageDesignerButton();
		this.reparseAction(true);
		this.projectCtrl.buildProjectDb();

		this.docData.setEdited(edited);
		this.owner.$.toolbar.resized();
	},

	adjustPanelsForMode: function(mode, rightpane) {
		this.trace("mode:", mode);
		var showModes = {
			javascript: {
				imageViewer: false,
				ace: true,
				saveButton: true,
				saveAsButton: true,
				newKindButton: true,
				designerButton: true,
				right: rightpane
			},
			image: {
				imageViewer: true,
				ace: false,
				saveButton: false,
				saveAsButton: false,
				newKindButton: false,
				designerButton: false,
				right: false
			},
			text: {
				imageViewer: false,
				ace: true,
				saveButton: true,
				saveAsButton: true,
				newKindButton: false,
				designerButton: false,
				right: false
			}
		};

		var showStuff, showSettings = showModes[mode]||showModes['text'];
		for (var stuff in showSettings) {
			showStuff = showSettings[stuff];
			this.trace("show", stuff, ":", showStuff);
			if(this.$[stuff] !== undefined){
				if (typeof this.$[stuff].setShowing === 'function') {
					this.$[stuff].setShowing(showStuff) ;
				} else {
					this.warn("BUG: attempting to show/hide a non existing element: ", stuff);
				}
			} else {
				if (typeof this.owner.$[stuff].setShowing === 'function') {
					this.owner.$[stuff].setShowing(showStuff) ;
				} else {
					this.warn("BUG: attempting to show/hide a non existing element: ", stuff);
				}
			}
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
		this.doShowWaitPopup({msg: inMessage});
	},
	hideWaitPopup: function() {
		this.doHideWaitPopup();
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	//
	setAutoCompleteData: function() {
		this.$.autocomplete.hide();
		this.$.autocomplete.setProjectData(this.projectData);
		this.manageDesignerButton();
	},
	resetAutoCompleteData: function() {
		this.$.autocomplete.setProjectData(null);
	},
	/**
	 *	Disable "Designer" button unless project & enyo index are both valid
	 */
	manageDesignerButton: function() {
		var disabled = ! this.projectCtrl.fullAnalysisDone;
		this.owner.$.designerButton.setDisabled(disabled);
	},
	/**
	 * Receive the project data reference which allows to access the analyzer
	 * output for the project's files, enyo/onyx and all the other project
	 * related information shared between phobos and deimos.
	 * @param  oldProjectData
	 * @protected
	 */
	projectDataChanged: function(oldProjectData) {
		if (this.projectData) {
			this.projectData.on('update:project-indexer', this.projectIndexerChanged, this);
		}
		if (oldProjectData) {
			oldProjectData.off('update:project-indexer', this.projectIndexerChanged);
		}
	},
	/**
	 * The current project analyzer output has changed
	 * Re-scan the indexer
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexerChanged: function() {
		this.trace("Project analysis ready");
		this.manageDesignerButton();
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
		for (var i=0, p; (p=c.superkinds[i]); i++) {
			h.push(p);
		}
		h$ += "<h4>Extends</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		h = [];
		for (i=0, p; (p=c.components[i]); i++) {
			h.push(p.name);
		}
		if (h.length) {
			h$ += "<h4>Components</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		}
		//
		h = [];
		for (i=0, p; (p=c.properties[i]); i++) {
			h.push(p.name);
		}
		h$ += "<h4>Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		h = [];
		for (i=0, p; (p=c.allProperties[i]); i++) {
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
		} // else - The error has been displayed by extractKindsData()
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
			var nbKinds = 0;
			var errorMsg;
			var i, o;
			for (i=0; i < this.analysis.objects.length; i++) {
				o = this.analysis.objects[i];
				if (o.type !== "kind") {
					errorMsg = $L("Ares does not support methods out of a kind. Please place '" + o.name + "' into a separate .js file");
				} else {
					nbKinds++;
				}
			}
			if (nbKinds === 0) {
				errorMsg = $L("No kinds found in this file");
			}
			if (errorMsg) {
				this.showErrorPopup(errorMsg);
				return [];
			}

			for (i=0; i < this.analysis.objects.length; i++) {
				o = this.analysis.objects[i];
				var start = o.componentsBlockStart;
				var end = o.componentsBlockEnd;
				var name = o.name;
				var kind = o.superkind;
				var comps = [];
				if (start && end) {
					var js = c.substring(start, end);
					/* jshint evil: true */
					comps = eval("(" + js + ")"); // TODO: ENYO-2074, replace eval. Why eval? Because JSON.parse doesn't support unquoted keys... 
					/* jshint evil: false */
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
						var value = analyzer.Documentor.stripQuotes(prop.value[0].name);
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
		try {
			this.helper.setDefinition(object);
			return this.helper.listHandlers(declared);
		} catch(error) {
			enyo.log("Unexpected error: " + error);		// TODO TBC
		}
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
			this.$.savePopup.setName("Document was modified!");
			this.$.savePopup.setMessage("\""+ this.docData.getFile().path + "\" was modified.<br/><br/>Save it before closing?");
			this.$.savePopup.setActionButton("Don't Save");
			this.$.savePopup.show();
		} else {
			var id = this.docData.getId();
			this.beforeClosingDocument();
			this.doCloseDocument({id: id});
			this.closeNextDoc();
		}
		return true; // Stop the propagation of the event
	},
	closeAllDocAction: function(inSender, inEvent) {
		this.closeAll = true;
		this.closeNextDoc();
		return true; // Stop the propagation of the event
	},
	closeNextDoc: function() {
		if(this.docData && this.closeAll) {
			this.closeDocAction(this);
		} else {
			this.closeAll = false;
		}
	},
	cancelClose: function(inSender, inEvent) {
		this.closeAll = false;
	},	
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		var docData = this.docData;
		this.beforeClosingDocument();
		this.doCloseDocument({id: docData.getId()});
		this.closeNextDoc();
	},	
	docChanged: function(inSender, inEvent) {
		this.docData.setEdited(true);

		this.trace("data:", enyo.json.stringify(inEvent.data));

		if (this.analysis) {
			// Call the autocomplete component
			this.$.autocomplete.start(inEvent);
		}
		return true; // Stop the propagation of the event
	},
	cursorChanged: function(inSender, inEvent) {
		var position = this.$.ace.getCursorPositionInDocument();
		this.trace(inSender.id, " ", inEvent.type, " ", enyo.json.stringify(position));

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
		this.setProjectData(null);
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
	toggleww: function(){
	    if(this.$.ace.wordWrap === "true" || this.$.ace.wordWrap === true){
			this.$.ace.wordWrap = false;
			this.$.ace.wordWrapChanged();
	    }else{
			this.$.ace.wordWrap = true;
			this.$.ace.wordWrapChanged();
		}
	},

	/*  editor setting */

	editorSettings: function() {
		this.$.editorSettingsPopup.show();
	},

	closeEditorPop: function(){

		this.$.editorSettingsPopup.initSettingsPopupFromLocalStorage();
		//apply changes only saved on Ace
		this.$.ace.applyAceSettings(this.$.editorSettingsPopup.getSettings());
		this.adjustPanelsForMode(this.docData.getMode(), this.$.editorSettingsPopup.getSettings().rightpane);
		this.$.editorSettingsPopup.hide();
	},

	//showing =
	changeRightPane: function(){
		this.adjustPanelsForMode(this.docData.getMode(), this.$.editorSettingsPopup.getPreviewSettings().rightpane);
	},

	applySettings:function(){
		//apply Ace settings
		this.$.ace.applyAceSettings(this.$.editorSettingsPopup.getPreviewSettings());
	},

	tabSize: function() {
		var ts = this.$.ace.editorSettingsPopup.Tsize;
		this.$.ace.setTabSize(ts);
	},
	
	fkeypressed: function(inSender, inEvent) {
		var key = inEvent;
		this.$.ace.insertAtCursor(this.$.editorSettingsPopup.settings.keys[ key ]);
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
		} // else - The error has been displayed by extractKindsData()
	}
});

enyo.kind({
	name: "rightPanels",kind: "Panels", wrap: false, draggable:false,
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

enyo.kind({
	name: "saveActionPopup",
	kind: "Ares.ActionPopup",
	events:{
		onSave: "",
		onCancel: ""
	},
	create: function() {
		this.inherited(arguments);
		this.$.message.allowHtml = true;
		this.$.buttons.createComponent(
			{name:"saveButton", kind: "onyx.Button", content: "Save", ontap: "save"},
			{owner: this}
		);
	},
	actionCancel: function(inSender, inEvent) {
        this.inherited(arguments);
        this.doCancel();
    },
	save: function(inSender, inEvent) {
		this.hide();
		this.doSave();
	}
});
