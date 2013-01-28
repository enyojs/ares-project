enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable onyx",
	published: {
		edited: false
	},
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
			{name: "body", fit: true, classes: "deimos_panel_body",kind: "FittableColumns", components: [
				{name: "left", classes:"ares_deimos_left", kind: "Palette", ondragstart: "dragStart"},
				{name: "middle", fit: true, kind: "FittableRows",components: [
					{kind: "Designer", fit: true, onChange: "designerChange", onSelect: "designerSelect", ondragstart: "dragStart", onDesignRendered: "designRendered"},
				]},
				{name: "right", classes:"ares_deimos_right", kind: "FittableRows", components: [
					{kind: "FittableColumns", components: [
						{name:"upButton", kind: "onyx.Button", content: "Up", ontap: "upAction"},
						{name:"downButton", kind: "onyx.Button", content: "Down", ontap: "downAction"},
						{name:"deleteButton", kind: "onyx.Button", content: "Delete", classes: "btn-danger",  ontap: "deleteAction"}
					]},
					{kind: "ComponentView", classes: "deimos_panel ares_deimos_componentView", onSelect: "componentViewSelect", ondrop: "componentViewDrop"},
					{kind: "Inspector", fit: true, classes: "deimos_panel", onModify: "inspectorModify"}
				]}
			]}
		]}
	],
	handlers: {
		ondrag: "drag",
		ondragfinish: "dragFinish"
	},
	events: {
		onCloseDesigner: "",
		onDesignerUpdate: ""
	},
	kinds: null,
	create: function() {
		this.inherited(arguments);
		this.kinds=[];
		this.index=null;
	},
	/**
	 * Loads the first kind passed thru the data parameter
	 * @param data contains kinds declaration (enyo.kind format)
	 *   and project information such as the analyzer output
	 *   for all the .js files of the project and for enyo/onyx.
	 * @public
	 */
	load: function(data) {
		var what = data.kinds;
		var maxLen = 0;
		this.index=null;
		this.kinds = what;
		this.$.kindPicker.destroyClientControls();
		for (var i = 0; i < what.length; i++) {
			var k = what[i];
			this.$.kindPicker.createComponent({
				content: k.name,
				index: i,
				active: (i==0)
			});
			maxLen = Math.max(k.name.length, maxLen);
		}
		//this.index=0; //this is set in KindSelected
		this.$.kindButton.applyStyle("width", (maxLen+2) + "em");
		this.$.kindPicker.render();
		this.setEdited(false);

		// Pass the project information (analyzer output, ...) to the inspector
		this.$.inspector.setProjectData(data.projectData);
		this.$.inspector.setFileIndexer(data.fileIndexer);
	},
	kindSelected: function(inSender, inEvent) {
		/* FIXME
		 * Strange: this function is always called twice for each change
		 * If we return true, it is called only once
		 * but the PickerButton is not rendered correctly.
		 */
		var index = inSender.getSelected().index;
		var kind = this.kinds[index];

		if (index !== this.index) {

			if (this.index !== null && this.getEdited()) {
				// save changes when switching kinds
				var modified = this.$.designer.getComponents();
				this.kinds[this.index].components = modified;
				this.kinds[this.index].content = this.$.designer.save();
				this.sendUpdateToAres();
			}

			this.$.inspector.inspect(null);
			this.$.designer.load(kind);
			this.refreshComponentView();
		}

		this.index=index;
		this.$.kindButton.setContent(kind.name);
		this.$.toolbar.reflow();
		return true; // Stop the propagation of the event
	},
	refreshInspector: function() {
		enyo.job("inspect", enyo.bind(this, function() {
			this.$.inspector.inspect(this.$.designer.selection);
		}), 200);
	},
	refreshComponentView: function() {
		this.$.componentView.visualize(this.$.designer.$.sandbox, this.$.designer.$.model);
		this.$.componentView.select(this.$.designer.selection);
	},
	designerChange: function(inSender) {
		this.refreshComponentView();
		this.refreshInspector();
		this.setEdited(true);
		//TODO: Is it "worth it" to send all intermediate updates to the editor?
		this.sendUpdateToAres();
		return true; // Stop the propagation of the event
	},
	designerSelect: function(inSender, inEvent) {
		var c = inSender.selection;
		this.refreshInspector();
		this.$.componentView.select(c);
		this.enableDisableButtons(c);
		return true; // Stop the propagation of the event
	},
	componentViewSelect: function(inSender) {
		var c = inSender.selection;
		this.$.designer.select(c);
		this.refreshInspector();
		this.enableDisableButtons(c);
		return true; // Stop the propagation of the event
	},
	inspectorModify: function() {
		this.refreshComponentView();
		this.$.designer.refresh();
		this.setEdited(true);
		//TODO: Is it "worth it" to send all intermediate updates to the editor?
		this.sendUpdateToAres();
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
	prepareDesignerUpdate: function() {
		if (this.index !== null) {
			// Get the last modifications
			this.kinds[this.index].content = this.$.designer.save();

			// Prepare the data for the code editor
			var event = {docHasChanged: this.getEdited(), contents: []};
			for(var i = 0 ; i < this.kinds.length ; i++ ) {
				event.contents[i] = this.kinds[i].content;
			}
			return event;
		}
	},
	closeDesignerAction: function(inSender, inEvent) {
		// Prepare the data for the code editor
		var event = this.prepareDesignerUpdate();
		this.$.inspector.setProjectData(null);
		this.doCloseDesigner(event);
		return true; // Stop the propagation of the event
	},
	// When the designer finishes rendering, re-build the components view
	// TODO: Build this from the Model, not by trawling the view hierarchy...
	designRendered: function() {
		this.refreshComponentView();
		return true; // Stop the propagation of the event
	},
	saveComplete: function() {
		this.setEdited(false);
	},
	upAction: function(inSender, inEvent) {
		this.$.designer.upAction(inSender, inEvent);
	},
	downAction: function(inSender, inEvent) {
		this.$.designer.downAction(inSender, inEvent);
	},
	deleteAction: function(inSender, inEvent) {
		this.$.designer.deleteAction(inSender, inEvent);
	},
	enableDisableButtons: function(control) {
		var disabled = this.$.designer.isRootControl(control);
		this.$.upButton.setDisabled(disabled);
		this.$.downButton.setDisabled(disabled);
		this.$.deleteButton.setDisabled(disabled);
	},
	editedChanged: function() {
		// Note: This doesn't look like it does anything, because we send updates to the document to Ares immediately, so a doc is 
		// only "edited" for a few ms. I left this in here because I was tracking down some cases where the state stayed "edited"
		if (this.edited) {
			this.$.docLabel.setContent("Deimos *");
		} else {
			this.$.docLabel.setContent("Deimos");
		}
	},
	sendUpdateToAres: function() {
		this.doDesignerUpdate(this.prepareDesignerUpdate());
		this.setEdited(false);
	}
});

