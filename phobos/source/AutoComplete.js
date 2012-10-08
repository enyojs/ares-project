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
	ESCAPE_CODE: 27,
	BACKSPACE_CODE: 8,
	debug: false,
	input: "",
	suggestions: null,				// List of suggestion to display in the popup
	suggestionsEnyo: [],
	suggestionsOnyx: [],
	localKinds: {},					// The kinds defined in the currently edited file
	create: function() {
		this.inherited(arguments);
	},
	start: function(inEvent) {
		var suggestions = [], go = false;
		if (this.analysis && this.analysis.objects && this.analysis.objects.length > 0) {
			this.debug && this.log("Auto-Completion needed ?");

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
					suggestions = this.fillSuggestionsDoEvent(suggestions);
					suggestions = this.fillSuggestionsGettersSetters(suggestions);
					suggestions = this.fillSuggestionsProperties(suggestions);
				}

				if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_ENYO)) {
					suggestions = this.fillSuggestionsEnyo(suggestions);
				}

				if (this.isCompletionAvailable(inEvent, this.AUTOCOMP_ONYX)) {
					suggestions = this.fillSuggestionsOnyx(suggestions);
				}
			}
			
			if (suggestions.length > 0) {	// Some suggestions were found.
				this.input = "";
				this.suggestions = suggestions;
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
	fillSuggestionsThisDollar: function(suggestions) {
		enyo.forEach(this.analysis.objects[this.analysis.currentObject].components, function(a) {
			suggestions.push(a.name);
		});
		return suggestions;
	},
	fillSuggestionsDoEvent: function(suggestions) {
		// TODO
		return suggestions;
	},
	fillSuggestionsGettersSetters: function(suggestions) {
		// TODO
		return suggestions;
	},
	fillSuggestionsProperties: function(suggestions) {
		// TODO
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
		if (this.debug) this.log("Preparing suggestions list, input: >>" + input + "<<");
		enyo.forEach(this.suggestions, function(value) {
			if (input.length === 0) {
				select.createComponent({content: value});
			} else {
				if (value.indexOf(input) === 0) {
					select.createComponent({content: value});
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
		if (this.debug) this.log("Inserting >>" + selected + "<< at " + JSON.stringify(pos));
		this.ace.insertAt(pos, selected);
		ace.focus();
		return true; // Stop the propagation of the event
	},
	keyPress: function(inSender, inEvent) {
		var key = inEvent.keyIdentifier;
		if (key !== 'Enter') {
			var pos = enyo.clone(this.popupPosition);
			pos.column += this.input.length;
			var character = String.fromCharCode(inEvent.keyCode);
			this.input += character;
			if (this.debug) this.log("Got a keypress ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier + " ==> input: >>" + this.input + "<<");
			if (this.debug) this.log("Inserting >>" + character + "<< at " + JSON.stringify(pos));
			this.ace.insertAt(pos, character);
			this.showAutocompletePopup();
		} // else - Don't care
		return true; // Stop the propagation of the event
	},
	keyDown: function(inSender, inEvent) {
		if (this.debug) this.log("Got a keydown ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier);

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
		if (this.debug) this.log("Got a keyup ... code: " + inEvent.keyCode + " Ident:" + inEvent.keyIdentifier);

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
					if (this.debug) this.log("Got a backspace ==> input: >>" + this.input + "<<");
					this.showAutocompletePopup();
					this.ace.undo();
				}
			}// else - Don't care
		}

		this.ace.blur();		// Needed to force ACE to ignore keystrokes after the popup is opened

		return true; // Stop the propagation of the event
	},
	enyoIndexerChanged: function() {
		this.debug && this.log("Enyo analysis ready");
		var suggestions, pattern, regexp;
		
		// TODO YDM -- This test "this.enyoIndexer.getFunctionList" can be removed after lib/extra commit 5a31aa1f73aece000d5d0478487dc29ff9f1ed6e is integrated
		if (this.enyoIndexer && this.enyoIndexer.getFunctionList) {
			
			// Build the suggestion lists as the analyzer just finished its job
			pattern = this.AUTOCOMP_ENYO, len = pattern.length;
			regexp = /^enyo\..*$/;
			suggestions = [];
			
			enyo.forEach(this.enyoIndexer.getFunctionList(regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.push(name);
			}, this);
			enyo.forEach(this.enyoIndexer.getKindList(regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.push(name);
			}, this);
			this.suggestionsEnyo = suggestions;
			
			// Build the suggestion lists as the analyzer just finished its job
			suggestions = [];
			pattern = this.AUTOCOMP_ONYX;
			regexp = /^onyx\..*$/;
			len = pattern.length;
			enyo.forEach(this.enyoIndexer.getFunctionList(regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.push(name);
			}, this);
			enyo.forEach(this.enyoIndexer.getKindList(regexp, 'public'), function(name) {
				name = name.substr(len);
				suggestions.push(name);
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
		}
		
		return definition;
	}
});

