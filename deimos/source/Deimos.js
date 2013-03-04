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
			{kind: "onyx.Toolbar", layoutKind: "FittableColumnsLayout", name: "toolbar", components: [
				{name: "docLabel", content: "Deimos"},
				{kind: "onyx.PickerDecorator", components: [
					{name: "kindButton", kind: "onyx.PickerButton"},
					{name: "kindPicker", kind: "onyx.Picker", onChange: "kindSelected", components: [
					]}
				]},
				{kind: "onyx.Button", content: "Code Editor", ontap: "closeDesignerAction", style: "float:right;"}
			]},
			{name: "body", fit: true, classes: "deimos_panel_body", kind: "FittableColumns", components: [
				{name: "left", classes:"ares_deimos_left", kind: "Palette", name:"palette"},
				{name: "middle", fit: true, kind: "FittableRows", style: "border:1px solid #D0D0D0;margin:0px 4px;", components: [
					{kind: "IFrameDesigner", name: "designer", fit: true,
						onSelect: "designerSelect",
						onSelected: "designerSelected",
						onDesignRendered: "designRendered",
						onSyncDropTargetHighlighting: "syncComponentViewDropTargetHighlighting",
					},
				]},
				{name: "right", classes:"ares_deimos_right", kind: "FittableRows", components: [
					{kind: "FittableColumns", components: [
						{name:"upButton", kind: "onyx.Button", content: "Up", ontap: "upAction"},
						{name:"downButton", kind: "onyx.Button", content: "Down", ontap: "downAction"},
						{name:"deleteButton", kind: "onyx.Button", content: "Delete", classes: "btn-danger",  ontap: "deleteAction"}
					]},
					{kind: "ComponentView", classes: "deimos_panel ares_deimos_componentView",
						onSelect: "componentViewSelect",
						onHighlightDropTarget: "highlightDesignerDropTarget",
						onUnHighlightDropTargets: "unhighlightDesignerDropTargets",
						onDrop: "componentViewDrop",
						onPaletteDrop: "componentViewPaletteDrop"
					},
					{kind: "Inspector", fit: true, classes: "deimos_panel", onModify: "inspectorModify"}
				]}
			]}
		]}
	],
	events: {
		onCloseDesigner: "",
		onDesignerUpdate: ""
	},
	kinds: null,
	create: function() {
		this.inherited(arguments);
		this.kinds=[];
		this.index=null;
		this.addHandlers();
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
		
		this.index = null;
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

		this.$.kindButton.applyStyle("width", (maxLen+2) + "em");
		this.$.kindPicker.render();
		this.setEdited(false);
		
		// Pass the project information (analyzer output, ...) to the inspector
		this.$.inspector.setProjectData(data.projectData);
		this.$.inspector.setFileIndexer(data.fileIndexer);
		// Pass the analyzer output to the palette
		this.$.palette.setProjectData(data.projectData);
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
			this.$.designer.setCurrentKind(kind);
		}
		
		this.index = index;
		this.$.kindButton.setContent(kind.name);
		this.$.toolbar.reflow();
		return true; // Stop the propagation of the event
	},
	refreshInspector: function() {
		enyo.job("inspect", enyo.bind(this, function() {
			this.$.inspector.inspect(this.$.designer.selection);
		}), 200);
	},
	refreshComponentView: function(inComponents) {
		this.$.componentView.visualize(inComponents);
	},
	// New selected item triggered in iframe. Synchronize component view and refresh inspector.
	designerSelect: function(inSender, inEvent) {
		var c = inSender.selection;
		this.refreshInspector();
		this.$.componentView.setSelected(c);
		// TODO this.enableDisableButtons(c);
		return true;
	},
	// Select event triggered by component view was completed. Refresh inspector.
	designerSelected: function(inSender, inEvent) {
		this.refreshInspector();
		return true;
	},
	componentViewSelect: function(inSender, inEvent) {
		this.$.designer.select(inEvent.component);
		// TODO this.enableDisableButtons(c);
		return true;
	},
	syncComponentViewDropTargetHighlighting: function(inSender, inEvent) {
		this.$.componentView.syncDropTargetHighlighting(inEvent.component);
	},
	highlightDesignerDropTarget: function(inSender, inEvent) {
		this.$.designer.highlightDropTarget(inEvent.component);
		return true;
	},
	unhighlightDesignerDropTargets: function(inSender, inEvent) {
		this.$.designer.unHighlightDropTargets();
		return true;
	},
	//* A control was dropped on the component view
	componentViewDrop: function(inSender, inEvent) {
		return this.$.designer.drop(inEvent);
	},
	//* A control from the Palette was dropped on the component view
	componentViewPaletteDrop: function(inSender, inEvent) {
		this.$.designer.createNewControl(inEvent);
	},
	inspectorModify: function(inSender, inEvent) {
		this.$.designer.modifyProperty(inEvent.name, inEvent.value);
		return true;
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
		this.$.designer.cleanUp();
		var event = this.prepareDesignerUpdate();
		this.$.inspector.setProjectData(null);
		this.doCloseDesigner(event);
		this.setEdited(false);
		return true; // Stop the propagation of the event
	},
	// When the designer finishes rendering, re-build the components view
	// TODO: Build this from the Model, not by trawling the view hierarchy...
	designRendered: function(inSender, inEvent) {
		this.refreshComponentView(inEvent.components);
		this.setEdited(true);
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
	},
	//* Called by Ares when ProjectView has new project selected
	projectSelected: function(inProject) {
		this.$.designer.updateSource(inProject);
	},
	//*
	reloadIFrame: function() {
		this.$.designer.reloadIFrame();
	},
	syncCSSFile: function(inFilename, inCode) {
		this.$.designer.syncCSSFile(inFilename, inCode);
	},
	syncJSFile: function(inCode) {
		this.$.designer.syncJSFile(inCode);
	},
	//* Add dispatch for native drag events
	addHandlers: function(inSender, inEvent) {
		document.ondragstart = enyo.dispatch;
		document.ondrag =      enyo.dispatch;
		document.ondragenter = enyo.dispatch;
		document.ondragleave = enyo.dispatch;
		document.ondragover =  enyo.dispatch;
		document.ondrop =      enyo.dispatch;
		document.ondragend =   enyo.dispatch;
	}
});

