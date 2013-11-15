/* global ProjectKindsModel, ComponentsRegistry */
/* jshint indent: false */ // TODO: ENYO-3311

enyo.kind({
	name: "Deimos",
	classes: "enyo-unselectable onyx",
	debug: false,
	published: {
		projectData: null		// All the project data shared mainly between phobos and deimos
	},
	components: [
		{name: "actionPopup", kind:"PaletteComponentActionPopup", centered: true, floating: true, autoDismiss: false, modal: true},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{name: "body", fit: true, classes: "deimos_panel_body", kind: "FittableColumns", components: [
				{name: "palette", classes:"ares_deimos_left", kind: "Palette", ondragstart: "paletteDragStart"},
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
						{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", name: "designerHeightInput", classes: "deimos-designer-input", placeholder: "Auto", onchange: "updateHeight"}
						]},
						{content: "Zoom:"},
						{kind: "onyx.Slider", classes: "deimos-zoom-slider", value: 100, onChange: 'zoomDesigner', onChanging: 'zoomDesigner' }
					]},
					{kind: "Scroller", classes: "deimos-designer-wrapper", fit: true, components: [
						{kind: "Designer", name: "designer",
							onSelect: "designerSelect",
							onSelected: "designerSelected",
							onDesignRendered: "designRendered",
							onMoveItem: "moveItem",
							onCreateItem: "createItem",
							onSyncDropTargetHighlighting: "syncComponentViewDropTargetHighlighting",
							onReloadComplete: "reloadComplete",
							onResizeItem: "resizeItem",
							onReturnPositionValue: "designerReturnPositionValue",
							onForceCloseDesigner: "closeDesignerAction"
						}
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
						onPositionDataUpdated: "inspectorPositionDataUpdated"
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
		onRegisterMe: "",
		onError:""
	},
	handlers:{
		onPaletteComponentAction: "runPaletteComponentAction"
	},
	kinds: [],
	index: null,
	previousContent: "",
	fileName: "",
	selectFromComponentView: false,
	
	create: function() {
		ares.setupTraceLogger(this);
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
		this.trace("called with",data);
		this.enableDesignerActionButtons(false);

		var what = data.kinds;
		var maxLen = 0;
		
		this.index = null;
		this.kinds = what;
		this.fileName = data.fileIndexer.name;
		
		this.owner.$.kindPicker.destroyClientControls();

		// Pass the project information (analyzer output, ...) to the inspector and palette
		this.setProjectData(data.projectData);

		for (var i = 0; i < what.length; i++) {
			var k = what[i];
			this.owner.$.kindPicker.createComponent({
				content: k.name,
				index: i,
				active: (i===0)
			});
			maxLen = Math.max(k.name.length, maxLen);
		}
		
		this.owner.$.kindButton.applyStyle("width", (maxLen+2) + "em");
		this.owner.$.kindPicker.render();
		this.owner.resized();
	},
	kindSelected: function(inSender, inEvent) {
		var index = inSender.getSelected().index;
		var kind = this.kinds[index];
		var components = this.getSingleKind(index);
		
		this.addAresIds(components);
		this.addAresKindOptions(components);
		this.$.inspector.initUserDefinedAttributes(components);
		this.previousContent = this.formatContent(enyo.json.codify.to(this.cleanUpComponents(components)));

		if (index !== this.index) {
			this.$.inspector.inspect(null);
			this.$.inspector.setCurrentKindName(kind.name);
			// FIXME: ENYO-3181: synchronize rendering for the right rendered file
			this.$.designer.set("currentFileName", this.fileName);
			this.$.designer.setCurrentKind(components[0]);
		}
		
		this.index = index;
		this.owner.$.kindButton.setContent(kind.name);
		this.owner.$.toolbar.reflow();
		
		return true;
	},
	/**
	 * Receive the project data reference which allows to access the analyzer
	 * output for the project's files, enyo/onyx and all the other project
	 * related information shared between phobos and deimos.
	 * @param  oldProjectData
	 * @protected
	 */
	projectDataChanged: function(oldProjectData) {
		// *ProjectData are backbone obbject mixed with events. This is defined in ProjectCrtl...
		// *ProjectData are kept in ProjectCtrl
		if (oldProjectData) {
			// unbind former project data from Deimos
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
			oldProjectData.off('update:project-indexer', this.projectIndexUpdated);
		}

		ProjectKindsModel.resetInformation();

		if (this.projectData) {
			this.trace("projectData", this.projectData);
			// bind new project data in Deimos, any change in Project data triggers these callbacks
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);
			this.projectData.on('update:project-indexer', this.projectIndexUpdated, this);
			this.projectIndexer = this.projectData.getProjectIndexer();
			this.projectIndexUpdated();
		}
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, indexer, options) {
		this.trace("projectIndexReady: ", indexer);
		this.projectIndexer = indexer;
		this.projectIndexUpdated();
	},
	//* @protected
	getSingleKind: function(inIndex) {
		var kind = [],
			len = this.kinds.length;

		for (var i=0;  i<len; i++) {
			if (i === inIndex) {
				kind[0] = this.kinds[inIndex];
				break;
			}
		}
		return kind;
	},
	projectIndexUpdated: function() {
		var indexer = this.projectIndexer;
		this.trace("projectIndexUpdated: for projectIndexer: ", indexer);
		this.$.inspector.setProjectIndexer(indexer);
		this.$.palette.setProjectIndexer(indexer);
		ProjectKindsModel.buildInformation(indexer);
		this.$.designer.sendSerializerOptions(ProjectKindsModel.serializerOptions);
	},
	//* Rerender current kind
	rerenderKind: function(inSelectId) {
		// FIXME: ENYO-3181: synchronize rendering for the right rendered file
		this.$.designer.set("currentFileName", this.fileName);
		this.$.designer.currentKind = this.getSingleKind(this.index)[0];
		this.$.designer.renderCurrentKind(inSelectId);
	},
	refreshInspector: function() {
		enyo.job("inspect", enyo.bind(this, function() {
			this.$.inspector.inspect(this.$.designer.selection);
		}), 200);
	},
	refreshComponentView: function(inComponents) {
		this.$.componentView.visualize(inComponents);
	},
	// New selected item triggered in designerFrame. Synchronize component view and refresh inspector.
	designerSelect: function(inSender, inEvent) {
		var c = inSender.selection;
		this.refreshInspector();
		var haveToScroll = !this.selectFromComponentView;
		this.$.componentView.setSelected(c, haveToScroll);
		this.selectFromComponentView = false;
		return true;
	},
	// Select event triggered by component view was completed. Refresh inspector.
	designerSelected: function(inSender, inEvent) {
		this.refreshInspector();
		return true;
	},
	componentViewSelect: function(inSender, inEvent) {
		this.$.designer.select(inEvent.component);
		this.selectFromComponentView = true;
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
		var item = this.getItemById(this.$.designer.selection.aresId, this.getSingleKind(this.index)),
			prop,
			val
		;
		
		for (prop in inEvent.props) {
			val = inEvent.props[prop];
			this.addReplaceStyleProp(item, prop, inEvent.props[prop]);
		}

		this.rerenderKind(item.aresId);
	},
	layoutKindUpdated: function(inLayoutKind) {
		var kind = this.getSingleKind(this.index);
		var item = this.getItemById(this.$.designer.selection.aresId, kind);
		
		if (inLayoutKind !== "AbsolutePositioningLayout" && item.layoutKind !== "AbsolutePositioningLayout") {
			return false;
		}
		
		if (inLayoutKind === "AbsolutePositioningLayout") {
			item.layoutKind = inLayoutKind;
			this.updateStyleForAbsolutePositioningLayoutKind(item);
		} else {
			if (item.layoutKind) {
				delete item.layoutKind;
			}
			this.updateStyleForNonAbsolutePositioningLayoutKind(item);
		}
		this.addAresKindOptions(kind);
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
		if (inComponent.layoutKind) {
			delete inComponent.layoutKind;
		}
		if (this.$.inspector.userDefinedAttributes[inComponent.aresId].layoutKind) {
			delete this.$.inspector.userDefinedAttributes[inComponent.aresId].layoutKind;
		}
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
			var event = {contents: []};
			for(var i = 0 ; i < this.kinds.length ; i++) {
				event.contents[i] = (i === this.index) ? this.formatContent(enyo.json.codify.to(this.cleanUpComponents([this.kinds[i]]))) : null;
			}
			// the length of the returned event array is significant for the undo/redo operation.
			// event.contents.length must match this.kinds.length even if it contains only null values
			// so the returned structure return may be [null] or [null, content, null] or [ null, null, null]...
			if (event.contents[this.index] === this.previousContent) {
				// except when undo/redo would not bring any change...
				event.contents=[];
			}
			
			return event;
		}
	},
	formatContent: function(inContent) {
		// Strip opening [ bracket
		inContent = inContent.replace(/\[\n\t\t\{/, "{\n\t");

		// Strip closing }] brackets
        inContent = inContent.replace(/\}\s([^}]+)$/, "");
		
		return inContent;
	},
	closeDesignerAction: function(inSender, inEvent) {
		this.$.designer.cleanUp();
		
		var event = this.prepareDesignerUpdate();

		this.setProjectData(null);
		this.doCloseDesigner(event);
		
		return true;
	},
	// When the designer finishes rendering, re-build the components view
	designRendered: function(inSender, inEvent) {
		var components = enyo.json.codify.from(inEvent.content);
		
		this.refreshComponentView(components);
		
		// Recreate this kind's components block based on components in Designer and user-defined properties in Inspector.
		this.kinds[this.index] = this.cleanUpComponents(components, true)[0];
		
		// FIXME: ENYO-3181: synchronize rendering for the right rendered file
		this.designerUpdate(inEvent.filename);

		return true;
	},
	//* Send dragData type to Designer and Component View during ondragstart within Palette
	paletteDragStart: function(inSender, inEvent) {
		var dragType = enyo.json.codify.from(inEvent.dataTransfer.getData("text")).type;
		this.$.designer.sendDragType(dragType);
		this.$.componentView.setDragType(dragType);
	},
	//* Create item from palette (via drag-and-drop from Palette into Designer or Component View)
	createItem: function(inSender, inEvent) {
		var config = inEvent.config,
			options = inEvent.options,
			targetId = inEvent.targetId,
			beforeId = inEvent.beforeId,
			target = (targetId)
					?	this.getItemById(targetId, this.getSingleKind(this.index))
					:	this.kinds[this.index];

		if (!config) {
			enyo.warn("Could not create new item - bad data: ", inEvent);
			return true;
		}

		this.log();
		// Check libs ".design" related constraints
		if (options) {
			// Check "within" constraints
			if (options.within) {
				var droppable = false;
				enyo.forEach (options.within.targets, function(container) {
					if (container.kind === target.kind) {
						droppable = true;
					} 
				}, this);

				if (!droppable) {
					enyo.warn("container's constraint", options.within.description);
					return true;
				}
			}
		}
				
		// Give the new component (and any children) a fresh _aresId_
		config.aresId = this.generateNewAresId();
		if (config.components) {
			this.addAresIds(config.components);
		}

		//if component has a "isViewTemplate" option, Designer show action popup
		if(options && options.isViewTemplate){
			this.showActionPopup(options, config, target);
		} else {
			this.performCreateItem(config, target, beforeId);	
		}		
		return true;
	},
	//* Move item with _inEvent.itemId_ into item with _inEvent.targetId_
	moveItem: function (inSender, inEvent) {
		var kind = this.getSingleKind(this.index),
			movedItem = this.getItemById(inEvent.itemId, kind),
			clone = enyo.clone(movedItem),
			beforeId = inEvent.beforeId || null,
			target = (inEvent.targetId)
					?	this.getItemById(inEvent.targetId, kind)
					:	this.kinds[this.index]
		;
		
		// If moving item onto itself or before itself, do nothing
		if ((target === movedItem) || (beforeId !== null && beforeId === inEvent.itemId)) {
			return true;
		}

		this.log();
		// Check libs ".design" related constraints
		if (kind.options) {
			// Check "within" constraints
			if (kind.options.within) {
				var droppable = false;
				enyo.forEach (kind.options.within.targets, function(container) {
					if (container.kind === target.kind) {
						droppable = true;
					} 
				}, this);

				if (!droppable) {
					enyo.warn("container's constraint", kind.options.within.description);
					return true;
				}
			}
		}
		
		// Remove existing item
		this.removeItemById(inEvent.itemId, this.kinds[this.index].components);
		
		// Apply any special layout rules
		clone = this.applyLayoutKindRules(inEvent.layoutData, clone);

		// Copy clone style props to inspector
		if(clone.style !== undefined){
			this.$.inspector.userDefinedAttributes[clone.aresId].style = clone.style;
		}
		this.addAresKindOptions(kind);
		
		if (beforeId && (beforeId !== target.aresId)) {
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
		var item = this.getItemById(this.$.designer.selection.aresId, this.getSingleKind(this.index));
		
		for (var prop in inEvent.sizeData) {
			this.addReplaceStyleProp(item, prop, inEvent.sizeData[prop]);
		}
		
		this.rerenderKind(item.aresId);
		
		return true;
	},
	//* Called when the designerFrame has retrieved a requested absolute position value
	designerReturnPositionValue: function(inSender, inEvent) {
		this.$.inspector.setRequestedPositionValue(inEvent.prop, inEvent.value);
		return true; //TODO See if the code behind the return is useful 
		/*
		var item = this.getItemById(this.$.designer.selection.aresId, this.kinds[this.index].components);
		this.addReplaceStyleProp(item, inEvent.prop, inEvent.value + "px");
		this.rerenderKind(item.aresId);
		 */
	},
	applyLayoutKindRules: function(inLayoutData, inControl) {
		var layoutKind = inLayoutData && inLayoutData.layoutKind;

		switch (layoutKind) {
			case "AbsolutePositioningLayout":
				inControl.style = this.addAbsolutePositioningStyle(inLayoutData, inControl);
				break;
			default:
				if(inControl.style !== undefined){
					inControl.style = this.removeAbsolutePositioningStyle(inControl);
				}
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
			styleProps = {};
		
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
			if ((inKeepAresIds && att === "aresId") || (att !== "aresId" && att !== "components" && att !== "__aresOptions")) {
				cleanComponent[att] = atts[att];
			}
		}
		
		// If this component has any child components, add them to components[] block
		if (inComponent.components) {
			
			// Recurse through child components
			for (i=0; i<inComponent.components.length; i++) {
				childComponents.push(this.cleanUpComponent(inComponent.components[i], inKeepAresIds));
			}
			
			if (childComponents.length > 0) {
				cleanComponent.components = childComponents;
			}
		}
		
		return cleanComponent;
	},
	cleanUpViewComponent: function(inComponent, inKeepAresIds) {
		var aresId = inComponent.aresId,
			childComponents = [],
			cleanComponent = {},
			att,
			i;
		if (!aresId) {
			return cleanComponent;
		}
		for(att in inComponent){ 
			if ((inKeepAresIds && att === "aresId") || (att !== "aresId" && att !== "components" && att !== "__aresOptions")) {
				cleanComponent[att] = inComponent[att];
			}
	     }
		if (inComponent.components) {
			for (i=0; i<inComponent.components.length; i++) {
				childComponents.push(this.cleanUpViewComponent(inComponent.components[i], inKeepAresIds));
			}
			if (childComponents.length > 0) {
				cleanComponent.components = childComponents;
			}
		}
		return cleanComponent;
	},
	undoAction: function(inSender, inEvent) {
		this.enableDesignerActionButtons(false);
		this.doUndo();
	},
	redoAction: function(inSender, inEvent) {
		this.enableDesignerActionButtons(false);
		this.doRedo();
	},
	deleteAction: function(inSender, inEvent) {
		if(!this.$.designer.selection) {
			return;
		}
		
		this.$.inspector.inspect(null);
		this.enableDesignerActionButtons(false);

		var kind = this.getSingleKind(this.index);
		this.deleteComponentByAresId(this.$.designer.selection.aresId, kind);
		this.addAresKindOptions(kind);
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
	designerUpdate: function(inFilename) {
		var event = this.prepareDesignerUpdate();
		
		// FIXME: ENYO-3181: synchronize rendering for the right rendered file
		if (inFilename === this.fileName) {
			var kind = this.getSingleKind(this.index);
			this.previousContent = this.formatContent(enyo.json.codify.to(this.cleanUpComponents(kind)));
			this.doDesignerUpdate(event);
		}

		this.enableDesignerActionButtons(true);
	},
	//* Called by Ares when ProjectView has new project selected
	projectSelected: function(inProject) {
		this.trace("called with ",inProject);
		this.$.designer.updateSource(inProject);
	},
	reloadDesigner: function() {
		this.enableDesignerActionButtons(false);
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
		var options = ProjectKindsModel.getKindOptions(inComponent.kind);
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
	},

	showActionPopup: function(options, config, target){
		if(options.isViewTemplate){
			this.$.actionPopup.setActionShowing("vtAction");
		} else {
			//FIXME: for other palette component actions
			this.$.actionPopup.setActionShowing(null);
		}
		this.$.actionPopup.setConfigComponent(config);
		this.$.actionPopup.setTargetComponent(target);
		this.$.actionPopup.show();
	},
	
	// @protected		
	runPaletteComponentAction: function(inSender,inEvent){
		var config = this.$.actionPopup.getConfigComponent(config);
		var config_data = this.formatContent(enyo.json.codify.to(this.cleanUpViewComponent(config)));

		if(inEvent.getName() === "addtoKind"){
			var target = this.$.actionPopup.getTargetComponent(target);
			var beforeId = inEvent.beforeId; 
			this.performCreateItem(config, target, beforeId);
		} else if (inEvent.getName() === "replaceKind"){
			ComponentsRegistry.getComponent("phobos").replaceViewKindAction(this.index, config_data);
		} else if (inEvent.getName() === "addNewKind"){
			ComponentsRegistry.getComponent("phobos").addViewKindAction(config_data);
		}
		this.$.actionPopup.hide();
	},


	// @protected
	performCreateItem: function(config, target, beforeId){
		var kind = this.getSingleKind(this.index);
		if (beforeId && (beforeId !== target.aresId)) {
			this.insertItemBefore(config, target, beforeId);
		} else {
			this.insertItem(config, target);
		}
		this.$.inspector.initUserDefinedAttributes(kind);
		this.addAresKindOptions(kind);
		this.rerenderKind(config.aresId);
	},
	enableDesignerActionButtons: function(condition) {
		this.$.deleteButton.setAttribute("disabled", !condition);
		this.$.undoButton.setAttribute("disabled", !condition);
		this.$.redoButton.setAttribute("disabled", !condition);
		this.$.reloadDesignerButton.setAttribute("disabled", !condition);
	}
});
