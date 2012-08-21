enyo.kind({
	name: "Phobos",
	classes: "enyo-unselectable",
	components: [
		{kind: "Analyzer", onIndexReady: "indexReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		//{name: "db", kind: "PackageDb", onFinish: "dbReady"},
		{kind: "DragAvatar", components: [ 
			{tag: "img", src: "images/icon.png"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", Xstyle: "padding: 10px;", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 10px;", components: [
				{kind: "onyx.Button", content: "Close", ontap: "closeDocAction"},
				{name: "documentLabel", content: "Document"},
				{kind: "onyx.Button", content: "Save", ontap: "saveDocAction"},
				{fit: true},
				{kind: "onyx.Button", content: "Designer", ontap: "designerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "left", classes: "panel", showing: false, components: [
				]},
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;", onChange: "changed"}
					]}
				]},
				{name: "right", classes: "panel", components: [
					// neccesary nesting here for 'margin: 8px;"
					{kind: "enyo.Scroller", classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "onyx.Button", content: "Reparse", ontap: "reparseAction"},
						{name: "dump", style: "padding: 10px;", allowHtml: true}
					]}
				]}
			]}
		]},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Saving document...", style: "padding-top: 10px;"}
		]},
		{name: "savePopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{name: "message", content: "Document was modified! Save it before closing?", style: "padding: 10px;"},
			{kind: "FittableColumns", components: [
				{kind: "onyx.Button", content: "Cancel", ontap: "cancelCloseAction"},
				{kind: "onyx.Button", content: "Don't Save", ontap: "abandonDocAction"},
			]}
		]}
	],
	handlers: {
	},
	docChanged: false,
	create: function() {
		this.inherited(arguments);
		this.buildDb();
	},
	//
	//
	saveDocAction: function() {
		this.showWaitPopup("Saving document...");
		this.bubble("onSaveDocument", {content: this.$.ace.getValue()});
	},
	saveComplete: function() {
		this.hideWaitPopup();
		this.docChanged=false;
	},
	beginOpenDoc: function() {
		this.showWaitPopup("Opening document...");
	},
	openDoc: function(inCode, inExt) {
		this.hideWaitPopup();
		var mode = {json: "json", js: "javascript", html: "html", css: "css"}[inExt] || "text";
		this.$.ace.setEditingMode(mode);
		this.$.ace.setValue(inCode);
		this.reparseAction();
		this.docChanged=false;
	},
	showWaitPopup: function(inMessage) {
		this.$.waitPopupMessage.setContent(inMessage);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	//
	//
	buildDb: function() {
		this.$.analyzer.analyze(["$enyo/source", "$lib/layout", "$lib/onyx"]);
	},
	indexReady: function() {
		this.testDb();
	},
	testDb: function() {
		//var c = this.$.db.findByName("enyo.Control");
		//var c = this.$.db.findByName("onyx.Button");
		var c = this.$.analyzer.index.findByName("enyo.FittableRows");
		this.dumpInfo(c);
	},
	dumpInfo: function(inObject) {
		var c = inObject;
		if (!c || !c.superkinds) {
			this.$.dump.setContent("(no info)");
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
		var h = [];
		for (var i=0, p; p=c.components[i]; i++) {
			h.push(p.name);
		}
		if (h.length) {
			h$ += "<h4>Components</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		}
		//
		h = [];
		for (var i=0, p; p=c.properties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		h = [];
		for (var i=0, p; p=c.allProperties[i]; i++) {
			h.push(p.name);
		}
		h$ += "<h4>All Properties</h4>" + "<ul><li>" + h.join("</li><li>") + "</li></ul>";
		//
		this.$.dump.setContent(h$);
	},
	reparseAction: function() {
		var module = {
			name: "Document",
			code: this.$.ace.getValue()
		};
		this.$.analyzer.index.indexModule(module);
		// ad hoc: dump the first object, if it exists
		this.dumpInfo(module.objects && module.objects[0]);
	},
	designerAction: function() {
		// TODO: Crib more of this from Ares2v1
		var c = this.$.ace.getValue();
		var module = {
			name: "Document",
			code: c
		};
		this.$.analyzer.index.indexModule(module);
		var kinds = [];
		for (var i=0; i < module.objects.length; i++) {
			var o = module.objects[i];
			var comps = o.components;
			var name = o.name;
			var kind = o.superkind;
			if (comps) { // only include kinds with components block
				var start = comps[0].start;
				var end = comps[comps.length - 1].end;
				var js = eval("(["+c.substring(start, end)+"])");
				kinds.push({name: name, kind: kind, content: js});
			}
		}
		if (kinds.length > 0) {
			this.bubble("onDesignDocument", kinds);
		} else {
			alert("No kinds found in this file");
		}
	},
	closeDocAction: function(inSender, inEvent) {
		if (this.docChanged) {
			this.$.savePopup.show();
		} else {
			this.bubble("onCloseDocument", {});
		}
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		this.bubble("onCloseDocument", {});
	},
	// called when the "Cancel" is selected in save popup
	cancelCloseAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
	},
	changed: function(inSender, inEvent) {
		this.docChanged=true;
	}
});

