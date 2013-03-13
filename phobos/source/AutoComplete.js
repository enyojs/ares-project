enyo.kind({
	name : "Phobos.AutoComplete",
	kind : "onyx.Popup",
	centered : false,
	floating : true,
	autoDismiss : false,
	modal : false,
	classes: "ares_phobos_autocomp",
	published: {
		ace: null,
		analysis: null,
		projectData: null,
		projectIndexer: null
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
	handlers: {
		onHide: "hideAutocompletePopup"
	},
	// Constants
	AUTOCOMP_THIS: 'this.',
	AUTOCOMP_THIS_DOLLAR: 'this.$.',
	AUTOCOMP_ENYO: "enyo.",
	AUTOCOMP_ONYX: "onyx.",
	debug: false,
	input: "",
	suggestions: null,				// List of suggestion to display in the popup
	suggestionsEnyo: null,
	suggestionsOnyx: null,
	localKinds: {},					// The kinds defined in the currently edited file
	kindName: "",
	popupShown: false,
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * The ace instance has been changed.
	 * We register the commands needed for auto-completion
	 * @protected
	 */
	aceChanged: function() {
		var ace = this.ace;
		ace.addCommand({
			name: "Up",
			bindKey: {win: "Up", mac: "Up"},
			exec: enyo.bind(this, "cursorUp")
		});

		ace.addCommand({
			name: "Down",
			bindKey: {win: "Down", mac: "Down"},
			exec: enyo.bind(this, "cursorDown")
		});

		ace.addCommand({
			name: "Return",
			bindKey: {win: "Return", mac: "Return"},
			exec: enyo.bind(this, "keyReturn")
		});

		ace.addCommand({
			name: "Escape",
			bindKey: {win: "ESC", mac: "ESC"},
			exec: enyo.bind(this, "keyEscape")
		});
	},
	/**
	 * Starts auto-completion or refine suggestion list based on changes done by the user (insert/remove)
	 * @param  inEvent coming from ACE
	 * @public
	 */
	start: function(inEvent) {
		var suggestions = new Phobos.Suggestions(), go = false;
		if (this.analysis && this.analysis.objects && this.analysis.objects.length > 0) {

			if (this.popupShown) {
				// The auto-completion is started. Take into account user input to refine the suggestions
				if (inEvent.data) {
					this.processChanges(inEvent);
				}
			} else {
				this.debug && this.log("Auto-Completion needed ? - " + (inEvent && JSON.stringify(inEvent.data)));
				
				// Retrieve the kind name for the currently edited file
				this.kindName = this.analysis.objects[this.analysis.currentObject].name;
				this.debug && this.log("Current Kind Name: "+this.kindName);
				
				if (inEvent) {
					// Check if a '.' was inserted and see if we need to show-up the auto-complete popup
					var data = inEvent.data;
					if (data && data.action === 'insertText') {
						var last = data.text.substr(data.text.length - 1);
						if (last === ".") { // Check that last entered char is a '."
							go = true;	// We need to check further
						}
					}
				} else {
					// Triggered by a Ctrl-Space coming from the user
					go = true;		// We need to check further
				}

				// We can check further
				if (go === true) {
					if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_THIS_DOLLAR)) {
						suggestions = this.fillSuggestionsThisDollar(suggestions);
					}

					if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_THIS)) {
						suggestions = this.fillSuggestionsDoEvent(this.kindName, suggestions);
						suggestions = this.fillSuggestionsGettersSetters(this.kindName, suggestions);
						suggestions = this.fillSuggestionsProperties(this.kindName, suggestions);
					}

					if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_ENYO)) {
						suggestions = this.fillSuggestionsEnyo(suggestions);
					}

					if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_ONYX)) {
						suggestions = this.fillSuggestionsOnyx(suggestions);
					}

					this.buildLevel2Suggestions(inEvent, suggestions);
				}
				
				if (suggestions.getCount() > 0) {	// Some suggestions were found.
					this.input = "";		// Reset the characters typed while the autocompletion popup is up
					this.suggestions = suggestions.getSortedSuggestions();
					this.showAutocompletePopup();
				}
			}
		}
	},
	/**
	 * Check if we need to propose auto-completion for the pattern
	 * passed as a parameter
	 * @param inEvent coming from ACE
	 * @param pattern
	 * @returns true if auto-completion is possible
	 * @protected
	 */
	isCompletionAvailable: function(inEvent, pattern) {
		this.debug && this.log("for " + pattern);
		var line, last, popupPosition, len;
		if (inEvent) {	// Triggered by a '.' inserted by the user
			popupPosition = inEvent.data.range.end;
		} else {	// Triggered by a Ctrl-Space coming from the user
			popupPosition = this.ace.getCursorPositionInDocument();
		}

		// Get the line and the last character entered
		line = this.ace.getLine(popupPosition.row);
		len = pattern.length;
		last = line.substr(popupPosition.column - len, len);
		this.debug && this.log("last >>" + last + " <<");
		
		// Check if it's part of a pattern string
		if (last === pattern) {
			this.popupPosition = popupPosition;
			this.debug && this.log("Completion available for " + pattern);
			return true;
		}
		return false;			// Nothing to auto-complete
	},
	/**
	 * Checks and adds suggestions macthing the case 'this.$.*.*'
	 * @param inEvent coming from ACE
	 * @param  {Phobos.Suggestions} suggestions
	 * @protected
	 */
	buildLevel2Suggestions: function(inEvent, suggestions) {
		var line, last, popupPosition, len, pattern;
		if (inEvent) {	// Triggered by a '.' inserted by the user
			popupPosition = inEvent.data.range.end;
		} else {	// Triggered by a Ctrl-Space coming from the user
			popupPosition = this.ace.getCursorPositionInDocument();
		}

		// Get the line and the last character entered
		line = this.ace.getLine(popupPosition.row);
		
		// Find the name of the components
		for(var i = 0, o; o = this.analysis.objects[this.analysis.currentObject].components[i]; i++) {
			pattern = this.AUTOCOMP_THIS_DOLLAR + o.name + ".";
			len = pattern.length;
			last = line.substr(popupPosition.column - len, len);
			this.debug && this.log("last >>" + last + "<<");

			// Check if it's part of a pattern string
			if (last === pattern) {
				this.popupPosition = popupPosition;
				this.debug && this.log("Completion available for " + pattern + " kind: " + o.kind);
		
				this.fillSuggestionsDoEvent(o.kind, suggestions);
				this.fillSuggestionsGettersSetters(o.kind, suggestions);
				this.fillSuggestionsProperties(o.kind, suggestions);
				return;
			}
		}
		return;			// Nothing to auto-complete
	},
	/**
	 * Add suggestions for 'this.$.*'
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsThisDollar: function(suggestions) {
		enyo.forEach(this.analysis.objects[this.analysis.currentObject].components, function(a) {
			suggestions.addItem({name: a.name});
		});
		return suggestions;
	},
	/**
	 * Add suggestions for 'this.do*'
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsDoEvent: function(kindName, suggestions) {
		var definition, obj, p, i, name;
		// retrieve the kindName definition
		definition = this.getKindDefinition(kindName);

		if (definition !== undefined) {
			// this.do* - event trigger when within the current kind definition
			this.debug && this.log("Adding doXXX for " + kindName);
			obj = definition.properties;
			for (i=0; i<obj.length; i++) {
				if (obj[i].token === "events") {
					p = obj[i].value[0].properties;
					for (var j=0; j < p.length; j++) {
						name = p[j].name.trim().replace('on', 'do');
						suggestions.addItem({name: name, kind: kindName});
					}
				}
			}
			// support firing super-kind events as well
			return this.fillSuggestionsDoEvent(definition.superkind, suggestions);
		}
		return suggestions;
	},
	/**
	 * Add getters and setters suggestions for published properties
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsGettersSetters: function(kindName, suggestions) {
		var definition, obj, p, i, name;
		// retrieve the kindName definition
		definition = this.getKindDefinition(kindName);

		if (definition !== undefined) {
			// support setXXX and getXXX for published properties when within the current kind definition
			this.debug && this.log("Adding getters/setters for " + kindName);
			obj = definition.properties;
			for (i=0; i<obj.length; i++) {
				if (obj[i].token === "published") {
					p = obj[i].value[0].properties;
					for (var j=0; j < p.length; j++) {
						name = 'set' + p[j].name.substr(0, 1).toUpperCase() + p[j].name.substr(1).trim();
						suggestions.addItem({name: name, kind: kindName});
						name = 'get' + p[j].name.substr(0, 1).toUpperCase() + p[j].name.substr(1).trim();
						suggestions.addItem({name: name, kind: kindName});
					}
				}
			}
			// support super-kind published properties
			return this.fillSuggestionsGettersSetters(definition.superkind, suggestions);
		}
		return suggestions;
	},
	/**
	 * Add suggestions for the properties of the kind
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsProperties: function(kindName, suggestions) {
		var definition, obj, i, name;
		// retrieve the kindName definition
		definition = this.getKindDefinition(kindName);

		if (definition !== undefined) {
			// support functions, handlers published when within the current kind definition
			this.debug && this.log("Adding properties for " + kindName);
			obj = definition.allProperties;
			for (i=0; i<obj.length; i++) {
				if (obj[i].value[0].token === "function") {
					name = obj[i].name;
					suggestions.addItem({name: name, kind: kindName});
				}
			}
			// support super-kind published/properties/functions
			return this.fillSuggestionsProperties(definition.superkind, suggestions);
		}
		return suggestions;
	},
	/**
	 * Add suggestions for enyo functions and kinds
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsEnyo: function(suggestions) {
		return suggestions.concat(this.suggestionsEnyo);
	},
	/**
	 * Add suggestions for onyx functions and kinds
	 * @param  {Phobos.Suggestions} suggestions: the current suggestions
	 * @return {Phobos.Suggestions} the updated suggestions
	 * @protected
	 */
	fillSuggestionsOnyx: function(suggestions) {
		return suggestions.concat(this.suggestionsOnyx);
	},
	/**
	 * Finalyze the suggestion list based on user inputs and
	 * display the auto-complete popup at the right place
	 * @protected
	 */
	showAutocompletePopup: function() {
		this.fillSuggestionList();		// Fill-up the auto-completion list
		
		var select = this.$.autocompleteSelect;
		select.nbEntries = select.controls.length;
		if (select.nbEntries > 0) {
			var size = Math.max(2, Math.min(select.nbEntries, 10));
			if (this.debug) this.log("Nb entries: " + select.nbEntries + " Shown: " + size);
			select.setAttribute("size", size);
			select.setSelected(0);
			select.render();

			// Compute the position of the popup
			var ace = this.ace;
			var pos = ace.textToScreenCoordinates(this.popupPosition.row, this.popupPosition.column);
			pos.pageY += ace.getLineHeight(); // Add the font height to be below the line

			// Position the autocomplete popup
			this.applyStyle("top", pos.pageY + "px");
			this.applyStyle("left", pos.pageX + "px");
			this.show();
			this.popupShown = true;
		} else {
			this.hideAutocompletePopup();
		}
	},
	/**
	 * Finalyze the suggestion list based on user inputs
	 * @protected
	 */
	fillSuggestionList: function() {
		var select = this.$.autocompleteSelect;
		// Fill-up the auto-completion list from this.suggestions with filtering based on this.input
		select.destroyComponents();
		var input = this.input;
		if (this.debug) this.log("Preparing suggestions list, input: >>" + input + "<< + count " + this.suggestions.length);
		enyo.forEach(this.suggestions, function(item) {
			var name = item.name;
			if (input.length === 0) {
				select.createComponent({content: name});
			} else {
				if (name.indexOf(input) === 0) {
					select.createComponent({content: name});
				}
			}
		}, this);
	},
	/**
	 * Hide the auto-completion popup
	 * @protected
	 */
	hideAutocompletePopup: function() {
		this.popupShown = false;
		this.hide();
		this.ace.focus();
		return true; // Stop the propagation of the event
	},
	/**
	 * Validates the user selection and inserts the corresponding
	 * text into the editor.
	 * @protected
	 */
	autocompleteChanged: function() {
		// Insert the selected value
		this.hide();
		var ace = this.ace;
		var selected = this.$.autocompleteSelect.getValue();
		selected = selected.substr(this.input.length);
		var pos = enyo.clone(this.popupPosition);
		pos.column += this.input.length;
		this.debug && this.log("Inserting >>" + selected + "<< at " + JSON.stringify(pos));
		this.ace.insertAt(pos, selected);
		ace.focus();
		return true; // Stop the propagation of the event
	},
	/**
	 * Handles the user input (text insert/delete) to refine the list
	 * of suggestions
	 * @param  inEvent coming from ACE
	 * @protected
	 */
	processChanges: function(inEvent) {
		this.debug && this.log("Auto-Completion update - ", inEvent.data, this.popupPosition);

		var current, data = inEvent.data;
		if (data.action === 'insertText') {
			current = data.range.end;
		} else if (data.action === 'removeText') {
			current = data.range.start;
		} else {
			throw "Unexpected action: " + data.action;
		}

		this.cursorChanged(current);
	},
	/**
	 * Callback called when the cursor position has changed in ACE.
	 * This is used to refine the suggestion list and hide the auto-completion
	 * popup when the suggestion list becomes empty
	 * @param  {Position} current: the current cursor position in the file.
	 * @protected
	 */
	cursorChanged: function(current) {
		if (this.popupShown) {
			if (current.row !== this.popupPosition.row) { 	// Hide if the line has changed
				this.hideAutocompletePopup();
				return;
			}
			var len = current.column - this.popupPosition.column;
			this.debug && this.log("Auto-Completion update - current: " + JSON.stringify(current) + " len: " + len);
			if (len < 0) {		// Hide if current cursor position is before the popup position
				this.hideAutocompletePopup();
				return;
			}

			// Get the line and the last characters entered
			line = this.ace.getLine(current.row);
			this.input = line.substr(this.popupPosition.column, len);
			this.showAutocompletePopup();
		}
	},
	/**
	 * Callback invoked by ACE when the UP arrow is used.
	 * When the auto-completion popup is shown we nagivate thru
	 * the suggestions. Otherwise, the corresponding action
	 * is fowarded to ACE
	 * @protected
	 */
	cursorUp: function() {
		if (this.popupShown) {
			var select = this.$.autocompleteSelect;
			var selected = select.getSelected() - 1;
			if (selected < 0) { selected = select.nbEntries - 1;}
			select.setSelected(selected);
		} else {
			this.ace.navigateUp(1);
		}
	},
	/**
	 * Callback invoked by ACE when the DOWN arrow is used.
	 * When the auto-completion popup is shown we nagivate thru
	 * the suggestions. Otherwise, the corresponding action
	 * is fowarded to ACE
	 * @protected
	 */
	cursorDown: function() {
		if (this.popupShown) {
			var select = this.$.autocompleteSelect;
			var selected = (select.getSelected() + 1) % select.nbEntries;
			select.setSelected(selected);
		} else {
			this.ace.navigateDown(1);
		}
	},
	/**
	 * Callback invoked by ACE when the ESCAPE key is used.
	 * This hides the popup if it's shown.
	 * @protected
	 */
	keyEscape: function() {
		this.hideAutocompletePopup();
	},
	/**
	 * Callback invoked by ACE when the ENTER key is used.
	 * When the auto-completion popup is shown this confirms
	 * the selection which is inserted in the editor.
	 * Otherwise, the corresponding action is fowarded to ACE
	 * @protected
	 */
	keyReturn: function() {
		if (this.popupShown) {
			this.autocompleteChanged();
			this.hideAutocompletePopup();
		} else {
			this.ace.insertAtCursor("\n");
		}
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
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);
			this.projectData.on('update:project-indexer', this.projectIndexerChanged, this);
		}
		if (oldProjectData) {
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
			oldProjectData.off('update:project-indexer', this.projectIndexerChanged);
		}
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, value, options) {
		this.setProjectIndexer(value);
	},
	/**
	 * The current project analyzer output has changed
	 * Re-scan the indexer
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexerChanged: function() {
		this.debug && this.log("Project analysis ready");
		var suggestions, regexp;

		if (this.projectIndexer) {
			// Build the suggestion lists for enyo as the analyzer just finished its job
			suggestions = new Phobos.Suggestions();
			regexp = /^enyo\..*$/;
			suggestions.add(this.projectIndexer.search(this.getFctFilterFn(regexp), this.getMapFn(this.AUTOCOMP_ENYO), this));
			suggestions.add(this.projectIndexer.search(this.getKindFilter(regexp), this.getMapFn(this.AUTOCOMP_ENYO), this));
			this.suggestionsEnyo = suggestions;

			// Build the suggestion lists for onyx as the analyzer just finished its job
			suggestions = new Phobos.Suggestions();
			regexp = /^onyx\..*$/;
			suggestions.add(this.projectIndexer.search(this.getFctFilterFn(regexp), this.getMapFn(this.AUTOCOMP_ONYX), this));
			suggestions.add(this.projectIndexer.search(this.getKindFilter(regexp), this.getMapFn(this.AUTOCOMP_ONYX), this));
			this.suggestionsOnyx = suggestions;
		} else {
			this.suggestionsEnyo = new Phobos.Suggestions();
			this.suggestionsOnyx = new Phobos.Suggestions();
		}
	},
	/**
	 * Callback invoked when the parsing of the currently edited file is done
	 * @protected
	 */
	analysisChanged: function() {
		this.localKinds = {};	// Reset the list of kind for the currently edited file
		if (this.analysis && this.analysis.objects) {
			for(var i = 0, o; o = this.analysis.objects[i]; i++) {
				if (this.localKinds[o.name]) {
					this.log("Kind " + o.name + " is defined at least twice in the same file");	// TODO notify the user
				}
				this.localKinds[o.name] = o;
			}
		}
	},
	/**
	 * Locates the requested kind name based the following priorties
	 * - in the analysis of the currently edited file (most accurate)
	 * - else in the analysis of the project
	 * - else in the analysis of enyo/ares
	 * @param name: the kind to search
	 * @returns the definition of the requested kind or undefined
	 */
	getKindDefinition: function(name) {
		var definition = this.localKinds[name];
		
		if (definition === undefined && this.projectIndexer) {
			// Try to get it from the project analysis
			definition = this.projectIndexer.findByName(name);
			if (definition === undefined) {
				// Try again with the enyo prefix as it is optional
				definition = this.projectIndexer.findByName(this.AUTOCOMP_ENYO + name);
			}
		}
		return definition;
	},
	/**
	 * Filter function used to filter down the functions found by the {Indexer} from lib/extra
	 * This function should be passed to {Indexer.search}
	 * @param  {regexp} regexp: regexp to apply on the name
	 * @return {boolean} false if the object must be rejected
	 */
	getFctFilterFn: function(regexp) {
		return function(o) {
			return (o.type === 'function') && (o.group === 'public') && regexp.test(o.name);
		};
	},
	/**
	 * Filter function used to filter down the kinds found by the {Indexer} from lib/extra
	 * This function should be passed to {Indexer.search}
	 * @param  {regexp} regexp: regexp to apply on the name
	 * @return {boolean} false if the object must be rejected
	 */
	getKindFilter: function(regexp) {
		return function(o) {
			return (o.type === 'kind') && (o.token === 'enyo.kind') && (o.group === 'public') && regexp.test(o.name);
		};
	},
	/**
	 * Mapping function used to reformat the object filtered out by the previous functions
	 * This function should be passed to {Indexer.search}
	 * @param  {regexp} regexp: regexp to apply on the name
	 * @return {boolean} false if the object must be rejected
	 */
	getMapFn: function(pattern) {
		var name, len = pattern.length;
		return function(o) {
			name = o.name.substr(len);
			return {name: name};
		};
	}
});

enyo.kind({
	name : "Phobos.Suggestions",
	kind : "enyo.Component",
	debug: false,
	create: function() {
		this.inherited(arguments);
		this.objectId = Phobos.Suggestions.objectCounter++;
		this.debug && this.log("objectId: " + this.objectId);
		this.items = {};
		this.nbItems = 0;
	},
	/**
	 * Adds an array of items (or a single item) to the suggestion list
	 * @param {Array} items containing the elements for the auto-completion.
	 * Each item must contain at a name property.
	 * @public
	 */
	add: function(items) {
		if (items instanceof Array) {
			enyo.forEach(items, this.addItem, this);
		} else {
			this.addItem(items);
		}
	},
	/**
	 * Adds a single item to the suggestion list
	 * @param {Object} item must contain at least a name property
	 * @public
	 */
	addItem: function(item) {
		var name = item.name;
		if (this.items[name] === undefined) {
			this.items[name] = item;
			this.nbItems++;
			this.debug && this.log("objectId: " + this.objectId + " added: " + name + " count: " + this.nbItems);
		}
	},
	/**
	 * Removes all the suggestions
	 * @public
	 */
	reset: function() {
		this.debug && this.log("objectId: " + this.objectId);
		this.items = {};
		this.nbItems = 0;
	},
	/**
	 * Get the suggestions sorted by name
	 * @return {Array} the suggestions sorted by name
	 * @public
	 */
	getSortedSuggestions: function() {
		// Transform into an array
		var suggestions = [];
		for(var key in this.items) {
			if (this.items.hasOwnProperty(key)) {
				suggestions.push(this.items[key]);
			}
		}
		return suggestions.sort(Phobos.Suggestions.nameCompare);
	},
	/**
	 * Get the number of suggestions available
	 * @return {number} the number of suggestions available
	 * @public
	 */
	getCount: function() {
		this.debug && this.log("objectId: " + this.objectId + " count: " + this.nbItems);
		return this.nbItems;
	},
	/**
	 * Concatenate the suggestions passed as parameter to the current object
	 * @param suggestions must be a current Phobos.Suggestions object
	 * @public
	 */
	concat: function(suggestions) {
		if (suggestions) {
			this.debug && this.log("objectId: " + suggestions.objectId + " into " + this.objectId);
			for(var key in suggestions.items) {
				this.addItem(suggestions.items[key]);
			}
		}
		return this;
	},
	statics: {
		//** @protected
		objectCounter: 0,
		/**
		 * Compares two suggestion items (based on name property) for sorting
		 * @param  {Object} inA first item to compare
		 * @param  {Object} inB second item to compare
		 * @return {number}     the result of the comparison
		 * @protected
		 */
		nameCompare: function(inA, inB) {
			var na = inA.name.toLowerCase(),
				nb = inB.name.toLowerCase();
			if (na < nb) {
				return -1;
			}
			if (na > nb) {
				return 1;
			}
			return 0;
		}
	}
});
