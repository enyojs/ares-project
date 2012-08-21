enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable",
	components: [
		{kind: "Signals", onload: "documentLoaded"},
		{kind: "DragAvatar", components: [ 
			{tag: "img", src: "images/icon.png", style: "width: 24px; height: 24px;"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 0 10px;", components: [
				{name: "docLabel", content: "Deimos"},
				{kind: "onyx.PickerDecorator", components: [
				    {name: "kindButton", kind: "onyx.PickerButton"}, //this uses the defaultKind property of PickerDecorator to inherit from PickerButton
				    {name: "kindPicker", kind: "onyx.Picker", onChange: "kindSelected", components: [
				    ]}
				]},
				{fit: true},
				{kind: "onyx.Button", content: "Code Editor", ontap: "closeDesignerAction"}
			]},
			{name: "body", fit: true, kind: "FittableColumns", components: [
				{name: "left", kind: "Palette", ondragstart: "dragStart"},
				{name: "middle", fit: true, kind: "FittableRows",components: [
					{kind: "Designer", fit: true, onChange: "designerChange", onSelect: "designerSelect", ondragstart: "dragStart"},
					{name: "code", classes: "deimos_panel", components: [
						{kind: "Scroller", classes: "enyo-selectable", components: [
							{name: "codeText", tag: "pre", style: "white-space: pre; font-size: smaller; border: none; margin: 0;"}
						]}
					]}
				]},
				{name: "right", kind: "FittableRows", components: [
					{kind: "ComponentView", classes: "deimos_panel", onSelect: "componentViewSelect", ondrop: "componentViewDrop"},
					{kind: "Inspector", fit: true, classes: "deimos_panel", onModify: "inspectorModify"}
				]}
			]}
		]}
	],
	handlers: {
		ondrag: "drag",
		ondragfinish: "dragFinish",
		ondrop: "drop"
	},
	kinds: null,
	create: function() {
		this.inherited(arguments);
	},
	//TODO: This only exists for standalong Deimos testing. Remove it?
	load: function(what) {
		this.kinds = what;
		this.$.kindPicker.destroyClientControls();
		for (var i = 0; i < what.length; i++) {
			var k = what[i];
			this.$.kindPicker.createComponent({
				content: k.name,
				index: i
        	});
    	}
		this.$.kindPicker.setSelected(this.$.kindPicker.getClientControls()[0]);
	},
	documentLoaded: function(ev) {
		this.newDocumentAction();
	},
	kindSelected: function(inSender, inEvent) {
		var kind = inSender.getSelected().index;
		var components = this.kinds[kind].content;
		this.$.inspector.inspect(null);
		this.$.designer.load(components);		
	},
	newDocumentAction: function() {
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
	// called after updating model
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
	},
	closeDesignerAction: function(inSender, inEvent) {
		this.bubble("onCloseDesigner", {});
	}
});

