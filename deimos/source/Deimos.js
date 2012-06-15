enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable",
	components: [
		{kind: "Signals", onload: "load"},
		{kind: "DragAvatar", components: [ 
			{tag: "img", src: "images/icon.png", style: "width: 24px; height: 24px;"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.Toolbar", Xstyle: "margin: 0 10px;", components: [
				{content: "Deimos"},
				{kind: "onyx.Button", content: "New Document", ontap: "newDocumentAction"},
				{kind: "onyx.Button", content: "Test Document", ontap: "testDocAction"},
				{kind: "onyx.Button", content: "Serialize", ontap: "serializeAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", components: [
				{name: "left", kind: "Palette", ondragstart: "dragStart"},
				{name: "middle", fit: true, kind: "FittableRows",components: [
					{kind: "onyx.RadioGroup", components: [
						{content: "Design", active: true},
						{content: "Code"}
					]},
					{kind: "Designer", fit: true, onChange: "designerChange", onSelect: "designerSelect", ondragstart: "dragStart"},
					{name: "code", classes: "panel", components: [
						{kind: "Scroller", classes: "enyo-selectable", components: [
							{name: "codeText", tag: "pre", style: "white-space: pre; font-size: smaller; border: none; margin: 0;"}
						]}
					]}
				]},
				{name: "right", kind: "FittableRows", components: [
					{kind: "ComponentView", classes: "panel", onSelect: "componentViewSelect", ondrop: "componentViewDrop"},
					{kind: "Inspector", fit: true, classes: "panel", onModify: "inspectorModify"}
				]}
			]}
		]}
	],
	handlers: {
		ondrag: "drag",
		ondragfinish: "dragFinish",
		ondrop: "drop"
	},
	create: function() {
		this.inherited(arguments);
	},
	load: function(what) {
		if (what) {
			this.$.inspector.inspect(null);
			this.$.designer.load(what);
		} else {
			this.newDocumentAction();
		}
	},
	newDocumentAction: function() {
		var document = [
			{kind: "FittableRows", isContainer: true, classes: "enyo-fit", components: [
			]}
		];
		this.$.inspector.inspect(null);
		this.$.designer.load(document);
	},
	testDocAction: function() {
		var document = [
			{kind: "FittableRows", classes: "enyo-fit", isContainer: true, components: [
				{kind: "onyx.Toolbar", content: "Design!", isContainer: true},
				{fit: true, kind: "Scroller", isContainer: true, style: "background-color: lightblue;", components: [
					{kind: "FittableRows", classes: "enyo-fit", isContainer: true}
				]}
			]}
		];
		this.$.inspector.inspect(null);
		this.$.designer.load(document);
	},
	serializeAction: function() {
		this.$.codeText.setContent("\t" + this.$.designer.serialize());
	},
	refreshInspector: function() {
		enyo.job("inspect", enyo.bind(this, function() {
			this.$.inspector.inspect(this.$.designer.selection);
		}), 200);
	},
	refreshComponentView: function() {
		this.$.componentView.visualize(this.$.designer.$.client, this.$.designer.$.model);
		this.$.componentView.select(this.$.designer.selection);
		this.serializeAction();
	},
	designerChange: function(inSender) {
		this.refreshComponentView();
		this.refreshInspector();
	},
	designerSelect: function(inSender, inEvent) {
		this.refreshInspector();
		this.$.componentView.select(inSender.selection);
	},
	componentViewSelect: function(inSender) {
		this.$.designer.select(inSender.selection);
		this.refreshInspector();
	},
	inspectorModify: function() {
		this.$.designer.refresh();
		this.refreshComponentView();
	},
	componentViewDrop: function(inSender, inEvent) {
		return this.$.designer.drop(inSender, inEvent);
	},
	dragStart: function(inSender, inEvent) {
		return true;
	},
	drag: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			this.$.dragAvatar.drag(inEvent);
			return true;
		}
	},
	dragFinish: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			inEvent.preventTap();
			this.$.dragAvatar.hide();
			//this.refreshInspector();
			return true;
		}
	}
});

