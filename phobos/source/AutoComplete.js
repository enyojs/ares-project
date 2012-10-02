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
	suggestions: null,				// List of suggestion to display in the popup
	create: function() {
		this.AUTOCOMP_THIS_DOLLAR_LEN = this.AUTOCOMP_THIS_DOLLAR.length;
		this.inherited(arguments);
	},
	start: function(inEvent, inAnalysis) {
		var suggestions = null, go = false;
		if (inAnalysis.objects && inAnalysis.objects.length > 0) {
			if (this.debug) this.log("Auto-Completion needed ?");

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
				suggestions = this.checkCompletionThisDollar(inEvent, inAnalysis);
				if (suggestions === undefined) {
					suggestions = this.checkCompletionThisDoStar(inEvent, inAnalysis);
				}
				if (suggestions === undefined) {
					suggestions = this.checkCompletionThisStar(inEvent, inAnalysis);
				}
				if (suggestions === undefined) {
					suggestions = this.checkCompletionThisDollarStarStar(inEvent, inAnalysis);
				}
			}
			
			if (suggestions) {	// Some suggestions were found.
				this.input = "";
				this.suggestions = suggestions;
				this.showAutocompletePopup();
			}
		}
	},
	/**
	 * Check if we need to propose auto-completion for "this.$.*"
	 * @param inEvent
	 * @param inAnalysis
	 * @returns {Array} of suggestions and set this.popupPosition 
	 * or returns undefined if nothing to do
	 */
	checkCompletionThisDollar: function(inEvent, inAnalysis) {
		var line, last, popupPosition;
		var suggestions = [];
		if (inEvent) {	// Triggered by a '.' inserted by the user
			popupPosition = inEvent.data.range.end;
		} else {	// Triggered by a Ctrl-Space coming from the user
			popupPosition = this.ace.getCursorPositionInDocument();
		}

		// Get the line and the last character entered
		line = this.ace.getLine(popupPosition.row);
		last = line.substr(popupPosition.column - this.AUTOCOMP_THIS_DOLLAR_LEN, this.AUTOCOMP_THIS_DOLLAR_LEN);
		
		// Check if it's part of a 'this.$." string
		if (last == this.AUTOCOMP_THIS_DOLLAR) {
			this.popupPosition = popupPosition;
			enyo.forEach(inAnalysis.objects[inAnalysis.currentObject].components, function(a) {
				suggestions.push(a.name);
			});
			return suggestions;
		}
		return;			// Nothing to auto-complete
	},
	/**
	 * Check if we need to propose auto-completion for "this.*"
	 * @param inEvent
	 * @param inAnalysis
	 * @returns {Array} of suggestions and set this.popupPosition 
	 * or returns undefined if nothing to do
	 */
	checkCompletionThisStar: function(inEvent, inAnalysis) {	// ENYO-1121
		 // TODO Insert code here.
		
		return;			// Nothing to auto-complete
	},
	/**
	 * Check if we need to propose auto-completion for "this.do*"
	 * @param inEvent
	 * @param inAnalysis
	 * @returns {Array} of suggestions and set this.popupPosition 
	 * or returns undefined if nothing to do
	 */
	checkCompletionThisDoStar: function(inEvent, inAnalysis) {	// ENYO-1122
		 // TODO Insert code here.
		
		return;			// Nothing to auto-complete
	},
	/**
	 * Check if we need to propose auto-completion for "this.$.*.*"
	 * @param inEvent
	 * @param inAnalysis
	 * @returns {Array} of suggestions and set this.popupPosition 
	 * or returns undefined if nothing to do
	 */
	checkCompletionThisDollarStarStar: function(inEvent, inAnalysis) {	// ENYO-1120
		 // TODO Insert code here.
		
		return;			// Nothing to auto-complete
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
	}
});

