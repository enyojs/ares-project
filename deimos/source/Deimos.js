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
						onMoveItem: "moveItem",
						onCreateItem: "createItem",
						onSyncDropTargetHighlighting: "syncComponentViewDropTargetHighlighting"
					},
				]},
				{name: "right", classes:"ares_deimos_right", kind: "FittableRows", components: [
					{kind: "FittableColumns", components: [
						{name:"upButton", kind: "onyx.Button", content: "Up", ontap: "upAction"},
						{name:"downButton", kind: "onyx.Button", content: "Down", ontap: "downAction"},
						{name:"deleteButton", kind: "onyx.Button", content: "Delete", classes: "btn-danger",  ontap: "deleteAction"},
						{name:"undoButton", kind: "onyx.Button", content: "Undo", classes: "btn-danger",  ontap: "undoAction"},
						{name:"redoButton", kind: "onyx.Button", content: "Redo", classes: "btn-danger",  ontap: "redoAction"}
					]},
					{kind: "ComponentView", classes: "deimos_panel ares_deimos_componentView",
						onSelect: "componentViewSelect",
						onHighlightDropTarget: "highlightDesignerDropTarget",
						onUnHighlightDropTargets: "unhighlightDesignerDropTargets",
						onMoveItem: "moveItem",
						onCreateItem: "createItem"
					},
					{kind: "Inspector", fit: true, classes: "deimos_panel", onModify: "inspectorModify"}
				]}
			]}
		]}
	],
	events: {
		onCloseDesigner: "",
		onDesignerUpdate: "",
		onUndo: "",
		onRedo: ""
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
		
		// Pass the project information (analyzer output, ...) to the inspector and palette
		this.$.inspector.setProjectData(data.projectData);
		this.$.palette.setProjectData(data.projectData);
	},
	kindSelected: function(inSender, inEvent) {
		var index = inSender.getSelected().index;
		var kind = this.kinds[index];
		
		this.addAresIds(this.kinds[index].components);
		this.$.inspector.initUserDefinedAttributes(this.kinds[index].components);
		
		if (index !== this.index) {
			
			// If edited, save these changes in Ares TODO
			if (this.index !== null && this.getEdited()) {
				this.designerUpdate();
			}
			
			this.$.inspector.inspect(null);
			this.$.designer.setCurrentKind(kind);
		}
		
		this.index = index;
		this.$.kindButton.setContent(kind.name);
		this.$.toolbar.reflow();
		
		return true;
	},
	//* Rerender current kind
	rerenderKind: function() {
		this.$.designer.setCurrentKind(this.kinds[this.index]);
		this.$.designer.renderCurrentKind();
		this.designerUpdate();
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
		return true;
	},
	// Select event triggered by component view was completed. Refresh inspector.
	designerSelected: function(inSender, inEvent) {
		this.refreshInspector();
		return true;
	},
	componentViewSelect: function(inSender, inEvent) {
		this.$.designer.select(inEvent.component);
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
	inspectorModify: function(inSender, inEvent) {
		this.$.designer.modifyProperty(inEvent.name, inEvent.value);
		return true;
	},
	prepareDesignerUpdate: function() {
		if (this.index !== null) {
			// Prepare the data for the code editor
			var event = {docHasChanged: this.getEdited(), contents: []};
			for(var i = 0 ; i < this.kinds.length ; i++) {
				event.contents[i] = this.kinds[i].updatedComponents;
			}
			return event;
		}
	},
	closeDesignerAction: function(inSender, inEvent) {
		this.$.designer.cleanUp();
		
		var event = this.prepareDesignerUpdate();
		this.$.inspector.setProjectData(null);
		this.doCloseDesigner(event);
		this.setEdited(false);
		
		return true;
	},
	// When the designer finishes rendering, re-build the components view
	designRendered: function(inSender, inEvent) {
		var components = enyo.json.codify.from(inEvent.content);

		this.refreshComponentView(components);
		this.setEdited(true);
		
		// Recreate this kind's components block based on components in Designer and user-defined properties in Inspector.
		this.kinds[this.index].updatedComponents = enyo.json.codify.to(this.cleanUpComponents(components));
		
		return true;
	},
	//* Create item from palette (via drag-and-drop from Palette into Designer or Component View)
	createItem: function(inSender, inEvent) {
		var config = inEvent.config,
			targetId = inEvent.targetId;
		
		if(!config) {
			enyo.warn("Could not create new item - bad data: ", inEvent);
			return true;
		}
		
		// Give the new component a fresh _aresId_
		config.aresId = this.generateNewAresId();
		
		// If target has an id, add to appropriate components array. Otherwise add to topmost component.
		if(targetId) {
			this.createItemOnTarget(config, targetId, this.kinds[this.index].components);
		} else {
			this.kinds[this.index].components.push(config);
		}
		
		// Update user defined values
		this.$.inspector.initUserDefinedAttributes(this.kinds[this.index].components);
		
		this.rerenderKind();
		
		return true;
	},
	createItemOnTarget: function(inConfig, inTargetId, inComponents) {
		for (var i = 0, component; (component = inComponents[i]); i++) {
			if(component.aresId === inTargetId) {
				if(component.components) {
					component.components.push(inConfig);
				} else {
					component.components = [inConfig];
				}
			}
			if(component.components) {
				this.createItemOnTarget(inConfig, inTargetId, component.components);
			}
		}
	},
	//* Move item with _inEvent.itemId_ into item with _inEvent.targetId_
	moveItem: function(inSender, inEvent) {
		var clone = enyo.clone(this.getItemById(inEvent.itemId, this.kinds[this.index].components)),
			target = (inEvent.targetId) ? this.getItemById(inEvent.targetId, this.kinds[this.index].components) : this.kinds[this.index];
		
		this.removeItemById(inEvent.itemId, this.kinds[this.index].components);
		
		target.components = target.components || [];
		target.components.push(clone);
		
		this.rerenderKind();
		
		return true;
	},
	getItemById: function(inId, inComponents) {
		for (var i = 0, component, item; (component = inComponents[i]); i++) {
			if (component.aresId === inId) {
				item = inComponents[i];
			} else if (component.components) {
				item = this.getItemById(inId, component.components);
			}
			if(item) {
				return item;
			}
		}
	},
	//* Look through _inComponents_ recursively and splice out the item with an _aresId_ matching _inId_
	removeItemById: function(inId, inComponents) {
		for (var i = 0, component; (component = inComponents[i]); i++) {
			if (component.aresId === inId) {
				inComponents.splice(i, 1);
				return;
			}
			if (component.components) {
				this.removeItemById(inId, component.components);
			}
		}
	},
	cleanUpComponents: function(inComponents) {
		var component,
			ret = [],
			i;
		
		for (i=0; (component = inComponents[i]); i++) {
			ret.push(this.cleanUpComponent(component));
		}
		
		return ret;
	},
	cleanUpComponent: function(inComponent) {
		var aresId = inComponent.aresId,
			childComponents = [],
			cleanComponent = {},
			atts,
			att,
			i;
		
		if (!aresId) {
			return cleanComponent;
		}
		
		atts = this.$.inspector.userDefinedAttributes[aresId];
		
		if (!atts) {
			return cleanComponent;
		}
		
		// Copy each user-defined property from _atts_ to the cleaned component
		for (att in atts) {
			if (att !== "aresId" && att !== "components") {
				cleanComponent[att] = atts[att];
			}
		}
		
		// If this component has any child components, add them to components[] block
		if (inComponent.components) {
			
			// Recurse through child components
			for (var i=0; i<inComponent.components.length; i++) {
				childComponents.push(this.cleanUpComponent(inComponent.components[i]));
			}
			
			if (childComponents.length > 0) {
				cleanComponent.components = childComponents;
			}
		}
		
		return cleanComponent;
	},
	saveComplete: function() {
		this.setEdited(false);
	},
	upAction: function(inSender, inEvent) {
		this.$.componentView.upAction(inSender, inEvent);
	},
	downAction: function(inSender, inEvent) {
		this.$.componentView.downAction(inSender, inEvent);
	},
	undoAction: function(inSender, inEvent) {
		this.doUndo();
	},
	redoAction: function(inSender, inEvent) {
		this.doRedo();
	},
	deleteAction: function(inSender, inEvent) {
		if(!this.$.designer.selection) {
			return;
		}
		
		this.deleteComponentByAresId(this.$.designer.selection.aresId, this.kinds[this.index].components);
		this.rerenderKind();
	},
	deleteComponentByAresId: function(inAresId, inComponents) {
		for (var i = 0; i < inComponents.length; i++) {
			if (inComponents[i].aresId === inAresId) {
				inComponents.splice(i, 1);
				return;
			}
			
			if (inComponents[i].components) {
				this.deleteComponentByAresId(inAresId, inComponents[i].components);
			}
		}
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
	designerUpdate: function() {
		this.doDesignerUpdate(this.prepareDesignerUpdate());
	},
	//* Called by Ares when ProjectView has new project selected
	projectSelected: function(inProject) {
		this.$.designer.updateSource(inProject);
	},
	//*
	reloadIFrame: function() {
		this.$.designer.reloadIFrame();
	},
	syncJSFile: function(inCode) {
		this.$.designer.syncJSFile(inCode);
	},
	syncCSSFile: function(inFilename, inCode) {
		this.$.designer.syncCSSFile(inFilename, inCode);
	},
	addAresIds: function(inComponents) {
		for(var i = 0; i < inComponents.length; i++) {
			
			if (!inComponents[i].aresId) {
				inComponents[i].aresId = this.generateNewAresId();
			}
			
			if (inComponents[i].components) {
				this.addAresIds(inComponents[i].components);
			}
		}
	},
	//* Generate new ares id using timestamp
	generateNewAresId: function() {
		return "ares_"+Math.floor((Math.random()*new Date().getTime())+1);
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

