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
				{content: "Document"},
				{kind: "onyx.Button", content: "Save", ontap: "saveDocAction"},
				{fit: true},
				{kind: "onyx.Button", content: "Test Document", ontap: "testDocAction"},
				{kind: "onyx.Button", content: "Reparse", ontap: "reparseAction"},
				{kind: "onyx.Button", content: "Designer", ontap: "designerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", Xstyle: "padding-bottom: 10px;", components: [
				{name: "left", classes: "panel", showing: false, components: [
				]},
				{name: "middle", fit: true, classes: "panel", components: [
					{classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{kind: "Ace", classes: "enyo-fit", style: "margin: 4px;"}
					]}
				]},
				{name: "right", classes: "panel", components: [
					// neccesary nesting here for 'margin: 8px;"
					{kind: "enyo.Scroller", classes: "border panel enyo-fit", style: "margin: 8px;", components: [
						{name: "dump", style: "padding: 10px;", allowHtml: true}
					]}
				]}
			]}
		]},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Saving document...", style: "padding-top: 10px;"}
		]}
	],
	handlers: {
	},
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
		if (!c) {
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
	testDocAction: function() {
		var code = 'enyo.kind({\n	name: "App",\n	kind: "FittableRows",\n	margin: 10,\n	padding: 10,\n	classes: "enyo-unselectable",\n	components: [\n		{kind: "Signals", onload: "load"},\n		{kind: "DragAvatar", components: [ \n			{tag: "img", src: "images/icon.png"}\n		]},\n		{kind: "bts.NavBar", content: "Eros", style: "margin: 0 10px;", components: [\n			{kind: "bts.Menu", classes: "nav", components: [\n				{content: "New Document", ontap: "newDocument"},\n				{content: "Test Document", ontap: "testDocTap"}\n			]}\n		]},\n		{name: "body", fit: true, kind: "Columns", margin: 10, padding: 10, components: [\n			{name: "left", components: [\n				{kind: "Palette", classes: "enyo-fit", ondragstart: "dragStart"}\n			]},\n			{name: "middle", fit: true, components: [\n				{kind: "Designer", classes: "enyo-fit", onChange: "designerChange", onSelect: "designerSelect", ondragstart: "dragStart"}\n			]},\n			{name: "right", kind: "Rows", padding: 10, components: [\n				{kind: "ComponentView", classes: "well", onSelect: "componentViewSelect", ondrop: "componentViewDrop"},\n				{kind: "Inspector", fit: true, classes: "well", onModify: "inspectorModify"}\n			]}\n		]}\n	],\n	handlers: {\n		ondrag: "drag",\n		ondragfinish: "dragFinish",\n		ondrop: "drop"\n	},\n	create: function() {\n		this.inherited(arguments);\n	},\n	load: function() {\n		this.newDocument();\n	},\n	newDocument: function() {\n		var document = [\n			{kind: "Rows", isContainer: true, classes: "enyo-fit"}\n		];\n		this.$.inspector.inspect(null);\n		this.$.designer.load(document);\n	},\n	testDocTap: function() {\n		var document = [\n			{kind: "Rows", classes: "enyo-fit", isContainer: true, components: [\n				{kind: "bts.NavBar", content: "Design!", isContainer: true},\n				{fit: true, kind: "Scroller", isContainer: true, style: "background-color: lightblue;", components: [\n					{kind: "Rows", classes: "enyo-fit", isContainer: true}\n				]}\n			]}\n		];\n		this.$.inspector.inspect(null);\n		this.$.designer.load(document);\n	},\n	refreshComponentView: function() {\n		this.$.componentView.visualize(this.$.designer.$.client, this.$.designer.$.model);\n		this.$.componentView.select(this.$.designer.selection);\n	},\n	designerChange: function(inSender) {\n		this.refreshComponentView();\n	},\n	designerSelect: function(inSender) {\n		this.$.inspector.inspect(inSender.selection);\n		this.$.componentView.select(inSender.selection);\n	},\n	componentViewSelect: function(inSender) {\n		this.$.inspector.inspect(inSender.selection);\n		this.$.designer.select(inSender.selection);\n	},\n	inspectorModify: function() {\n		this.$.designer.refresh();\n		this.refreshComponentView();\n	},\n	componentViewDrop: function(inSender, inEvent) {\n		return this.$.designer.drop(inSender, inEvent);\n	},\n	dragStart: function(inSender, inEvent) {\n		//inEvent.dragInfo = this.$.designer.selection;\n		return true;\n	},\n	drag: function(inSender, inEvent) {\n		if (inEvent.dragInfo) {\n			this.$.dragAvatar.drag(inEvent);\n			return true;\n		}\n	},\n	dragFinish: function(inSender, inEvent) {\n		if (inEvent.dragInfo) {\n			this.$.dragAvatar.hide();\n			inEvent.preventTap();\n		}\n	}\n});\n\n';
		this.openDoc(code, "js");
	},
	designerAction: function() {
		// TODO: Crib more of this from Enyo2v1
		var c = this.$.ace.getValue();
		var module = {
			name: "Document",
			code: c
		};
		this.$.analyzer.index.indexModule(module);
		var o = module.objects && module.objects[0];
		var comps = o.components;
		var start = o.components[0].start;
		var end=c.lastIndexOf("]")+1;
		var js = eval("([\n"+c.substring(start, end)+")");
		this.bubble("onDesignDocument", {content: js});
	}
});

