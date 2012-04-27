enyo.kind({
	name: "Documents",
	create: function() {
		this.documents = {};
		this.inherited(arguments);
		this.captureEvents();
	},
	destroy: function() {
		this.releaseEvents();
		this.inherited(arguments);
	},
	captureEvents: function() {
		this._captureHandler = enyo.bind(this, "captureHandler");
		document.addEventListener("keydown", this._captureHandler, true);
	},
	releaseEvents: function() {
		document.removeEventListener("keydown", this._captureHandler, true);
	},
	captureHandler: function(inEvent) {
		// Ctrl-S or Command/Win-S
		if ((inEvent.ctrlKey || inEvent.metaKey) && inEvent.keyCode == 83) {
			enyo.stopEvent(inEvent);
			if (this.activeDocument) {
				this.activeDocument.view.saveAction();
			}
		}
	},
	openDocument: function(inPath) {
		if (this.documents[inPath]) {
			this.activateDocument(this.documents[inPath]);
		} else {
			var d = this.prepareDocument(inPath);
			this.documents[inPath] = d;
			//
			d.view = this.findDocumentView(d);
			d.view.openDocument(d);
			//
			this.showDocument(d);
			this.getFile(inPath);
		}
	},
	prepareDocument: function(inPath) {
		var parts = inPath.split("/");
		var name = parts.pop();
		var ext = name.split(".").pop();
		var folder = parts.join("/");
		return {
			path: inPath,
			folder: folder,
			name: name,
			ext: ext,
			content: ""
		};
	},
	findDocumentView: function(inDocument) {
		// FIXME: brute force
		if (inDocument.name == "appinfo.json") {
			return this.$.appDocumentView;
		}
		if ({jpg:1, png:1, jpeg:1, gif:1}[inDocument.ext]) {
			return this.$.imageDocumentView;
		}
		if ({js:1}[inDocument.ext]) {
			return this.$.designerDocumentView;
		}
		/*
		if (inDocument.name.indexOf("chrome.js") >= 0) {
			return this.$.designerDocumentView;
		}
		*/
		return this.$.textDocumentView;
	},
	showDocument: function(inDocument) {
		var index = this.$.basicCarousel.indexOfControl(inDocument.view) - 1;
		this.$.basicCarousel.snapTo(index, true);
	},
	getFile: function(inPath) {
		this.$.fileProvider.getFile(inPath).
			response(this, function(inSender, inContent) {
				var d = this.documents[inPath];
				if (d) {
					d.content = inContent;
					this.activateDocument(d);
				}
			})
			;
	},
	activateDocument: function(inDocument) {
		if (this.activeDocument) {
			//this.activeDocument.deactivate();
			this.deactivateDocument(this.activeDocument);
		}
		this.activeDocument = inDocument;
		this.showDocument(inDocument);
		inDocument.view.activateDocument(inDocument);
		//inDocument.activate();
	},
	deactivateDocument: function(inDocument) {
		if (inDocument) {
			inDocument.view.deactivateDocument(inDocument);
			if (inDocument == this.activeDocument) {
				this.activeDocument = null;
			}
		}
	},
	saveDocument: function(inSender, inDocument) {
		this.log();
		this.$.fileProvider.putFile(inDocument.path, inDocument.content)
			.response(this, function() {
				//inDocument.dataSaved();
			})
			;
	},
	closeDocument: function(inPath) {
		this.deactivateDocument(this.documents[inPath]);
		delete this.documents[inPath];
	}
});
