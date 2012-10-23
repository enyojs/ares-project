enyo.kind({
	name : "Phobos.AutoComplete",
	kind : "onyx.Popup",
	centered : false,
	floating : true,
	autoDismiss : false,
	modal : true,
	classes: "ares_phobos_autocomp",
	published: {
		ace: null,
		analysis: null,
		enyoIndexer: null,
		projectIndexer: null
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
	inputProcessor: null,			// To take care of browser differences regarding input events
	create: function() {
		this.inherited(arguments);
		this.inputProcessor = new Phobos.InputProcessor();
	},
	start: function(inEvent) {
		var suggestions = new Phobos.Suggestions(), go = false;
		if (this.analysis && this.analysis.objects && this.analysis.objects.length > 0) {
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
	},
	/**
	 * Check if we need to propose auto-completion for the pattern
	 * passed as a parameter
	 * @param inEvent
	 * @param pattern
	 * @returns true if auto-completion is possible
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
			this.debug && this.log("last >>" + last + " <<");

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
	fillSuggestionsThisDollar: function(suggestions) {
		enyo.forEach(this.analysis.objects[this.analysis.currentObject].components, function(a) {
			suggestions.addItem({name: a.name});
		});
		return suggestions;
	},
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
	fillSuggestionsEnyo: function(suggestions) {		
		return suggestions.concat(this.suggestionsEnyo);
	},
	fillSuggestionsOnyx: function(suggestions) {
		return suggestions.concat(this.suggestionsOnyx);
	},
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
		} else {
			this.hideAutocompletePopup();
		}
	},
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
		var pos = enyo.clone(this.popupPosition);
		pos.column += this.input.length;
		this.debug && this.log("Inserting >>" + selected + "<< at " + JSON.stringify(pos));
		this.ace.insertAt(pos, selected);
		ace.focus();
		return true; // Stop the propagation of the event
	},
	keyPress: function(inSender, inEvent) {
		var input = this.inputProcessor;
		input.setInput(inEvent);
		var code = input.getCharCode();
		if (code != 0 && code != input.CARRIAGE_RETURN) {	// Just consider regular character except ENTER
			var pos = enyo.clone(this.popupPosition);		// to refine the selection filtering
			pos.column += this.input.length;
			var character = String.fromCharCode(code);
			this.input += character;
			this.debug && this.log("Inserting >>" + character + "<< at " + JSON.stringify(pos));
			this.ace.insertAt(pos, character);
			this.showAutocompletePopup();
		}	// else - Don't care
		return true; // Stop the propagation of the event
	},
	keyDown: function(inSender, inEvent) {
		var input = this.inputProcessor;
		input.setInput(inEvent);
		var key = input.getKeyCode();
		if (key === input.ARROW_UP) {					// Detect the UP arrow
			var select = this.$.autocompleteSelect;
			var selected = select.getSelected() - 1;
			if (selected < 0) { selected = select.nbEntries - 1;}
			select.setSelected(selected);
		} else if (key === input.ARROW_DOWN) {			// Detect the DOWN arrow
			var select = this.$.autocompleteSelect;
			var selected = (select.getSelected() + 1) % select.nbEntries;
			select.setSelected(selected);
		} // else - Don't care
		return true; // Stop the propagation of the event
	},
	keyUp: function(inSender, inEvent) {
		var input = this.inputProcessor;
		input.setInput(inEvent);
		var key = input.getKeyCode();
		if (key === input.ESCAPE_CODE) {				// On ESCAPE, hide the auto-complete popup
			this.hideAutocompletePopup();
		} else if (key === input.CARRIAGE_RETURN) {		// On ENTER, insert the current selection
			this.autocompleteChanged();
			this.hideAutocompletePopup();				
		} else if (key === input.BACKSPACE_CODE) {		// On BACKSPACE, refine the selection filtering
			var str = this.input;
			if (str.length > 0) {
				this.input = str.substr(0, str.length -1);
				this.debug && this.log("Got a backspace ==> input: >>" + this.input + "<<");
				this.showAutocompletePopup();
				this.ace.undo();
			}
		}// else - Don't care

		this.ace.blur();		// Needed to force ACE to ignore keystrokes after the popup is opened

		return true; // Stop the propagation of the event
	},
	enyoIndexerChanged: function() {
		this.debug && this.log("Enyo analysis ready");
		var suggestions, pattern, regexp;
		
		if (this.enyoIndexer) {	
			// Build the suggestion lists as the analyzer just finished its job
			pattern = this.AUTOCOMP_ENYO, len = pattern.length;
			regexp = /^enyo\..*$/;
			suggestions = new Phobos.Suggestions();
			
			enyo.forEach(this.getFunctionList(this.enyoIndexer, regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.addItem({name: name});
			}, this);
			enyo.forEach(this.getKindList(this.enyoIndexer, regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.addItem({name: name});
			}, this);
			this.suggestionsEnyo = suggestions;
			
			// Build the suggestion lists as the analyzer just finished its job
			suggestions = new Phobos.Suggestions();
			pattern = this.AUTOCOMP_ONYX;
			regexp = /^onyx\..*$/;
			len = pattern.length;
			enyo.forEach(this.getFunctionList(this.enyoIndexer, regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.addItem({name: name});
			}, this);
			enyo.forEach(this.getKindList(this.enyoIndexer, regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.addItem({name: name});
			}, this);
			this.suggestionsOnyx = suggestions;
		}
	},
	projectIndexerChanged: function() {
		this.debug && this.log("Project analysis ready");
		// TODO something to do ?
	},
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
		}
		
		if (definition === undefined && this.enyoIndexer) {
			// Try to get it from the enyo/onyx analysis
			definition = this.enyoIndexer.findByName(name);
			
			if (definition === undefined) {
				// Try again with the enyo prefix as it is optional
				definition = this.enyoIndexer.findByName(this.AUTOCOMP_ENYO + name);
			}
		}
		
		return definition;
	},
	/**
	 * Returns a list of all kind names matching the parameter nameRegexp
	 * and the parameter group
	 * @parma indexer
	 * @param nameRegexp
	 * @param group
	 * @returns {Array} the list of matching kind name
	 */
	getKindList: function(indexer, nameRegexp, group) {
		// TODO this function must be removed when the equivalent will be available in lib/extra/analyzer2
		this.debug && this.log("getEnyoKindList --> result - regexp: " + nameRegexp + " group: " + group);
		var list = [];
		for (var i=0, o; o=indexer.objects[i]; i++) {
			if ((o.type === 'kind') && (o.token === 'enyo.kind') && (o.group === group) && nameRegexp.test(o.name)) {
				this.debug && this.log("getEnyoKindList --> this.objects[" + i + "]: type: " + o.type + " token: " + o.token + " group: "+ o.group + " name: " + o.name);
				list.push(o.name);
			}
		}
		return list;
	},
	/**
	 * Returns a list of all function names matching the parameter nameRegexp
	 * and the parameter group
	 * @parma indexer
	 * @param nameRegexp
	 * @param group
	 * @returns {Array} the list of matching function name
	 */
	getFunctionList: function(indexer, nameRegexp, group) {
		// TODO this function must be removed when the equivalent will be available in lib/extra/analyzer2
		var list = [];
		for (var i=0, o; o=indexer.objects[i]; i++) {
			if ((o.type === 'function') && (o.group === group) && nameRegexp.test(o.name)) {
				list.push(o.name);
			}
		}
		return list;
	}
});

/**
 * Phobos.InputProcessor takes care of different browser behavior
 * regarding input events.
 * 
 * For example, it filter keypress events on FireFox when
 * a CTRL, ALT or META is pressed while entering a character
 */
enyo.kind({
	name : "Phobos.InputProcessor",
	kind : "enyo.Component",
	debug: false,
	CARRIAGE_RETURN: 13,
	ARROW_UP: 38,
	ARROW_DOWN: 40,
	ESCAPE_CODE: 27,
	BACKSPACE_CODE: 8,
	setInput: function(inEvent) {
		this.inEvent = inEvent;

		this.debug && this.log("Got a " + inEvent.type + " ... keyCode: " + inEvent.keyCode + " charCode: " + inEvent.charCode + " Ident:" + inEvent.keyIdentifier);
		this.debug && this.log("+++++ crtl: " + inEvent.ctrlKey + " alt: " + inEvent.altKey + " shift:" + inEvent.shiftKey + " meta:" + inEvent.metatKey + " isChar: " + inEvent.isChar);
	},
	getKeyIdentifier: function() {
		var value = this.inEvent.keyIdentifier;
		this.debug && this.log(this.inEvent.type + " --> keyIdentifier: " + value);
		return value;
	},
	getKeyCode: function() {
		var value = this.inEvent.keyCode;
		this.debug && this.log(this.inEvent.type + " --> keyCode: " + value);
		return value;
	},
	getCharCode: function() {
		var event = this.inEvent;
		var value;
		if (event.ctrlKey || event.altKey || event.metatKey) {	// Avoid returning a CTRL-XXX on FireFox
			value = 0;
		} else {
			value = event.charCode;
		}
		this.debug && this.log(event.type + " --> charCode: " + value);
		return value;
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
	addItem: function(item) {
		var name = item.name;
		if (this.items[name] === undefined) {
			this.items[name] = item;
			this.nbItems++;
			this.debug && this.log("objectId: " + this.objectId + " added: " + name + " count: " + this.nbItems);
		}
	},
	reset: function() {
		this.debug && this.log("objectId: " + this.objectId);
		this.items = {};
		this.nbItems = 0;
	},
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
	getCount: function() {
		this.debug && this.log("objectId: " + this.objectId + " count: " + this.nbItems);
		return this.nbItems;
	},
	/**
	 * Concatenate the suggestions passed as parameter to the current object
	 * @param suggestions must be a Phobos.Suggestions object
	 */
	concat: function(suggestions) {
		this.debug && this.log("objectId: " + suggestions.objectId + " into " + this.objectId);
		for(var key in suggestions.items) {
			this.addItem(suggestions.items[key]);
		}
		return this;
	},
	statics: {
		objectCounter: 0,
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
