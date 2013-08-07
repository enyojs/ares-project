enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable onyx",
	published: {
		edited: false
	},
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{name: "body", fit: true, classes: "deimos_panel_body", kind: "FittableColumns", components: [
				{name: "left", classes:"ares_deimos_left", kind: "Palette", name:"palette"},
				{name: "middle", fit: true, kind: "FittableRows", components: [
					{kind: "onyx.MoreToolbar", classes: "deimos-toolbar", components: [
						{kind: "onyx.Button", name: "reloadDesignerButton", classes: "deimos-designer-toolbar-spacing", content: "Reload", ontap: "reloadDesigner"},
						{content: "Size:"},
						{kind: "onyx.PickerDecorator", classes: "deimos-device-picker deimos-designer-toolbar-spacing", components: [
							{style: "width:100%;"},
							{kind: "onyx.Picker", name: "devicePicker", ontap: "deviceChosen", components: [
								{content: "(600 x 800) Default",		value: { height: 800,  width: 600 }},
								{content: "(1920 x 1080) HDTV",			value: { height: 1080, width: 1920 }},
								{content: "(320 x 480) iPhone\u2122",	value: { height: 480,  width: 320 }},
								{content: "(320 x 573) iPhone\u2122 5",	value: { height: 573,  width: 320 }},
								{content: "(1024 x 768) iPad\u2122",	value: { height: 768,  width: 1024 }},
								{content: "Custom"}
							]}
						]},
						{content: "Width:"},
						{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", name: "designerWidthInput", classes: "deimos-designer-input", placeholder: "Auto", onchange: "updateWidth"}
						]},
						{kind: "onyx.Button", name: "swapDesignerDimensionsButton", classes: "deimos-swap-dimensions-button", allowHtml: true, content: "&larr;<br/>&rarr;", ontap: "swapDesignerDimensions"},
						{content: "Height:"},
						{kind: "onyx.InputDecorator", classes: "deimos-designer-toolbar-spacing", components: [
							{kind: "onyx.Input", name: "designerHeightInput", classes: "deimos-designer-input", placeholder: "Auto", onchange: "updateHeight"}
						]},
						{content: "Zoom:"},
						{kind: "onyx.Slider", classes: "deimos-zoom-slider", value: 100, onChange: 'zoomDesigner', onChanging: 'zoomDesigner' }
					]},
					{kind: "Scroller", classes: "deimos-designer-wrapper", fit: true, components: [
						{kind: "IFrameDesigner", name: "designer",
							onSelect: "designerSelect",
							onSelected: "designerSelected",
							onDesignRendered: "designRendered",
							onMoveItem: "moveItem",
							onCreateItem: "createItem",
							onSyncDropTargetHighlighting: "syncComponentViewDropTargetHighlighting",
							onReloadComplete: "reloadComplete",
							onResizeItem: "resizeItem",
							onReturnPositionValue: "designerReturnPositionValue"
						},
					]}
				]},				
				{name: "right", classes:"ares_deimos_right", kind: "FittableRows", components: [
					{kind: "onyx.MoreToolbar", classes: "deimos-toolbar deimos-toolbar-margined-buttons", components: [
						{name:"deleteButton", kind: "onyx.Button", content: "Delete", classes: "btn-danger",  ontap: "deleteAction"},
						{name:"undoButton", kind: "onyx.Button", content: "Undo", classes: "btn-danger",  ontap: "undoAction"},
						{name:"redoButton", kind: "onyx.Button", content: "Redo", classes: "btn-danger",  ontap: "redoAction"}
					]},
					
					{kind: "ComponentView", classes: "deimos_panel ares_deimos_componentView",
						onSelect: "componentViewSelect",
						onHighlightDropTarget: "highlightDesignerDropTarget",
						onUnHighlightDropTargets: "unhighlightDesignerDropTargets",
						onMoveItem: "moveItem",
						onCreateItem: "createItem",
						onHoldOver: "holdOver"
					},
					
					{kind: "Inspector", fit: true, classes: "deimos_panel",
						onModify: "inspectorModify",
						onRequestPositionValue: "inspectorRequestPositionValue",
						onPositionDataUpdated: "inspectorPositionDataUpdated",
						onControlDynamicUI: "inspectorControlDynamicUI"
					}
				]}
			]}
		]}
	],
	/**
		Select the first item in _this.$.picker_ to iniitalize (do this after
		rendering to avoid error with setting values of width/height fields)
	*/
	events: {
		onCloseDesigner: "",
		onDesignerUpdate: "",
		onUndo: "",
		onRedo: "",
		onRegisterMe: ""
	},
	kinds: [],
	index: null,
	create: function() {
		this.inherited(arguments);
		this.addHandlers();
		this.doRegisterMe({name:"deimos", reference:this});
	},
	rendered: function() {
		this.inherited(arguments);
		this.initializeDesignerToolbar();
	},
	//* Initialize _devicePicker_ in the toolbar at render time
	initializeDesignerToolbar: function() {
		var initItem = this.$.devicePicker.getClientControls()[0];
		this.$.devicePicker.setSelected(initItem);
		this.deviceChosen(null, {selected: initItem});
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
		this.owner.$.kindPicker.destroyClientControls();

		// Pass the project information (analyzer output, ...) to the inspector and palette
		this.$.inspector.setProjectData(data.projectData);
		this.$.palette.setProjectData(data.projectData);

		for (var i = 0; i < what.length; i++) {
			var k = what[i];
			this.owner.$.kindPicker.createComponent({
				content: k.name,
				index: i,
				active: (i==0)
			});
			maxLen = Math.max(k.name.length, maxLen);
		}
		
		this.owner.$.kindButton.applyStyle("width", (maxLen+2) + "em");
		this.owner.$.kindPicker.render();
		this.setEdited(false);
	},
	kindSelected: function(inSender, inEvent) {
		var index = inSender.getSelected().index;
		var kind = this.kinds[index];
		
		this.addAresIds(this.kinds[index].components);
		this.addAresKindOptions(this.kinds[index].components);
		this.$.inspector.initUserDefinedAttributes(this.kinds[index].components);
		
		if (index !== this.index) {
			
			// If edited, save these changes in Ares TODO
			if (this.index !== null && this.getEdited()) {
				this.designerUpdate();
			}
			
			this.$.inspector.inspect(null);
			this.$.inspector.setCurrentKindName(kind.name);
			this.$.designer.setCurrentKind(kind);
		}
		
		this.index = index;
		this.owner.$.kindButton.setContent(kind.name);
		this.owner.$.toolbar.reflow();
		
		return true;
	},
	//* Rerender current kind
	rerenderKind: function(inSelectId) {
		this.$.designer.setCurrentKind(this.kinds[this.index]);
		this.$.designer.renderCurrentKind(inSelectId);
	},
	//* Show moonstone dynamic UI components
	showDynamicUI: function(inSelectId, inEvent) {
		this.$.designer.setCurrentKind(this.kinds[this.index]);
		this.$.designer.refreshCurrentKind(inSelectId, inEvent);
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
		if (inEvent.name === "layoutKind" && this.layoutKindUpdated(inEvent.value)) {
			return true;
		}
		
		this.$.designer.modifyProperty(inEvent.name, inEvent.value);
		return true;
	},
	inspectorRequestPositionValue: function(inSender, inEvent) {
		this.$.designer.requestPositionValue(inEvent.prop);
	},
	inspectorPositionDataUpdated: function(inSender, inEvent) {
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components),
			prop,
			val
		;
		
		for (prop in inEvent.props) {
			val = inEvent.props[prop];
			this.addReplaceStyleProp(item, prop, inEvent.props[prop]);
		}

		this.rerenderKind(item.aresId);
	},
	inspectorControlDynamicUI: function(inSender, inEvent) {
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components);
		var parentItem = this.getParentOfId(this.$.designer.selection.aresId, this.kinds[this.index]);

		switch(inEvent.inKindName) {
			case "panel":
				for (var i = 0; i < parentItem.components.length; i++) {
					if(parentItem.components[i].aresId == item.aresId) {
						inEvent.inPanelIndex = i;
						break;
					}
				}
				break;
			default:
				break;
		}

		this.showDynamicUI(parentItem.aresId, inEvent);
	},
	layoutKindUpdated: function(inLayoutKind) {
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components);
		
		if (inLayoutKind !== "AbsolutePositioningLayout" && item.layoutKind !== "AbsolutePositioningLayout") {
			return false;
		}
		
		if (inLayoutKind === "AbsolutePositioningLayout") {
			item.layoutKind = inLayoutKind;
			this.updateStyleForAbsolutePositioningLayoutKind(item);
		} else {
			item.layoutKind && delete item.layoutKind;
			this.updateStyleForNonAbsolutePositioningLayoutKind(item);
		}
		this.addAresKindOptions(this.kinds[this.index].components);
		this.rerenderKind(item.aresId);
		return true;
	},
	//* Add relative positioning to top item, and absolute positioning to it's children
	updateStyleForAbsolutePositioningLayoutKind: function(inComponent) {
		this.addReplaceStyleProp(inComponent, "position", "relative");
		
		if (inComponent.components) {
			for (var i = 0, comp; (comp = inComponent.components[i]); i++) {
				this.addAbsolutePositioning(comp);
			}
		}
	},
	//* Set position: absolute; and layoutKind = "AbsolutePositioningLayout" on _inComponent_
	addAbsolutePositioning: function(inComponent) {
		this.addReplaceStyleProp(inComponent, "position", "absolute");
		inComponent.layoutKind = "AbsolutePositioningLayout";
		this.$.inspector.userDefinedAttributes[inComponent.aresId].layoutKind = inComponent.layoutKind;
	},
	//* Add static positioning to top item and to it's children
	updateStyleForNonAbsolutePositioningLayoutKind: function(inComponent) {
		this.addReplaceStyleProp(inComponent, "position", "");
		
		if (inComponent.components) {
			for (var i = 0, comp; (comp = inComponent.components[i]); i++) {
				this.removeAbsolutePositioning(comp);
			}
		}
	},
	//* Set position: ""; and layoutKind = "" on _inComponent_
	removeAbsolutePositioning: function(inComponent) {
		this.addReplaceStyleProp(inComponent, "position", "");
		this.addReplaceStyleProp(inComponent, "top", "");
		this.addReplaceStyleProp(inComponent, "right", "");
		this.addReplaceStyleProp(inComponent, "bottom", "");
		this.addReplaceStyleProp(inComponent, "left", "");
		inComponent.layoutKind && delete inComponent.layoutKind;
		this.$.inspector.userDefinedAttributes[inComponent.aresId].layoutKind && delete this.$.inspector.userDefinedAttributes[inComponent.aresId].layoutKind;
	},
	//* Update _inComponent.style.inProp_ to be _inValue_
	addReplaceStyleProp: function(inComponent, inProp, inValue) {
		var currentStyle = inComponent.style || "",
			styleProps = {}
		;
		
		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(currentStyle), styleProps);
		
		// Add/replace inProp with inValue
		styleProps[inProp] = inValue;
		
		// Convert back to a string
		inComponent.style = enyo.Control.domStylesToCssText(styleProps);
		this.$.inspector.userDefinedAttributes[inComponent.aresId].style = inComponent.style;
	},
	prepareDesignerUpdate: function() {
		if (this.index !== null) {
			// Prepare the data for the code editor
			var event = {docHasChanged: this.getEdited(), contents: []};
			for(var i = 0 ; i < this.kinds.length ; i++) {
				event.contents[i] = enyo.json.codify.to(this.cleanUpComponents(this.kinds[i].components));
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
		this.kinds[this.index].components = this.cleanUpComponents(components, true);
		
		this.designerUpdate();
		
		return true;
	},
	//* Create item from palette (via drag-and-drop from Palette into Designer or Component View)
	createItem: function(inSender, inEvent) {
		var config = inEvent.config,
			targetId = inEvent.targetId,
			beforeId = inEvent.beforeId,
			target = (targetId)
					?	this.getItemById(targetId, this.kinds[this.index].components)
					:	this.kinds[this.index];
		
		if (!config) {
			enyo.warn("Could not create new item - bad data: ", inEvent);
			return true;
		}
		
		// Give the new component (and any children) a fresh _aresId_
		config.aresId = this.generateNewAresId();
		if (config.components) {
			this.addAresIds(config.components);
		}
		
		if (beforeId) {
			this.insertItemBefore(config, target, beforeId);
		} else {
			this.insertItem(config, target);
		}
		
		// Update user defined values
		this.$.inspector.initUserDefinedAttributes(this.kinds[this.index].components);
		this.addAresKindOptions(this.kinds[this.index].components);
		
		this.rerenderKind(config.aresId);
		return true;
	},
	//* Move item with _inEvent.itemId_ into item with _inEvent.targetId_
	moveItem: function (inSender, inEvent) {
		var movedItem = this.getItemById(inEvent.itemId, this.kinds[this.index].components),
			clone = enyo.clone(movedItem),
			beforeId = inEvent.beforeId || null,
			target = (inEvent.targetId)
					?	this.getItemById(inEvent.targetId, this.kinds[this.index].components)
					:	this.kinds[this.index]
		;
		
		// If moving item onto itself or before itself, do nothing
		if ((target === movedItem) || (beforeId !== null && beforeId === inEvent.itemId)) {
			return true;
		}
		
		// Remove existing item
		this.removeItemById(inEvent.itemId, this.kinds[this.index].components);
		
		// Apply any special layout rules
		clone = this.applyLayoutKindRules(inEvent.layoutData, clone);
		
		// Copy clone style props to inspector
		this.$.inspector.userDefinedAttributes[clone.aresId].style = clone.style;
		this.addAresKindOptions(this.kinds[this.index].components);
		
		if (beforeId) {
			if (!this.insertItemBefore(clone, target, beforeId)) {
				return true;
			}
		} else {
			this.insertItem(clone, target);
		}
		
		this.rerenderKind(inEvent.itemId);
		
		return true;
	},
	resizeItem: function(inSender, inEvent) {
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components);
		
		for (var prop in inEvent.sizeData) {
			this.addReplaceStyleProp(item, prop, inEvent.sizeData[prop]);
		}
		
		this.rerenderKind(item.aresId);
		
		return true;
	},
	//* Called when the iFrame has retrieved a requested absolute position value
	designerReturnPositionValue: function(inSender, inEvent) {
		this.$.inspector.setRequestedPositionValue(inEvent.prop, inEvent.value);
		return true;
		
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components);
		this.addReplaceStyleProp(item, inEvent.prop, inEvent.value + "px");
		this.rerenderKind(item.aresId);
	},
	applyLayoutKindRules: function(inLayoutData, inControl) {
		var layoutKind = inLayoutData && inLayoutData.layoutKind;

		switch (layoutKind) {
			case "AbsolutePositioningLayout":
				inControl.style = this.addAbsolutePositioningStyle(inLayoutData, inControl);
				break;
			default:
				inControl.style = this.removeAbsolutePositioningStyle(inControl);
				break;
		}
		
		return inControl;
	},
	//* Add absolute positioning styling
	addAbsolutePositioningStyle: function(inLayoutData, inControl) {
		var currentStyle = inControl.style || "",
			styleProps = {}
		;
		
		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(currentStyle), styleProps);
		
		// Add absolute positioning styles (default to top and left)
		styleProps.position = "absolute";
		
		// If only top property, or no top or bottom property, add top
		if (styleProps.top || (!styleProps.top && !styleProps.bottom)) {
			styleProps.top = inLayoutData.bounds.top + "px";
		}
		// If bottom add bottom
		if (styleProps.bottom) {
			styleProps.bottom = inLayoutData.bounds.bottom + "px";
		}
		
		// If only left property, or no left or right property, add left
		if (styleProps.left || (!styleProps.left && !styleProps.right)) {
			styleProps.left = inLayoutData.bounds.left + "px";
		}
		// If right add right
		if (styleProps.right) {
			styleProps.right = inLayoutData.bounds.right + "px";
		}
		
		// Convert back to a string and return
		return enyo.Control.domStylesToCssText(styleProps);
	},
	removeAbsolutePositioningStyle: function(inControl) {
		var currentStyle = inControl.style || "",
			styleProps = {},
			prop,
			i
		;
		
		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(currentStyle), styleProps);
		
		// Remove absolute positioning styles
		styleProps.position = styleProps.top = styleProps.right = styleProps.bottom = styleProps.left = "";
		
		// Convert back to a string and return
		return enyo.Control.domStylesToCssText(styleProps);
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		return inStr.replace(/\s/g, "");
	},
	//* Holdover event from ComponentView - simulate drop in designer
	holdOver: function(inSender, inEvent) {
		this.$.designer.prerenderDrop(inEvent.targetId, inEvent.beforeId);
	},
	insertItem: function(inItem, inTarget) {
		inTarget.components = inTarget.components || [];
		inTarget.components.push(inItem);
	},
	insertItemBefore: function(inItem, inTarget, inBeforeId) {
		var beforeIndex = -1,
			component,
			i;
		
		inTarget.components = inTarget.components || [];
		
		for (i = 0; (component = inTarget.components[i]); i++) {
			if(component.aresId === inBeforeId) {
				beforeIndex = i;
				break;
			}
		}
		
		if (beforeIndex === -1) {
			enyo.warn("Couldn't find id: "+inBeforeId+" in ", inTarget);
			return false;
		}
		
		inTarget.components.splice(beforeIndex, 0, inItem);
		return true;
	},
	getItemById: function(inId, inComponents) {
		if (inComponents.length === 0) {
			return;
		}
		
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
	getParentOfId: function(inChildId, inParent) {
		for (var i = 0, component, item; (component = inParent.components[i]); i++) {
			if (component.aresId === inChildId) {
				item = inParent;
			} else if (component.components) {
				item = this.getParentOfId(inChildId, component);
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
	cleanUpComponents: function(inComponents, inKeepAresIds) {
		var component,
			ret = [],
			i;
		
		for (i=0; (component = inComponents[i]); i++) {
			ret.push(this.cleanUpComponent(component, inKeepAresIds));
		}
		
		return ret;
	},
	cleanUpComponent: function(inComponent, inKeepAresIds) {
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
			if ((inKeepAresIds && att === "aresId") || (att !== "aresId" && att !== "components" && att !== "__aresOptions")|| (att !== "aresId" && att !== "content")) {
				cleanComponent[att] = atts[att];
			}
		}
		
		// If this component has any child components, add them to components[] block
		if (inComponent.components) {
			
			// Recurse through child components
			for (var i=0; i<inComponent.components.length; i++) {
				childComponents.push(this.cleanUpComponent(inComponent.components[i], inKeepAresIds));
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
			this.owner.$.docLabel.setContent("Deimos *");
		} else {
			this.owner.$.docLabel.setContent("Deimos");
		}
		this.owner.$.toolbar.resized();
	},
	designerUpdate: function() {
		this.doDesignerUpdate(this.prepareDesignerUpdate());
	},
	//* Called by Ares when ProjectView has new project selected
	projectSelected: function(inProject) {
		this.$.designer.updateSource(inProject);
	},
	reloadDesigner: function() {
		this.$.designer.reload();
		this.$.inspector.inspect(null);
	},
	reloadComplete: function() {
		this.rerenderKind();
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
	addAresKindOptions: function(inComponents) {
		for(var i = 0; i < inComponents.length; i++) {
			this.addOptionsToComponent(inComponents[i]);
			if (inComponents[i].components) {
				this.addAresKindOptions(inComponents[i].components);
			}
		}
	},
	addOptionsToComponent: function(inComponent) {
		var options = Model.getKindOptions(inComponent.kind);
		if (options) {
			inComponent.__aresOptions = options;
		}
	},
	//* Generate new ares id using timestamp
	generateNewAresId: function() {
		return "ares_"+Math.floor((Math.random()*new Date().getTime())+1);
	},
	//* When a device is chosen in the designer toolbar, set the appropriate heights/widths
	deviceChosen: function() {
		var selected = this.$.devicePicker.getSelected();
		
		if(!selected.value) {
			return;
		}
		
		// Update fields with predefined values
		this.$.designerWidthInput.setValue(selected.value.width);
		this.$.designerHeightInput.setValue(selected.value.height);
		
		// Force height/width value updates (change event isn't triggered)
		this.$.designer.setWidth(selected.value.width);
		this.$.designer.setHeight(selected.value.height);
		
		return true;
	},
	updateHeight: function(inSender, inEvent) {
		this.$.designer.setHeight(inSender.getValue());
		this.findDeviceDimensionMatch();
	},
	updateWidth: function(inSender, inEvent) {
		this.$.designer.setWidth(inSender.getValue());
		this.findDeviceDimensionMatch();
	},
	findDeviceDimensionMatch: function() {
		var items = this.$.devicePicker.getClientControls(),
			item,
			h = this.$.designerHeightInput.getValue(),
			w = this.$.designerWidthInput.getValue(),
			i;
		
		for(i=0, item; (item = items[i]); i++) {
			if(item.value && ((h == item.value.height && w == item.value.width) || (h == item.value.width && w == item.value.height))) {
				this.$.devicePicker.setSelected(item);
				return;
			}
		}
		
		// If no match, set selected item to custom
		for(i=0, item; (item = items[i]); i++) {
			if(item.value) {
				continue;
			}
			
			this.$.devicePicker.setSelected(item);
		}
	},
	// Swap width and height values
	swapDesignerDimensions: function(inSender, inEvent) {
		var h = this.$.designerHeightInput.getValue(),
			w = this.$.designerWidthInput.getValue();
		
		this.$.designerHeightInput.setValue(w);
		this.$.designerWidthInput.setValue(h);
		
		// Force height/width value updates (change event isn't triggered)
		this.$.designer.setWidth(this.$.designerWidthInput.getValue());
		this.$.designer.setHeight(this.$.designerHeightInput.getValue());
	},
	zoomDesigner: function(inSender, inEvent) {
		this.$.designer.zoom(inSender.getValue());
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

