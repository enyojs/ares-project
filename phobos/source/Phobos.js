/* jshint indent: false */ // TODO: ENYO-3311
/*global analyzer, ares, enyo, $L, ProjectCtrl */

enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{name: "body", fit: true, kind: "FittableColumns", components: [
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "enyo-fit ares_phobos_panel border ", components: [
						{kind: "Ace", classes: "enyo-fit ace-code-editor", onChange: "docChanged", onCursorChange: "cursorChanged", onAutoCompletion: "startAutoCompletion", onFind: "findpop", onScroll: "handleScroll", onWordwrap: "toggleww", onFkey: "fkeypressed"},
						{name: "imageViewer", kind: "enyo.Image"}
					]}
				]},
				{name: "right", kind: "rightPanels", showing: false, classes: "ares_phobos_right", arrangerKind: "CardArranger"}
			]}
		]},
		{name: "savePopup", kind: "saveActionPopup", onConfirmActionPopup: "abandonDocAction", onSaveActionPopup: "saveBeforeClose", onCancelActionPopup: "cancelClose"},
		{name: "savePopupPreview", kind: "saveActionPopup", onConfirmActionPopup: "abandonDocActionOnPreview", onSaveActionPopup: "saveBeforePreviewAction", onCancelActionPopup: "cancelAction"},
		{name: "saveAsPopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, headerText: $L("Save as..."), folderChooser: false, allowCreateFolder: true, allowNewFile: true, allowToolbar: true},
		{name: "overwritePopup", kind: "Ares.ActionPopup", title: $L("Overwrite"), message: $L("Overwrite existing file?"), actionButton: $L("Overwrite") },
		{name: "autocomplete", kind: "Phobos.AutoComplete"},
		{name: "findpop", kind: "FindPopup", centered: true, modal: true, floating: true, onFindNext: "findNext", onFindPrevious: "findPrevious", onReplace: "replace", onReplaceAll:"replaceAll", onHide:"doAceFocus", onClose: "findClose", onReplaceFind: "replacefind"},
		{name: "editorSettingsPopup", kind: "EditorSettings", classes: "enyo-unselectable", centered: true, modal: true, floating: true, autoDismiss: false,
		onChangeSettings:"applySettings", onChangeRightPane: "changeRightPane", onClose: "closeEditorPop", onTabSizsChange: "tabSize"}
	],
	events: {
		onHideWaitPopup: "",
		onSaveDocument: "",
		onSaveAsDocument: "",
		onDesignDocument: "",
		onError: "",
		onCloseDocument: "",
		onUpdate: "",
		onRegisterMe: "",
		onDisplayPreview: "",
		onSwitchFile: "",
		onFileEdited: " ",
		onAceFocus: ""
	},
	handlers: {
		onCss: "newcssAction",
		onReparseAsked: "reparseAction",
		onInitNavigation: "initNavigation",
		onNavigateInCodeEditor: "navigateInCodeEditor"
	},
	published: {
		projectData: null,
		objectsToDump: []
	},
	editedDocs:"",
	injected: false,
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
		// create projectCtrl only when needed. In any case, there's only
		// one Phobos and one projectCtrl in Ares
		this.projectCtrl = this.projectData.getProjectCtrl();
		if ( ! this.projectCtrl) {
			this.projectCtrl = new ProjectCtrl({projectData: this.projectData});
			// wire event propagation from there to Phobos
			this.projectCtrl.setOwner(this);
			this.projectData.setProjectCtrl(this.projectCtrl);
		}
	},
	saveDocAction: function() {
		this.warn("obsolete");
		this.owner.showWaitPopup($L("Saving ..."));
		this.doSaveDocument({content: this.$.ace.getValue(), file: this.docData.getFile()});
		this.doAceFocus();
		return true;
	},
	saveNeeded: function() {
		return this.docData.getEdited();
	},
	saveAsDocAction: function() {
		var file = this.docData.getFile();
		this.$.saveAsPopup.connectProject(this.docData.getProjectData(), (function() {
			var path = file.path;
			var relativePath = path.substring(path.indexOf(this.projectData.id) + this.projectData.id.length, path.length);
			this.$.saveAsPopup.pointSelectedName(relativePath, true);
			this.$.saveAsPopup.setFileChosenCallback(this.saveAsFileChosen.bind(this));
			this.$.saveAsPopup.show();
		}).bind(this));
	},
	saveAsFileChosen: function(param) {
		this.trace(param);
		
		if (param.file) {
			this.$.saveAsPopup.$.hermesFileTree
				.checkNodeName(param.name, this.requestOverwrite.bind(this,param));
		}
		else {
			// no file or folder chosen
			this.doAceFocus();
		}
	},
	requestOverwrite: function(param,willClobber) {
		var owp = this.$.overwritePopup;
		if (willClobber) {
			owp.setActionCallback(this.saveAsConfirm.bind(this, null, {data: param}));
			owp.setCancelCallback(this.doAceFocus.bind(this));
			owp.show();
		} else {
			this.saveAsConfirm(null, {data: param});
		}
	},

	/** @private */
	saveAsConfirm: function(inSender, inData){
		this.trace(inSender, "=>", inData);
		
		var data = inData.data;
		var relativePath = data.name.split("/");
		var name = relativePath[relativePath.length-1];
		
		this.owner.showWaitPopup($L("Saving ..."));
		this.doSaveAsDocument({
			docId: this.docData.getId(),
			projectData: this.docData.getProjectData(),
			file: data.file,
			name: name,
			content: this.$.ace.getValue(),
			next: (function(err) {
				this.hideWaitPopup();
				if (typeof data.next === 'function') {
					data.next();
				}
			}).bind(this)
		});

		return true; //Stop event propagation
	},
	saveBeforeClose: function(){
		this.saveDocAction();
		var id = this.docData.getId();
		this.beforeClosingDocument();
		this.doCloseDocument({id: id});
		this.closeNextDoc();
		return true;
	},
	openDoc: function(inDocData) {
		// If we are changing documents, reparse any changes into the current projectIndexer
		if (this.docData && this.docData.getEdited()) {
			this.reparseUsersCode(true);
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
			var config = this.projectData.getService().getConfig();
			var fileUrl = config.origin + config.pathname + "/file" + file.path;
			this.$.imageViewer.setAttribute("src", fileUrl);
		}
		this.manageDesignerButton();
		this.reparseUsersCode(true);
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
				designerDecorator: true,
				right: rightpane
			},
			image: {
				imageViewer: true,
				ace: false,
				saveButton: false,
				saveAsButton: false,
				newKindButton: false,
				designerDecorator: false,
				right: false
			},
			text: {
				imageViewer: false,
				ace: true,
				saveButton: true,
				saveAsButton: true,
				newKindButton: false,
				designerDecorator: false,
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
			} else if (this.owner.$.editorFileMenu.$[stuff] !== undefined && this.owner.$.designerFileMenu.$[stuff] !== undefined) {
				var editorFileMenu = this.owner.$.editorFileMenu.$[stuff];
				var designerFileMenu = this.owner.$.designerFileMenu.$[stuff];
				if (typeof editorFileMenu.setShowing === 'function' && typeof designerFileMenu.setShowing === 'function') {
					editorFileMenu.setShowing(showStuff);
					designerFileMenu.setShowing(showStuff);
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
		this.resizeHandler();
		return showSettings.ace ;
	},
	hideWaitPopup: function() {
		this.doHideWaitPopup();
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
	 *	Enable "Designer" button only if project & enyo index are both valid
	 */
	manageDesignerButton: function() {
		this.owner.enableDesignerButton( this.projectCtrl.fullAnalysisDone );
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
		var h = [];
		this.$.right.setDumpCount(0);
		if (!inObject || !inObject.superkinds) {
			h.push("no content");
			this.objectsToDump = h;
			this.$.right.setDumpCount(this.objectsToDump.length);
			return;
		}
		var c = inObject;
		h.push(c.name);
		h.push("Extends");
		for (var i=0, p; (p=c.superkinds[i]); i++) {
			p = {name: c.superkinds[i], isExtended: true};
			h.push(p);
		}
		if (c.components.length) {
			h.push("Components");
			for (i=0, p; (p=c.components[i]); i++) {
				h.push(p); 
			}
		}
		h.push("Properties");
		for (i=0, p; (p=c.properties[i]); i++) {
			h.push(p);
		}
		this.objectsToDump = h;
		this.$.right.setDumpCount(this.objectsToDump.length);
	},
	// invoked by reparse button in right panel (the file index)
	reparseAction: function(inSender, inEvent) {
		this.reparseUsersCode(true);
	},
	initNavigation: function(inSender, inEvent) {
		var item = inEvent.item.$.item,
			index = inEvent.item.index,
			object = this.objectsToDump[index];
		if (object.isExtended){
			item.setFixedItem(object.name);	
		} else if (object.name){
			item.setNavigateItem(object.name);
		} else {
			item.setTitle(object);
		}
		item.setIndex(index);
		return true;
	},
	navigateInCodeEditor: function(inSender, inEvent) {
		var itemToSelect = this.objectsToDump[inEvent.index];
		if(itemToSelect.start && itemToSelect.end){
			this.$.ace.navigateToPosition(itemToSelect.start, itemToSelect.end);
			this.doAceFocus();
		}
	},
	//* Updates the projectIndexer (notifying watchers by default) and resets the local analysis file
	reparseUsersCode: function(inhibitUpdate) {
		var mode = this.docData.getMode();
		var codeLooksGood = false;
		var module = {
			name: this.docData.getFile().name,
			code: this.$.ace.getValue(),
			path: this.projectCtrl.projectUrl + this.docData.getFile().dir + this.docData.getFile().name
		};
		this.trace("called with mode " + mode + " inhibitUpdate " + inhibitUpdate
				   + " on " + module.name);
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

					codeLooksGood = true;
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
		return codeLooksGood ;
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
		this.reparseUsersCode();
		
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
		var c = this.$.ace.getValue(),
			kinds = [];

		if (this.analysis) {
			var nbKinds = 0;
			var errorMsg;
			var i, o;
			var oLen = this.analysis.objects.length;
			for (i=0; i < oLen; i++) {
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
				this.doError({msg: errorMsg});
				return [];
			}

			for (i=0; i < oLen; i++) {
				o = this.analysis.objects[i];
				var start = o.componentsBlockStart;
				var end = o.componentsBlockEnd;
				var kindBlock = enyo.json.codify.from(c.substring(o.block.start, o.block.end));
				var name = o.name;
				var kind = kindBlock.kind || o.superkind;
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
					var value = this.verifyValueType(analyzer.Documentor.stripQuotes(prop.value[0].name));
					if ((start === undefined || prop.start < start) && pName !== "components") {
						if (value === "{" || value === "[" || value === "function") {
							comp[pName] = kindBlock[pName];
						} else {
							comp[pName] = value;
						}
					}
				}
				kinds.push(comp);
			}
		}
		return kinds;
	},
	/**
	 * Converts string representation of boolean values
	 * to boolean
	 * TODO: Verify false-positives (ex: strings meant to be strings)
	 * @param inProps: the value to match
	 * @returns boolean value if match found: inValue if no matches
	 * @protected
	 */
	verifyValueType: function(inValue) {
		if (inValue === "true") {
			inValue = true;
		} else if (inValue === "false") {
			inValue = false;
		}
		return inValue;
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
			this.reparseUsersCode(true);

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
			this.reparseUsersCode(true);
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
		this.injected = true;
		for( var i = this.analysis.objects.length -1 ; i >= 0 ; i-- ) {
			if (inEvent.contents[i]) {
				// Insert the new version of components (replace components block, or insert at end)
				var obj = this.analysis.objects[i];
				var content = inEvent.contents[i];
				var start = obj.componentsBlockStart;
				var end = obj.componentsBlockEnd;
				var kindStart = obj.block.start;
				if (!(start && end)) {
					// If this kind doesn't have a components block yet, insert a new one
					// at the end of the file
					var last = obj.properties[obj.properties.length-1];
					if (last) {
						content = (last.commaTerminated ? "" : ",") + "\n\t" + "components: []";
						kindStart = obj.block.end - 2;
						end = obj.block.end - 2;
					}
				}
				// Get the corresponding Ace range to replace the component definition
				// NB: ace.replace() allow to use the undo/redo stack.
				var range = this.$.ace.mapToLineColumnRange(kindStart, end);
				this.$.ace.replaceRange(range, content);
			}
		}
		this.injected = false;
		/*
		 * Insert the missing handlers
		 * NB: reparseUsersCode() is invoked by insertMissingHandlers()
		 */
		this.insertMissingHandlers();
		//file is edited if only we have a difference between stored file data and editor value
		if(this.getEditorContent().localeCompare(this.docData.getData())!==0){
			this.docData.setEdited(true);
			this.doFileEdited();
		}
	},
	closeDocAction: function(inSender, inEvent) {
		this.warn("obsolete");
		if (this.docData.getEdited() === true) {
			this.showSavePopup("savePopup",'"' + this.docData.getFile().path + '" was modified.<br/><br/>Save it before closing?');
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
		this.cancelAction();
	},
	cancelAction: function(inSender, inEvent) {
		this.warn("obsolete");
		this.doAceFocus();
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.warn("obsolete");
		this.$.savePopup.hide();
		var docData = this.docData;
		this.beforeClosingDocument();
		this.doCloseDocument({id: docData.getId()});
		this.closeNextDoc();
	},
	/**
	* @protected
	*/
	showSavePopup: function(componentName, message){
		this.warn("obsolete");
		this.$[componentName].setTitle($L("Document was modified!"));
		this.$[componentName].setMessage(message);
		this.$[componentName].setActionButton($L("Don't Save"));
		this.$[componentName].show();
	},	
	/** 
	* @protected
	*/
	saveDocumentsBeforePreview: function(editedDocs){
		this.editedDocs = editedDocs;
		this.saveNextDocument();
	},
	/**
	* @protected
	*/
	saveNextDocument: function(){
		if(this.editedDocs.length >= 1){
			var docData = this.editedDocs.pop();
			this.openDoc(docData);
			this.doSwitchFile({id:docData.id});
			this.showSavePopup("savePopupPreview",'"' + this.docData.getFile().path + '" was modified.<br/><br/>Save it before preview?');
		}else{
			this.doAceFocus();
			this.doDisplayPreview();
		}
		return true;
	},
	/**
	* Called when save button is selected in save popup shown before preview action
	* @protected
	*/
	saveBeforePreviewAction: function(inSender, inEvent){
		this.saveDocAction();
		this.saveNextDocument();
		return true;
	},
	/**
	* Called when don't save button is selected in save popup shown before preview action
	* @protected
	*/
	abandonDocActionOnPreview: function(inSender, inEvent) {
		this.$.savePopup.hide();
		this.doAceFocus();
		this.saveNextDocument();
	},
	docChanged: function(inSender, inEvent) {
		//this.injected === false then modification coming from user
		if(!this.injected && !this.docData.getEdited()){
			this.docData.setEdited(true);
			this.doFileEdited();
		}

		this.trace("data:", enyo.json.stringify(inEvent.data));

		if (this.analysis) {
			// Call the autocomplete component
			this.$.autocomplete.start(inEvent);
		}
		return true; // Stop the propagation of the event
	},
	editorUserSyntaxError:function(){
		var userSyntaxError = [];		
		userSyntaxError = this.$.autocomplete.ace.editor.session.$annotations.length;
		return userSyntaxError;
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
	closeSession: function() {
		// FIXME: remove this test once all close stuff is moved to EnyoEditor
		if (this.docData) {
			this.$.ace.destroySession(this.docData.getAceSession());
			this.resetAutoCompleteData();
		}
	},
	beforeClosingDocument: function() {
		this.warn('obsolete');
		this.$.ace.destroySession(this.docData.getAceSession());
		// NOTE: docData will be clear when removed from the Ares.Workspace.files collections
		this.resetAutoCompleteData();
		this.docData = null;
		this.setProjectData(null);
	},
	// Show Find popup
	findpop: function(){
		var selected = this.$.ace.getSelection();
		if(selected){
			this.$.findpop.setFindInput(selected);
		} 
		this.$.findpop.removeMessage();
		this.$.findpop.disableReplaceButtons(true);
		this.$.findpop.show();
		return true;
	},
	findNext: function(inSender, inEvent){
		var options = {backwards: false, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.find(this.$.findpop.findValue, options);
		this.$.findpop.updateAfterFind(this.$.ace.getSelection());
	},

	findPrevious: function(){
		var options = {backwards: true, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.find(this.$.findpop.findValue, options);
		this.$.findpop.updateAfterFind(this.$.ace.getSelection());
	},

	replaceAll: function(){
		var occurences = this.$.ace.replaceAll(this.$.findpop.findValue , this.$.findpop.replaceValue);
		this.$.findpop.updateMessage(this.$.ace.getSelection(), occurences);
	},
	replacefind: function(){
		var options = {backwards: false, wrap: true, caseSensitive: false, wholeWord: false, regExp: false};
		this.$.ace.replacefind(this.$.findpop.findValue , this.$.findpop.replaceValue, options);
		this.$.findpop.updateMessage(this.$.ace.getSelection());
	},

	//ACE replace doesn't replace the currently-selected match. It instead replaces the *next* match. Seems less-than-useful
	//It was not working because ACE(Ace.js) was doing "find" action before "replace".
	replace: function(){
		this.$.ace.replace(this.$.findpop.findValue, this.$.findpop.replaceValue);
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
	/** @public */
	requestSelectedText: function() {
		return this.$.ace.requestSelectedText();
	},
	
	/**
	 * Add a new kind (requested from the designer)
	 * A switch to the designer is performed to fully reload the kinds in the designer.
	 * @param config 
	 * @public
	 */
	addViewKindAction: function(config) {
		var newKind = 'enyo.kind('+config+'\n);';
		this.$.ace.insertAtEndOfFile(newKind, '@cursor@');
		this.designerAction();
	},
	/**
	 * Insert a new kind (requested from the designer)
	 * A switch to the designer is performed to fully reload the kinds in the designer.
	 * @param kind_index, config 
	 * @public
	 */
	replaceViewKindAction: function(kind_index, config){
		var obj = this.analysis.objects[kind_index];
		var range = this.$.ace.mapToLineColumnRange(obj.block.start, obj.block.end);
		this.$.ace.replaceRange(range, config);
		this.designerAction();
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
		this.doAceFocus();
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
		this.reparseUsersCode(true);
		
		var data = {kinds: this.extractKindsData(), projectData: this.projectData, fileIndexer: this.analysis};
		if (data.kinds.length > 0) {
			this.doUpdate(data);
		} // else - The error has been displayed by extractKindsData()
	},
	resizeHandler: function() {
		this.inherited(arguments);
		this.$.body.reflow();
		this.$.ace.resize();
	}
});

enyo.kind({
	name: "rightPanels", kind: "Panels", wrap: false, draggable:false,
	events: {
		onCss: "",
		onReparseAsked: "",
		onInitNavigation: "",
		onNavigateInCodeEditor: ""
	},
	components: [
		{// right panel for JSON goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit", components: [
			{name: "right", classes: "enyo-fit ares_phobos_panel border", components: [
				{kind: "onyx.Button", content: "Reparse",  ontap: "doReparseAsked"},
				{kind: "enyo.Scroller", classes: "enyo-fit ace-helper-panel",components: [
					{tag:"ul", kind: "enyo.Repeater", name: "dump", onSetupItem: "sendInitHelperReapeter", ontap: "sendNavigate", components: [
						{tag:"li", classes:"ace-helper-list", kind:"RightPanel.Helper", name: "item"}
					]}
				]}
			]}
		]},
		{// right panel for HTML goes here
		},
		{kind: "enyo.Control", classes: "enyo-fit",	components: [ // right panel for CSS here
			{kind: "cssBuilder", classes: "enyo-fit ares_phobos_panel border", onInsert: "test"}
		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	test: function(inEvent) {
		this.doCss(inEvent);
	},
	sendInitHelperReapeter: function(inSender, inEvent) {
		this.doInitNavigation({item: inEvent.item});
	},
	sendNavigate: function(inSender, inEvent){
		this.doNavigateInCodeEditor({index:inEvent.index});
	},
	setDumpCount: function(count){
		this.$.dump.setCount(count);
	}
});

enyo.kind({
	name: "RightPanel.Helper",
	published: {
		title: "",
		fixedItem: "",
		navigateItem: "",
		index: -1
	},
	components: [
		{name: "title", classes: "ace-title"},
		{name: "fixedItem", classes: "ace-fixed-item"},
		{name: "navigateItem", kind: "control.Link", classes: "ace-navigate-item"}
	],
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	fixedItemChanged: function() {
		this.$.fixedItem.setContent(this.fixedItem);
	},
	navigateItemChanged: function() {
		this.$.navigateItem.setContent(this.navigateItem);
	}
});
