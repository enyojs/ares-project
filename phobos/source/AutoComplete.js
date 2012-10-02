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
			var pos = ace.textToScreenCoordinates(this.position.row, this.position.column);
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

