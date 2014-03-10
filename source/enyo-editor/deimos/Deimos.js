/*global ProjectKindsModel, enyo, ares, AresI18n, setTimeout */

/* ilibDeimos covers Deimos specific translations. */
var ilibDeimos = AresI18n.resolve.bind(null, AresI18n.setBundle("$assets/enyo-editor/deimos/resources"));

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
				{name: "middle", classes: "ares-deimos-middle", fit: true, kind: "FittableRows", components: [
					{name: "middleToolbar", kind: "onyx.MoreToolbar", classes: "deimos-toolbar", components: [
						{kind: "onyx.Button", name: "reloadDesignerButton", /*classes: "deimos-designer-toolbar-spacing",*/ content: ilibDeimos("Reload"), ontap: "reloadDesigner"},
						{kind: "FittableColumns", classes: "deimos-toolbar-section", components: [
							{content: ilibDeimos("Fit:")},
							{kind: "onyx.Checkbox", onchange: "autoZoomDesigner"}, //checkbox is here as a workaround for ENYO-3648
							{content: ilibDeimos("Zoom:")},
							{kind: "onyx.PickerDecorator", components: [
								{name: "zoomPickerButton"},
								{name: "zoomPicker", kind: "onyx.Picker", onSelect: "zoomDesigner", components: []}
							]}
						]},
						{kind: "FittableColumns", classes: "deimos-toolbar-section", components: [
							{content: ilibDeimos("Device:")},
							{kind: "Ares.PickerDecorator", /*classes: "deimos-designer-toolbar-spacing",*/ components: [
								{classes: "deimos-device-picker"},
								{kind: "onyx.Picker", name: "devicePicker", ontap: "deviceChosen", components: [
									{content: ilibDeimos("Default"), value: { height: 800,  width: 600 }},
									{content: "HP Slate7", value: { height:  1024, width:  600, ppi: 170, dpr: 1 }},
									{content: "iPhone\u2122", value: { height: 480,  width: 320 }},
									{content: "iPhone\u2122 4", value: { height:  960, width:  640, ppi: 326, dpr: 2 }},
									{content: "iPhone\u2122 5", value: { height: 573,  width: 320 }},
									{content: "iPad\u2122", value: { height: 768,  width: 1024 }},
									{content: "iPad\u2122 Retina", value: { width: 2048, height: 1536, ppi: 264, dpr: 2 }},
									{content: "iPad\u2122 2", value: { width: 1024, height:  768, ppi: 132, dpr: 1 }},
									{content: "iPad\u2122 mini", value: { width: 1024, height:  768, ppi: 163, dpr: 1 }},
									{content: "HDTV", value: { height: 1080, width: 1920 }},
									{content: ilibDeimos("Custom")}
								]}
							]},
							{kind: "Ares.PickerDecorator", /*classes: "deimos-designer-toolbar-spacing",*/ components: [
								{name: "screenPickerButton", classes: "deimos-screen-picker"},
								{kind: "onyx.Picker", name: "screenPicker", ontap: "screenChosen", components: [
									{content: ilibDeimos("Portrait"), value: "portrait"},
									{content: ilibDeimos("Landscape"), value: "landscape"}
								]}
							]}
						]},
						{kind: "FittableColumns", classes: "deimos-toolbar-section", components: [
							{content: ilibDeimos("Width (px):")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "onyx.Input", name: "designerWidthInput", classes: "deimos-designer-input", placeholder: ilibDeimos("Auto"), onchange: "updateWidth"}
							]},
							{kind: "onyx.Button", name: "swapDesignerDimensionsButton", classes: "deimos-swap-dimensions-button", allowHtml: true, content: "&larr;<br/>&rarr;", ontap: "swapDesignerDimensions"},
							{content: ilibDeimos("Height (px):")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "onyx.Input", name: "designerHeightInput", classes: "deimos-designer-input", placeholder: ilibDeimos("Auto"), onchange: "updateHeight"}
							]}
						]}						
					]},
					{kind: "Scroller", classes: "deimos-designer-wrapper", fit: true, components: [
						{kind: "Designer", name: "designer",
						 onSelect: "designerSelect",
						 onSelected: "designerSelected",
						 onMoveItem: "moveItem",
						 onCreateItem: "createItem",
						 onSyncDropTargetHighlighting: "syncComponentViewDropTargetHighlighting",
						 onReloadComplete: "reloadComplete",
						 onResizeItem: "resizeItem",
						 onReturnPositionValue: "designerReturnPositionValue"
						}
					]}
				]},
				{name: "right", classes:"ares_deimos_right", kind: "FittableRows", components: [
					{kind: "onyx.MoreToolbar", classes: "deimos-toolbar deimos-toolbar-margined-buttons", components: [
						{name:"deleteButton", kind: "onyx.Button", content: ilibDeimos("Delete"), classes: "btn-danger",  ontap: "deleteAction"},
						{name:"undoButton", kind: "onyx.Button", content: ilibDeimos("Undo"), classes: "btn-danger",  ontap: "undoAction"},
						{name:"redoButton", kind: "onyx.Button", content: ilibDeimos("Redo"), classes: "btn-danger",  ontap: "redoAction"}
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
		onChildRequest: "",
		onRegisterMe: "",
		onError:""
	},
	handlers:{
		onPaletteComponentAction: "runPaletteComponentAction",
		onScaleChange: "displayZoomValue"
	},
	kinds: [],
	index: null,
	previousContent: "",
	fileName: "",
	zoomValues: [25, 50, 100, 125, 150, 200, 400],
	initZoomIndex: 2,
	create: function() {
		ares.setupTraceLogger(this);
		this.trace("Creating Deimos");
		this.inherited(arguments);
		this.addHandlers();

		// i18n checking
		this.trace("ilibDeimos: Delete=", ilibDeimos("Delete"));
	},
	rendered: function() {
		this.inherited(arguments);
		this.initializeDesignerToolbar();
	},
	//* Initialize _devicePicker_ in the toolbar at render time
	initializeDesignerToolbar: function() {
		this.trace("called");
		var initItem = this.$.devicePicker.getClientControls()[0];
		this.$.devicePicker.setSelected(initItem);
		var initOrientation = this.$.screenPicker.getClientControls()[0];
		this.$.screenPicker.setSelected(initOrientation);
		this.deviceChosen();
		var i, z;
		for (i = 0; (z = this.zoomValues[i]); i++) {
			this.$.zoomPicker.createComponent({content: ilibDeimos("{z}%", {z: z}), value: z, active: z === this.zoomValues[this.initZoomIndex]});
		}
		this.zoomDesigner(null, {selected: this.$.zoomPicker.getSelected()});
	},

	isDesignerBroken: function() {
		return this.$.designer.isBroken();
	},

	/**
	 * Loads the first kind passed thru the data parameter.
	 * This function acts on pallete, inspector, kindPicker and (may be) sends
	 * to designerFrame serialisation options extracted from .design
	 * files. No ack message is expected from designerFrame
	 *
	 * @param {Object} data: contains kinds declaration (enyo.kind format)
	 * and project information such as the analyzer output
	 * for all the .js files of the project and for enyo/onyx.
	 * @param {Function} next
	 */
	loadDesignerUI: function(data, next) {
		this.trace("called with", data);
		ares.assertCb(next);
		this.enableDesignerActionButtons(false);

		var what = data.kinds;

		this.index = null;
		this.kinds = what;
		this.fileName = data.fileIndexer.name;

		// Pass the project information (analyzer output, ...) to the inspector and palette
		this.setProjectData(data.projectData);

		this.doChildRequest({task: [ "initKindPicker", what ]}) ;

		// selectKind is designed to be used in a waterfall, it calls
		// next with `next(err,kindName)`. This extra parameter needs
		// to be removed:
		var bareNext = function(err) { next(err);} ;

		// preselect the first kind. This will lead to an action in
		// DesignerFrame.
		this.selectKind(0, bareNext) ;
	},

	selectKind: function(index, next) {
		ares.assertCb(next);
		var kind = this.kinds[index];
		var components = this.getSingleKind(index);
		this.trace("selected kind ", kind);

		// prepare next used by async.waterfall
		var nextWithName = function(err) { next(err, kind.name); };

		if (index !== this.index) {
			this.addAresIds(components);
			this.addAresKindOptions(components);
			this.$.inspector.initUserDefinedAttributes(components);
			this.previousContent = this.formatContent(enyo.json.codify.to(this.cleanUpComponents(components)));

			this.$.inspector.inspect(null);
			this.$.inspector.setCurrentKindName(kind.name);

			this.$.designer.renderKind(this.fileName, components[0], null, nextWithName);

			this.index = index;
		} else {
			setTimeout(nextWithName, 0);
		}
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
		this.trace("called. New ", this.projectData, " old ", oldProjectData);
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
		// no return message is expected
		this.$.designer.sendSerializerOptions(ProjectKindsModel.serializerOptions);
	},
	//* Rerender current kind
	rerenderKind: function(inSelectId) {
		this.$.designer.renderKind(
			this.fileName,
			this.getSingleKind(this.index)[0],
			inSelectId,
			function () {}
		);
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
		this.$.componentView.setSelected(c, true); // -> ask for scroll
		return true;
	},
	// Select event triggered by component view was completed. Refresh inspector.
	designerSelected: function(inSender, inEvent) {
		this.refreshInspector();
		this.$.componentView.setSelected(inSender.selection, false);
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

		this.$.designer.modifyProperty(inEvent.name, inEvent.value, ares.noNext);
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
	prepareUpdatedKindList: function() {
		if (this.index !== null) {
			// create a list containing code for each kind managed by
			// the designer, I.e. for each kind contained in the
			// edited file. this list will be used by the code editor
			var kindsAsCode = [];

			for(var i = 0 ; i < this.kinds.length ; i++) {
				kindsAsCode[i] = (i === this.index) ? this.formatContent(enyo.json.codify.to(this.cleanUpComponents([this.kinds[i]]))) : null;
			}
			// the length of the returned event array is significant for the undo/redo operation.
			// event.contents.length must match this.kinds.length even if it contains only null values
			// so the returned structure return may be [null] or [null, content, null] or [ null, null, null]...
			if (kindsAsCode[this.index] === this.previousContent) {
				// except when undo/redo would not bring any change...
				kindsAsCode = [];
			}
			return kindsAsCode;
		}
	},
	formatContent: function(inContent) {
		// Strip opening [ bracket
		inContent = inContent.replace(/\[\n\t\t\{/, "{\n\t");

		// Strip closing }] brackets
        inContent = inContent.replace(/\}\s([^}]+)$/, "");

		return inContent;
	},

	/**
	 * Close Designer and switch editor back to code mode
	 * @param {Bool} bleach: when 1, cleanup edited kind from designer
	 */
	closeDesigner: function(bleach) {
		if (bleach) {
			this.$.designer.cleanUp();
		}
		this.updateCodeInEditor(this.fileName);
		this.setProjectData(null);
		this.doChildRequest({task: "switchToCodeMode" });
	},

	// When the designer finishes rendering, re-build the components view
	buildComponentView: function(msg) {
		var components = enyo.json.codify.from(msg.val);

		this.refreshComponentView(components);

		// Recreate this kind's components block based on components in Designer and user-defined properties in Inspector.
		this.kinds[this.index] = this.cleanUpComponents(components, true)[0];

		this.enableDesignerActionButtons(true);
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
		this.doChildRequest({task: [ "undo", ares.noNext ] });
		return true;
	},
	redoAction: function(inSender, inEvent) {
		this.enableDesignerActionButtons(false);
		this.doChildRequest({task: [ "redo", ares.noNext ] });
		return true;
	},
	deleteAction: function(inSender, inEvent) {
		if(!this.$.designer.selection) {
			return true;
		}

		this.$.inspector.inspect(null);
		this.enableDesignerActionButtons(false);

		var kind = this.getSingleKind(this.index);
		this.deleteComponentByAresId(this.$.designer.selection.aresId, kind);
		this.addAresKindOptions(kind);
		this.rerenderKind();
		return true;
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
	updateCodeInEditor: function(inFilename) {
		var kindList = this.prepareUpdatedKindList();

		if (inFilename === this.fileName) {
			var kind = this.getSingleKind(this.index);
			this.previousContent = this.formatContent(enyo.json.codify.to(this.cleanUpComponents(kind)));
			this.doChildRequest({ task: [ "updateComponentsCode", kindList ] });
		} else {
			this.log("skipped code update of stale file ", inFilename);
		}
	},

	/**
	 * Called when ProjectView has new project selected
	 * @param {Object} inProject
	 * @param {Function} next
	 */
	projectSelected: function(inProject, next) {
		this.trace("called with ", inProject);
		this.$.designer.updateSource(inProject, next);
	},

	/**
	 * triggered by 'Reload' button
	 */
	reloadDesigner: function() {
		this.enableDesignerActionButtons(false);
		this.$.designer.reload();
		this.$.inspector.inspect(null);
	},
	reloadComplete: function() {
		this.rerenderKind();
	},
	syncFile: function(project, filename, code, next) {
		ares.assertCb(next);
		this.$.designer.syncFile(project, filename, code, next);
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
		var device = this.$.devicePicker.getSelected();

		if(!device.value) {
			this.$.designerWidthInput.set("disabled", false);
			this.$.designerHeightInput.set("disabled", false);
			this.$.swapDesignerDimensionsButton.set("disabled", false);
			this.$.screenPickerButton.set("disabled", true);
		} else {
			this.$.designerWidthInput.set("disabled", true);
			this.$.designerHeightInput.set("disabled", true);
			this.$.swapDesignerDimensionsButton.set("disabled", true);
			this.$.screenPickerButton.set("disabled", false);
		}

		this.screenChosen();

		return true; // stop bubble
	},
	//* When a screen is chosen in the designer toolbar, set the appropriate heights/widths
	screenChosen: function() {
		var orientation = this.$.screenPicker.getSelected();
		var device = this.$.devicePicker.getSelected();

		var vertical = 0,
			horizontal = 0;

		if (device.value) {
			if(orientation.value === "portrait") {
				horizontal = device.value.width;
				vertical = device.value.height;
			} else {
				horizontal = device.value.height;
				vertical = device.value.width;
			}

			// Update fields with predefined values
			this.$.designerWidthInput.setValue(horizontal);
			this.$.designerHeightInput.setValue(vertical);
		} else {
			horizontal = this.$.designerWidthInput.getValue();
			vertical = this.$.designerHeightInput.getValue();
		}		

		//this.$.deviceWidth.set("content", horizontal + " px");
		//this.$.deviceHeight.set("content", vertical + " px");

		// Force height/width value updates (change event isn't triggered)
		this.$.designer.setWidth(horizontal);
		this.$.designer.setHeight(vertical);

		//this.$.middleToolbar.render();
		//this.$.middleToolbar.set("fit", true);

		return true; // stop bubble
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
		this.$.designer.zoom(inEvent.selected.value);
	},
	autoZoomDesigner: function(inSender, inEvent) {
		var active = inSender.getValue();
		this.$.zoomPickerButton.setDisabled(active);
		this.$.designer.setAutoZoom(active);
		if(active){
			var scale = this.$.designer.zoomFromWidth();
			this.$.zoomPickerButton.setContent(scale+"%");
		} else{
			this.$.zoomPickerButton.setContent(this.zoomValues[this.initZoomIndex]+"%");
			this.$.zoomPicker.setSelected(this.$.zoomPicker.getClientControls()[this.initZoomIndex]);
			this.zoomDesigner(null, {selected: this.$.zoomPicker.getSelected()});
		}
	},
	displayZoomValue: function(inSender, inEvent){
		this.$.zoomPickerButton.setContent(inEvent.scale+"%");
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
		var configData = this.formatContent(enyo.json.codify.to(this.cleanUpViewComponent(config)));

		if(inEvent.getName() === "addtoKind"){
			var target = this.$.actionPopup.getTargetComponent(target);
			var beforeId = inEvent.beforeId;
			this.performCreateItem(config, target, beforeId);
		} else if (inEvent.getName() === "replaceKind"){
			this.doChildRequest({task: [ "replaceKind", this.index, configData ]});
		} else if (inEvent.getName() === "addNewKind"){
			this.doChildRequest({ task: [ "addNewKind", configData ] });
		}
		else {
			this.log("unexpected event: " + inEvent.getName() );
		}
		this.$.actionPopup.hide();

		return true;
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
