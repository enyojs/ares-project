enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable",
	components: [
		{kind: "DragAvatar", components: [ 
			{tag: "img", src: "$deimos/images/icon.png", style: "width: 24px; height: 24px;"}
		]},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", Xstyle: "margin: 0 10px;", name: "toolbar", components: [
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
					{kind: "Designer", fit: true, onChange: "designerChange", onSelect: "designerSelect", ondragstart: "dragStart", onDesignRendered: "designRendered"},
					{name: "code", classes: "deimos_panel", showing: false, components: [
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
	events: {
		onCloseDesigner: ""
	},
	kinds: null,
	docHasChanged: false,
	create: function() {
		this.inherited(arguments);
		this.kinds=[];
		this.index=null;
	},
	load: function(what) {
		this.kinds = what;
		this.$.kindPicker.destroyClientControls();
		for (var i = 0; i < what.length; i++) {
			var k = what[i];
			this.$.kindPicker.createComponent({
				content: k.name,
				index: i,
				active: (i==0)
        	});
    	}
		this.index=null;
		this.$.kindPicker.render();
		this.docHasChanged = false;
	},
	kindSelected: function(inSender, inEvent) {
		/* FIXME
		 * Strange: this function is always called twice for each change
		 * If we return true, it is called only once 
		 * but the PickerButton is not rendered correctly.
		 */
		var index = inSender.getSelected().index;
		var kind = this.kinds[index];
		
		if (index != this.index) {
			
			if (this.index !== null && this.docHasChanged === true) {
				var modified = this.$.designer.getComponents();
				this.kinds[this.index].components = modified;
				this.kinds[this.index].content = this.$.designer.save();
			}
			
			this.$.inspector.inspect(null);
			this.$.designer.load(kind.components);
		}

		this.index=index;
		this.$.toolbar.reflow();
		return true; // Stop the propagation of the event
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
		this.refreshInspector();
		this.docHasChanged = true;
		return true; // Stop the propagation of the event
	},
	designerSelect: function(inSender, inEvent) {
		this.refreshInspector();
		this.$.componentView.select(inSender.selection);
		return true; // Stop the propagation of the event
	},
	componentViewSelect: function(inSender) {
		this.$.designer.select(inSender.selection);
		this.refreshInspector();
		return true; // Stop the propagation of the event
	},
	inspectorModify: function() {
		this.$.designer.refresh();
		this.docHasChanged = true;
		return true; // Stop the propagation of the event
	},
	componentViewDrop: function(inSender, inEvent) {
		return this.$.designer.drop(inSender, inEvent);
	},
	dragStart: function(inSender, inEvent) {
		return true; // Stop the propagation of the event
	},
	drag: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			this.$.dragAvatar.drag(inEvent);
			return true; // Stop the propagation of the event
		}
	},
	dragFinish: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			inEvent.preventTap();
			this.$.dragAvatar.hide();
			//this.refreshInspector();
			return true; // Stop the propagation of the event
		}
	},
	closeDesignerAction: function(inSender, inEvent) {
		// Get the last modifications
		this.kinds[this.index].content = this.$.designer.save();
		
		// Prepare the data for the code editor
		var event = {docHasChanged: this.docHasChanged, contents: []};
		for(var i = 0 ; i < this.kinds.length ; i++ ) {
			event.contents[i] = this.kinds[i].content;
		}

		this.doCloseDesigner(event);
		return true; // Stop the propagation of the event
	},
	// When the designer finishes rendering, re-build the components view
	// TODO: Build this from the Model, not by trawling the view hierarchy...
	designRendered: function() {
		this.refreshComponentView();
		return true; // Stop the propagation of the event
	}
});

