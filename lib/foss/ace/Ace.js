enyo.kind({
	name: "enyo.Ace",
	kind: enyo.Control,
	published: {
		value: "",
		theme: "clouds",
		wordWrap: false,
		readonly: false,
		highlightActiveLine: false,
		showPrintMargin: false,
		useSoftTabs: false,
		persistentHScroll: false,
		//** Modes:
		editingMode: "javascript"
	},
	requiresDomMousedown: true,
	events: {
		onChange: "",
		onScroll: "",
		onCursorChange: "",
		onSave: "",
		onAutoCompletion: "",
		onFind: "",
		/// FIXME just add these for now
		onSetBreakpoint: "",
		onClearBreakpoint: ""
	},
	// NOTE: ace doesn't like being flexed, so we wrap the editor node in a positioned element
	style: "font-size: 0.8em;",
	components: [
		{name: "aceEditor", classes: "enyo-view enyo-fit"}
	],
	rendered: function() {
		this.inherited(arguments);
		
		this.theme = localStorage.theme;
		if(this.theme === undefined){
			this.theme = "clouds";
		}
		
		var n = this.hasNode();
		if (n) {
			this.editor = ace.edit(this.$.aceEditor.id);
			this.themeChanged();
			this.valueChanged();
			this.updateSessionSettings(this.getSession());
			this.highlightActiveLineChanged();
			this.readonlyChanged();
			this.showPrintMarginChanged();
			this.persistentHScrollChanged();
			this.gotoLine(0);
			//this.removeMeasureNode();
			this.addListeners();
			this.addSessionListeners();
			this.addKeyBindings();
		}
	},
	/**
	 * Register some specific commands for save, ...
	 * @protected
	 */
	addKeyBindings: function() {
		var commands = this.editor.commands;
		
		// Add keybinding for save
		commands.addCommand({
			name: "save",
			bindKey: {win: "Ctrl-S", mac: "Command-S"},
			exec: enyo.bind(this, "saveDocAction")
		});

		// Add keybinding for auto completion
		commands.addCommand({
			name: "autocompletion",
			bindKey: {win: "Ctrl-SPACE", mac: "Ctrl-SPACE"},
			exec: enyo.bind(this, "doAutoCompletion")
		});

		// Add keybinding for find
		commands.addCommand({
			name: "find",
			bindKey: {win: "Ctrl-F", mac: "Command-F"},
			exec: enyo.bind(this, "doFind")
		});
	},
	/**
	 * Add a new command with key kinding
	 * @param command: the new command with key binding.
	 * @public
	 */
	addCommand: function(command) {
		this.editor.commands.addCommand(command);
	},
	addListeners: function() {
		this.editor.renderer.on("gutterclick", enyo.bind(this, "gutterclick"));
		this.editor.renderer.scrollBar.on("scroll", enyo.bind(this, "doScroll"));
	},
	addSessionListeners: function() {
		this.getSession().on("change", enyo.bind(this, "doChange"));
		this.getSession().selection.on("changeCursor", enyo.bind(this, "doCursorChange"));
		this.getSession().on("changeScrollLeft", enyo.bind(this, "doScroll"));
		this.getSession().on("changeScrollTop", enyo.bind(this, "doScroll"));
	},
	saveDocAction: function() {
		this.doSave();
	},
	gutterclick: function(inEventInfo) {
		this.toggleBreakpoint(inEventInfo.row);
	},
	// FIXME: ace should have this method
	toggleBreakpoint: function(inRow) {
		var s = this.getSession();
		var bp = s.getBreakpoints();
		this.log(inRow);
		if (!bp[inRow]) {
			s.setBreakpoint(inRow);
			this.doSetBreakpoint(inRow);
		} else {
			s.clearBreakpoint(inRow);
			this.doClearBreakpoint(inRow);
		}
	},
	// remove the stupid ace measuring node
	removeMeasureNode: function() {
		// measure nodes are at -40000px left, directly under the body
		var measureNode = document.body.querySelector("body > div[style ~= '-40000px;']");
		if (measureNode) {
			measureNode.parentNode.removeChild(measureNode);
		}
	},
	themeChanged: function() {
		var t = this.theme || "";
		t = (!t || t.indexOf("/") >= 0) ? t : "ace/theme/" + t;
		this.editor.setTheme(t);
	},
	highlightActiveLineChanged: function() {
		this.editor.setHighlightActiveLine(this.highlightActiveLine);
	},
	readonlyChanged: function() {
		this.editor.setReadOnly(this.readonly);
	},
	setSessionMode: function(inSession, inMode) {
		try {
			var m = require("ace/mode/" + inMode).Mode;
			inSession.setMode(new m());
		} catch(e) {
			enyo.log(e);
		}
	},
	updateSessionSettings: function(inSession) {
		this.setSessionMode(inSession, this.editingMode);
		inSession.setUseWrapMode(this.wordWrap);
		inSession.setUseSoftTabs(this.useSoftTabs);
	},
	editingModeChanged: function() {
		this.updateSessionSettings(this.getSession());
	},
	wordWrapChanged: function() {
		this.updateSessionSettings(this.getSession());
	},
	useSoftTabsChanged: function() {
		this.updateSessionSettings(this.getSession());
	},
	getValue: function() {
		return this.value = this.getSession().getValue();
	},
	valueChanged: function() {
		var s = this.getSession();
		if (s) {
			s.setValue(this.value);
		}
	},
	persistentHScrollChanged: function() {
		this.editor.renderer.setHScrollBarAlwaysVisible(this.persistentHScroll);
	},
	updateValue: function(inValue) {
		this.editor.selectAll();
		this.insertAtCursor(inValue);
	},
	focus: function() {
		this.editor.focus();
	},
	blur: function() {
		this.editor.blur();
	},
	showPrintMarginChanged: function () {
		this.editor.renderer.setShowPrintMargin(this.showPrintMargin);
	},
	getSelection: function() {
		return this.getSession().doc.getTextRange(this.editor.getSelectionRange());
	},
	insertAt: function(inPos, inText) {
		this.editor.moveCursorToPosition(inPos);
		this.editor.insert(inText);
	},
	insertAtCursor: function(inText) {
		this.editor.insert(inText);
	},
	/*insertAt: function(inPosition, inText) {
		var cursorPos;
		if (inPosition) {
			cursorPos = this.getCursorPositionInDocument();
			this.editor.moveCursorTo(inPosition.row, inPosition.column);
		}
		this.insertAtCursor(inText);
		if (cursorPos) {
			this.editor.moveCursorTo(inPosition.row, inPosition.column);
		}
	},*/
	gotoLine: function(inLine, inRow) {
		this.editor.gotoLine(inLine, inRow);
	},
	navigateUp: function(times) {
		this.editor.navigateUp(times);
	},
	navigateDown: function(times) {
		this.editor.navigateDown(times);
	},
	/**
		inOptions {Object} backwards: false, wrap: false, caseSensitive: false, wholeWord: false, regExp: false
	*/
	find: function(inFind, inOptions) {
		this.editor.find(inFind, inOptions);
	},
	findNext: function() {
		this.editor.findNext();
	},
	findPrevious: function() {
		this.editor.findPrevious();
	},
	replace: function(inFind, inReplace, inOptions) {
		this.find(inFind, inOptions);
		this.editor.replace(inReplace);
	},
	replacefind: function(inFind, inReplace, inOptions) {
		this.editor.replace(inReplace);
		this.find(inFind, inOptions);
	},
	replaceAll: function(inFind, inReplace, inOptions) {
		this.find(inFind, inOptions);
		this.editor.replaceAll(inReplace);
	},
	getUndoManager: function() {
		return this.editor.getSession().getUndoManager();
	},
	undo: function() {
		this.getUndoManager().undo();
	},
	redo: function() {
		this.getUndoManager().redo();
	},
	canUndo: function() {
		return this.getUndoManager().hasUndo();
	},
	canRedo: function() {
		return this.getUndoManager().hasRedo();
	},
	isDirty: function(inCompare) {
		if (inCompare) {
			return inCompare !== this.getValue();
		}
		return true;
	},
	resizeHandler: function() {
		this.editor.resize();
	},
	scrollToY: function(inY) {
		this.editor.renderer.scrollToY(inY);
	},
	getLineCount: function() {
		return this.getSession().getScreenLength();
	},
	getLineHeight: function() {
		return this.editor.renderer.lineHeight;
	},
	getContentHeight: function() {
		return this.getLineCount() * this.getLineHeight();
	},
	getLines: function(inStartLine, inEndLine) {
		return this.getSession().getLines(inStartLine, inEndLine);
	},
	getLine: function(inLine) {
		return this.getLines(inLine, inLine)[0];
	},
	getLength: function() {
		return this.getSession().getLength();
	},
	findMatchingBracketAtCursor: function() {
		return this.getSession().findMatchingBracket(this.getCursorPositionInDocument());
	},
	getCursorPositionInDocument: function() {
		return this.editor.getCursorPosition();
	},
	getCursorPositionOnScreen: function() {
		// find cursor position in screen pixels
		var rect = this.editor.renderer.$cursorLayer.cursor.getBoundingClientRect();
		// clone out properties we want (clientrect is not modifiable)
		return enyo.clone(rect);
	},
	textToScreenCoordinates: function(row, column) {
		return this.editor.renderer.textToScreenCoordinates(row, column);
	},
	/**
	 * Insert the content of the input parameter at the end of the file
	 * if cursorMarker is defined, the cursor will be positioned
	 * at the first character of the pattern specified by cursorMarker
	 * NB: The pattern cursorMarker is removed from input before
	 * the append a the end of the file
	 * @param input data to append to the file
	 * @param cursorMarker for cursor positioning
	 */
	insertAtEndOfFile: function(input, cursorMarker) {
		var cursorPos = {row: this.getLineCount(), column: 0};
		// goto last line
		this.gotoLine(cursorPos.row);
		// And the end of that line
		this.editor.navigateLineEnd();
		
		if (cursorMarker) {
			// Find the wanted cursor position
			var lines = input.split('\n');
			for(var i = 0; i < lines.length ; i++) {
				var column = lines[i].indexOf(cursorMarker);
				if (column !== -1) {
					cursorPos.row += (i + 1);
					cursorPos.column = column;
					input = input.replace(cursorMarker, "");
				}
			}
		}
		// auto indent is dumb, so we must add a line at a time
		this.insertAtCursor("\n");
		this.insertAtCursor(input);
		if (cursorMarker) {		// Move the cursor to the expected position
			this.gotoLine(cursorPos.row, cursorPos.column);
		}
		this.focus();
	},
	insertMethod: function(inMethodName, inArgumentNames, inLine, firstProperty) {
		// goto referenced line
		this.gotoLine(inLine + 1);
		// And the end of that line
		this.editor.navigateLineEnd();
		// insert a comma between properties in the kind bag
		if (!firstProperty) {
			this.insertAtCursor(",");
		}
		// auto indent is dumb, so we must add a line at a time
		this.insertAtCursor("\n");
		this.insertAtCursor(inMethodName + ": function(");
		if (enyo.isArray(inArgumentNames)) {
			this.insertAtCursor(inArgumentNames.join(", "));
		}
		this.insertAtCursor(") {");
		this.insertAtCursor("\n");
		this.insertAtCursor("\t");
		this.insertAtCursor("\n");
		this.insertAtCursor("}");
		// place cursor on the blank line, at the end
		this.editor.navigateUp(1);
		this.editor.navigateLineEnd();
	},
	createSession: function(inText, inMode) {
		var EditSession = require("ace/edit_session").EditSession;
		var UndoManager = require("ace/undomanager").UndoManager;
		var session = new EditSession(inText || "");
		session.setUndoManager(new UndoManager());
		this.updateSessionSettings(session);
		if (inMode) {
			this.setSessionMode(session, inMode);
		}
		return session;
	},
	destroySession: function(inSession) {
		// TODO: Not sure what should be done exactly.
	},
	addFold: function(inStart, inLeft, inEnd, inRight, inComment) {
		var r = this.createRange(inStart, inLeft, inEnd, inRight);
		this.getSession().addFold(inComment, r);
	},
	addMarker: function(inClass, inType, inStart, inLeft, inEnd, inRight) {
		this.log(inStart, inLeft, inEnd, inRight);
		var r = this.createRange(inStart, inLeft, inEnd, inRight);
		return this.getSession().addMarker(r, inClass, inType);
	},
	removeMarker: function(inMarkerId) {
		this.getSession().removeMarker(inMarkerId);
	},
	createRange: function(inStart, inLeft, inEnd, inRight) {
		var Range = require("ace/range").Range;
		return (new Range(inStart, inLeft, inEnd, inRight));
	},
	getSession: function() {
		return this.editor.getSession();
	},
	setSession: function(inSession) {
		this.editor.setSession(inSession);
		this.addSessionListeners();
	},
	/**
	 * Maps a list of stream positions in the current document
	 * to the corresponding lines and columns in the same documemt
	 * @param  streamPositions: an array of ordered positions in the document stream
	 * @return an array of corresponding positions in row and column
	 * @public
	 */
	mapToLineColumns: function(streamPositions) {
		var session = this.getSession();
		var document = session.getDocument();
		var nbNewLineCharacters = document.getNewLineCharacter().length;
		var lineCount = session.getLength();
		var lineIdx = 0;
		var line;
		var bytesCount = 0;
		var nbBytes;
		var streamIdx = 0;
		var streamPos = streamPositions[streamIdx];
		var positions = [];

		while (lineIdx < lineCount) {
			line = session.getLine(lineIdx);
			nbBytes = line.length;

			if (bytesCount + nbBytes >= streamPos) {
				// this.log(streamPos + " --> line: " + (lineIdx + 1) + " column: " + (streamPos - bytesCount));
				positions.push({row: lineIdx, column: (streamPos - bytesCount)});
				streamIdx++;
				if (streamIdx < streamPositions.length) {
					// Find the next one
					streamPos = streamPositions[streamIdx];
				} else {
					// Were are done
					return positions;
				}
			} else {
				bytesCount += (nbBytes + nbNewLineCharacters);
				lineIdx++;
			}
		}

		// We don't return anything here as this is an error condition: bad order, out of range, ...
	},
	/**
	 * Maps a 'start' and 'end' stream positions in the current document
	 * to the corresponding lines and columns in the same documemt
	 * as an ACE Range
	 * @param  start: starting stream position in the current document
	 * @param  end:   ending stream position in the current document
	 * @return an ACE Range matching the stream position.
	 * @public
	 */
	mapToLineColumnRange: function(start, end) {
		var pos = this.mapToLineColumns([start, end]);
		return this.createRange(pos[0].row, pos[0].column, pos[1].row, pos[1].column);
	},
	/**
	 * Replaces the specified range of text with the new text passed
	 * in the parameters
	 * @param  range: the range to replace with the new text
	 * @param  text:  the new text
	 * @public
	 */
	replaceRange: function(range, text) {
		this.getSession().replace(range, text);
	},
	setFontSize: function(size){
		var s = size;
		this.editor.setFontSize(s);
	},
});
