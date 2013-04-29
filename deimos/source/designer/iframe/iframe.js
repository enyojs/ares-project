enyo.kind({
	name: "Ares.App",
	classes: "enyo-fit",
	id: "aresApp",
	handlers: {
		ondragleave: "iframeDragleave",
		onWebkitTransitionEnd: "prerenderMoveComplete" // TODO
	},
	published: {
		containerItem: null,
		beforeItem: null,
		currentDropTarget: null,
		createPaletteItem: null
	},
	components: [
		{name: "client", classes:"enyo-fit"},
		{name: "cloneArea", style: "background:rgba(0,200,0,0.5); display:none; opacity: 0;", classes: "enyo-fit"},
		{name: "flightArea", style: "display:none;", classes: "enyo-fit"},
		{name: "serializer", kind: "Ares.Serializer"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"},
		{name: "selectHighlight", classes: "iframe-highlight iframe-select-highlight"},
		{name: "dropHighlight", classes: "iframe-highlight iframe-drop-highlight"}
	],
	
	selection: null,
	parentInstance: null,
	containerData: null,
	aresComponents: [],
	prevX: null,
	prevY: null,
	dragoverTimeout: null,
	holdoverTimeout: null,
	moveControlSecs: 0.2,
	edgeThresholdPx: 10,
	debug: false,
	
	create: function() {
		this.inherited(arguments);
		this.addHandlers();
		this.addDispatcherFeature();
	},
	rendered: function() {
		this.inherited(arguments);
		this.sendMessage({op: "state", val: "initialized"});
	},
	currentDropTargetChanged: function() {
		if (this.getCurrentDropTarget()) {
			this.highlightDropTarget(this.getCurrentDropTarget());
		}
		this.syncDropTargetHighlighting();
	},
	//* Add dispatch handling for native drag events
	addHandlers: function(inSender, inEvent) {
		document.ondragstart = enyo.dispatch;
		document.ondrag =      enyo.dispatch;
		document.ondragenter = enyo.dispatch;
		document.ondragleave = enyo.dispatch;
		document.ondragover =  enyo.dispatch;
		document.ondrop =      enyo.dispatch;
		document.ondragend =   enyo.dispatch;
	},
	/**
		Add feature to dispatcher to catch drag-and-drop-related events, and
		to stop any/all DOM events from being handled by the app.
	*/
	addDispatcherFeature: function() {
		var _this = this;
		
		enyo.dispatcher.features.push(
			function(e) {
				if (_this[e.type]) {
					_this[e.type](e)
				}
				e.preventDispatch = true;
				return true;
			}
		);
	},
	//* Send message to Deimos via _this.$.communicator_
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	//* Receive message from Deimos
	receiveMessage: function(inSender, inEvent) {

		var msg = inEvent.message;

		if (!msg || !msg.op) {
			enyo.warn("Deimos iframe received invalid message data:", msg);
			return;
		}		
			
		switch (msg.op) {
			case "containerData":
				this.setContainerData(msg.val);
				break;
			case "render":
				this.renderKind(msg.val);
				break;
			case "select":
				this.selectItem(msg.val);
				break;
			case "highlight":
				this.highlightDropTarget(this.getControlById(msg.val.aresId));
				break;
			case "unhighlight":
				this.unhighlightDropTargets(msg.val);
				break;
			case "modify":
				this.modifyProperty(msg.val);
				break;
			case "codeUpdate":
				this.codeUpdate(msg.val);
				break;
			case "cssUpdate":
				this.cssUpdate(msg.val);
				break;
			case "cleanUp":
				this.cleanUpKind();
				break;
			case "resize":
				this.resized();
				break;
			case "prerenderDrop":
				this.foreignPrerenderDrop(msg.val);
				break;
			case "enterCreateMode":
				this.enterCreateMode(msg.val);
				break;
			case "leaveCreateMode":
				this.leaveCreateMode();
				break;
			default:
				enyo.warn("Deimos iframe received unknown message op:", msg);
				break;
		}
	},
	//* On down, set _this.selection_
	down: function(e) {
		var dragTarget = this.getEventDragTarget(e.dispatchTarget);
		
		if (dragTarget && dragTarget.aresComponent) {
			this._selectItem(dragTarget);
		}
	},
	//* On drag start, set the event _dataTransfer_ property to contain a serialized copy of _this.selection_
	dragstart: function(e) {
		if (!e.dataTransfer) {
			return false;
		}
		
		e.dataTransfer.setData('ares/moveitem', this.$.serializer.serializeComponent(this.selection, true));
        return true;
	},
	//* On drag over, enable HTML5 drag-and-drop if there is a valid drop target
	dragover: function(inEvent) {
		var dropTarget,
			mouseMoved;
		
		if (!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.preventDefault();
		
		// Throttle dragover event TODO - use enyo.job here?
		if (!this.dragoverTimeout) {
			this.dragoverTimeout = setTimeout(enyo.bind(this, "resetDragoverTimeout"), 100);
			this._dragover(inEvent);
		}
	},
	_dragover: function(inEvent) {
		// Update dragover highlighting
		this.dragoverHighlighting(inEvent);
		
		// If mouse actually moved, reset timer for holdover
		if (this.mouseMoved(inEvent)) {
			this.resetHoldoverTimeout();
		} else if (!this.holdoverTimeout) {
			this.holdoverTimeout = setTimeout(enyo.bind(this, function() { this.holdOver(inEvent); }), 200);
		}
		
		// Remember mouse location for next dragover event
		this.saveMouseLocation(inEvent);
		
		return true;
	},
	//* On drag leave, unhighlight previous drop target
	dragleave: function(inEvent) {
		var dropTarget;
		
		if (!inEvent.dataTransfer) {
			return false;
		}
		
		dropTarget = this.getEventDropTarget(inEvent.dispatchTarget);

		if (!this.isValidDropTarget(dropTarget)) {
			return false;
		}
		
		this.setCurrentDropTarget(null);
		this.syncDropTargetHighlighting();
		
		return true;
	},
	
	//* On drop, either move _this.selection_ or create a new component
	drop: function(inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
		
		var dataType = inEvent.dataTransfer.types[0],
			dropData = enyo.json.codify.from(inEvent.dataTransfer.getData(dataType)),
			dropTargetId,
			dropTarget = this.getEventDropTarget(inEvent.dispatchTarget),
			beforeId;
		
		switch (dataType) {
			case "ares/moveitem":
				if (this.selection) {
					// If no drop target found, use current selection's parent
					dropTargetId = (dropTarget) ? dropTarget.aresId : this.selection.parent.aresId;
					beforeId = this.selection.addBefore ? this.selection.addBefore.aresId : null;
				} else {
					this.log("UH OH!"); // TODO - we moved an item but there is no selection..?
				}
				
				this.sendMessage({op: "moveItem", val: {itemId: dropData.aresId, targetId: dropTargetId, beforeId: beforeId}});
				break;
			case "ares/createitem":
				dropTargetId = this.getContainerItem() ? this.getContainerItem().aresId : this.getEventDropTarget(inEvent.dispatchTarget).aresId;
				beforeId = this.getBeforeItem() ? this.getBeforeItem().aresId : null;
				
				this.sendMessage({op: "createItem", val: {config: dropData.config, targetId: dropTargetId, beforeId: beforeId}});
				break;
			default:
				enyo.warn("Component view received unknown drop: ", dataType, dropData);
				break;
		}
		
		this.setContainerItem(null);
		this.setBeforeItem(null);
		
		return true;
	},
	dragend: function() {
		this.setCurrentDropTarget(null);
		this.syncDropTargetHighlighting();
		this.unhighlightDropTargets(); // TODO - do we need this here?
	},
	
	resetDragoverTimeout: function() {
		clearTimeout(this.dragoverTimeout);
		this.dragoverTimeout = null;
	},
	resetHoldoverTimeout: function() {
		clearTimeout(this.holdoverTimeout);
		this.holdoverTimeout = null;
		
		if (this.selection && this.selection.addBefore) {
			this.resetAddBefore();
		}
	},
	//* Reset the control currently set as _addBefore_ on _this.selection_
	resetAddBefore: function() {
		this.selection.addBefore = null;
	},
	mouseMoved: function(inEvent) {
		return (this.prevX !== inEvent.clientX || this.prevY !== inEvent.clientY);
	},
	saveMouseLocation: function(inEvent) {
		this.prevX = inEvent.clientX;
		this.prevY = inEvent.clientY;
	},
	dragoverHighlighting: function(inEvent) {
		var dropTarget = this.getEventDropTarget(inEvent.dispatchTarget);
		
		// Deselect the currently selected item if we're creating a new item, so all items are droppable
		if (inEvent.dataTransfer.types[0] == "ares/createitem") {
			//this.selection = null;
			this.hideSelectHighlight();
		}
		
		// If not a valid drop target, reset _this.currentDropTarget_
		if (!this.isValidDropTarget(dropTarget)) {
			this.setCurrentDropTarget(null);
			return false;
		}
		
		// If drop target has changed, update drop target highlighting
		if (!(this.currentDropTarget && this.currentDropTarget === dropTarget)) {
			this.setCurrentDropTarget(dropTarget); // todo - rename currentDropTarget to highlightTarget
		}
	},
	
	//* Save _inData_ as _this.containerData_ to use as a reference when creating drop targets.
	setContainerData: function(inData) {
		this.containerData = inData;
		this.sendMessage({op: "state", val: "ready"});
	},
	//* Render the specified kind
	renderKind: function(inKind) {
		var kindConstructor = enyo.constructorForKind(inKind.name);
		
		if (!kindConstructor) {
			enyo.warn("No constructor exists for ", inKind.name);
			return;
		} else if(!kindConstructor.prototype) {
			enyo.warn("No prototype exists for ", inKind.name);
			return;
		}
		
		/*
			Stomp on existing _kindComponents_ to ensure that we render exactly what the user
			has defined. If components came in as a string, convert to object first.
		*/
		kindConstructor.prototype.kindComponents = (typeof inKind.components === "string") ? enyo.json.codify.from(inKind.components) : inKind.components;
		
		// Clean up after previous kind
		if (this.parentInstance) {
			this.cleanUpPreviousKind(inKind.name);
		}
		
		// Save this kind's _kindComponents_ array
		this.aresComponents = this.flattenKindComponents(kindConstructor.prototype.kindComponents);
		
		// Enable drag/drop on all of _this.aresComponents_
		this.makeComponentsDragAndDrop(this.aresComponents);
		
		// Save reference to the parent instance currently rendered
		this.parentInstance = this.$.client.createComponent({kind: inKind.name});
		
		// Mimic top-level app fitting (as if this was rendered with renderInto or write)
		if (this.parentInstance.fit) {
			this.parentInstance.addClass("enyo-fit enyo-clip");
		}		
		this.parentInstance.render();
		
		// Notify Deimos that the kind rendered successfully
		this.kindUpdated();
		
		// Select a control if so requested
		if (inKind.selectId) {
			this.selectItem({aresId: inKind.selectId});
		}
	},
	//* Rerender current selection
	rerenderKind: function() {
		this.renderKind({name: this.parentInstance.kind, components: this.getSerializedCopyOfComponent(this.parentInstance).components});
	},
	//* When the designer is closed, clean up the last rendered kind
	cleanUpKind: function() {
		// Clean up after previous kind
		if(this.parentInstance) {
			this.cleanUpPreviousKind(null);
			this.parentInstance = null;
			this.selection = null;
		}
		
	},
	//* Clean up previously rendered kind
	cleanUpPreviousKind: function(inKindName) {
		// Save changes made to components into previously rendered kind's _kindComponents_ array
		if(this.parentInstance.kind !== inKindName) {
			enyo.constructorForKind(this.parentInstance.kind).prototype.kindComponents = enyo.json.codify.from(this.$.serializer.serialize(this.parentInstance, true));
		}
		
		// Reset flags on previously rendered kind's _kindComponents_ array
		this.unflagAresComponents();
		
		// Clear previously rendered kind
		this.$.client.destroyClientControls();
		
		// Remove selection and drop highlighting
		this.hideSelectHighlight();
		this.unhighlightDropTargets();
	},
	resized: function() {
		this.inherited(arguments);
		this.highlightSelection();
	},
	/**
		Response to message sent from Deimos. Highlight the specified conrol
		and send a message with a serialized copy of the control.
	*/
	selectItem: function(inItem) {
		if(!inItem) {
			return;
		}
		
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.aresId === inItem.aresId) {
				this._selectItem(c);
				return;
			}
		}
	},
	//* Update _this.selection_ property value based on change in Inspector
	modifyProperty: function(inData) {
		if (typeof inData.value === "undefined") {
			this.removeProperty(inData.property);
		} else {
			this.updateProperty(inData.property, inData.value);
		}
		this.rerenderKind();
		this.selectItem(this.selection);
	},
	removeProperty: function(inProperty) {
		delete this.selection[inProperty];
	},
	updateProperty: function(inProperty, inValue) {
		this.selection[inProperty] = inValue;
	},
	
	//* Get each kind component individually
	flattenKindComponents: function(inComponents) {
		var ret = [],
			cs,
			c;
		
		if(!inComponents) {
			return ret;
		}
		
		for (var i=0;(c = inComponents[i]);i++) {
			ret.push(c);
			if(c.components) {
				cs = this.flattenKindComponents(c.components);
				for (var j=0;(c = cs[j]);j++) {
					ret.push(c);
				}
			}
		}
		
		return ret;
	},
	// TODO - merge this with flattenKindComponents()
	flattenChildren: function(inComponents) {
		var ret = [],
			cs,
			c;
		
		for (var i=0;(c = inComponents[i]);i++) {
			ret.push(c);
			if(c.children) {
				cs = this.flattenChildren(c.children);
				for (var j=0;(c = cs[j]);j++) {
					ret.push(c);
				}
			}
		}
		
		return ret;
	},
	
	//* Set up drag and drop attributes for component in _inComponents_
	makeComponentsDragAndDrop: function(inComponents) {
		for(var i=0, component;(component = inComponents[i]);i++) {
			this.makeComponentDragAndDrop(component);
		}
	},
	//* Set up drag and drop for _inComponent_
	makeComponentDragAndDrop: function(inComponent) {
		this.makeComponentDraggable(inComponent);
		this.makeComponentADropTarget(inComponent);
		this.flagAresComponent(inComponent);
	},
	//* Add the attribute _draggable="true"_ to _inComponent_
	makeComponentDraggable: function(inComponent) {
		if(inComponent.attributes) {
			inComponent.attributes.draggable =  true;
		} else {
			inComponent.attributes = {
				draggable:  true
			};
		}
	},
	/**
		Add the attribute _dropTarget="true"_ to _inComponent_ if it wasn't explicitly set
		to false in the design.js file (works as an opt out).
	*/
	makeComponentADropTarget: function(inComponent) {
		if(inComponent.attributes) {
			// TODO: Revisit this, once indexer's propertyMetaData is integrated
			inComponent.attributes.dropTarget = true; //(this.containerData[inComponent.kind] !== false);
		} else {
			inComponent.attributes = {
				dropTarget: (this.containerData[inComponent.kind] !== false)
			};
		}
	},
	flagAresComponent: function(inComponent) {
		inComponent.aresComponent = true;
	},
	//* Remove _aresComponent_ flag from previously used _this.aresComponents_ array
	unflagAresComponents: function() {
		for(var i=0, component;(component = this.aresComponents[i]);i++) {
			delete component.aresComponent;
		}
	},
	
	isValidDropTarget: function(inControl) {
		return (inControl && inControl !== this.selection && !inControl.isDescendantOf(this.selection));
	},
	getControlById: function(inId, inContainer) {
		inContainer = inContainer || this.$.client;
		for(var i=0, c;(c=this.flattenChildren(inContainer.children)[i]);i++) {
			if(c.aresId === inId) {
				return c;
			}
		}
	},
	
	getEventDragTarget: function(inComponent) {
		return (!inComponent) ? null : (!this.isDraggable(inComponent)) ? this.getEventDragTarget(inComponent.parent) : inComponent;
	},
	getEventDropTarget: function(inComponent) {
		return (!inComponent) ? null : (inComponent === this.parentInstance) ? this.parentInstance : (!this.isDropTarget(inComponent)) ? this.getEventDropTarget(inComponent.parent) : inComponent;
	},
	isDraggable: function(inComponent) {
		return (inComponent.attributes && inComponent.attributes.draggable);
	},
	isDropTarget: function(inComponent) {
		return (inComponent.attributes && inComponent.attributes.dropTarget);
	},
	
	//* Highlight _inComponent_ with drop target styling, and unhighlight everything else
	highlightDropTarget: function(inComponent) {
		this.$.dropHighlight.setShowing(true);
		this.$.dropHighlight.setBounds(inComponent.hasNode().getBoundingClientRect());
	},
	unhighlightDropTargets: function() {
		this.$.dropHighlight.setShowing(false);
	},
	//* Highlight _this.selection_ with selected styling, and unhighlight everything else
	highlightSelection: function() {
		this.unhighlightDropTargets();
		this.renderSelectHighlight();
	},
	renderSelectHighlight: function() {
		if(this.selection && this.selection.hasNode()) {
			this.$.selectHighlight.setBounds(this.selection.hasNode().getBoundingClientRect());
			this.$.selectHighlight.show();
		}
	},
	hideSelectHighlight: function() {
		this.$.selectHighlight.hide();
	},
	syncDropTargetHighlighting: function() {
		var dropTarget = this.currentDropTarget ? this.$.serializer.serializeComponent(this.currentDropTarget, true) : null;
		this.sendMessage({op: "syncDropTargetHighlighting", val: dropTarget});
	},
	//* Set _inItem_ to _this.selected_ and notify Deimos
	_selectItem: function(inItem, noMessage) {
		this.selection = inItem;
		this.highlightSelection();
		if (noMessage) {
			return;
		}
		this.sendMessage({op: "select",	 val: this.$.serializer.serializeComponent(this.selection, true)});
	},
	/**
		Find any children in _inControl_ that match kind components of the parent instance,
		and make them drag/droppable (if appropriate)
	*/
	setupControlDragAndDrop: function(inControl) {
		var childComponents = this.flattenChildren(inControl.children),
			i,
			j;
		
		this.makeComponentDragAndDrop(inControl);
		
		for(i=0;i<childComponents.length;i++) {
			for(j=0;j<this.aresComponents.length;j++) {
				if(childComponents[i].aresId === this.aresComponents[j].aresId) {
					this.makeComponentDragAndDrop(childComponents[i]);
				}
			}
		}
	},
	//* Create object that is a copy of the passed in component
	getSerializedCopyOfComponent: function(inComponent) {
		return enyo.json.codify.from(this.$.serializer.serializeComponent(inComponent, true));
	},
	//* Send update to Deimos with serialized copy of current kind component structure
	kindUpdated: function() {
		this.sendMessage({op: "rendered", val: this.$.serializer.serialize(this.parentInstance, true)});
	},
	//* Eval code passed in by designer
	codeUpdate: function(inCode) {
		eval(inCode);
	},
	//* Update CSS by replacing the link/style tag in the head with an updated style tag
	cssUpdate: function(inData) {
		if(!inData.filename || !inData.code) {
			enyo.warn("Invalid data sent for CSS update:", inData);
			return;
		}
		
		var filename = inData.filename,
			code = inData.code,
			head = document.getElementsByTagName("head")[0],
			links = head.getElementsByTagName("link"),
			styles = head.getElementsByTagName("style"),
			el,
			i;
		
		// Look through link tags for a linked stylesheet with a filename matching _filename_
		for(i=0;(el = links[i]);i++) {
			if(el.getAttribute("rel") === "stylesheet" && el.getAttribute("type") === "text/css" && el.getAttribute("href") === filename) {
				this.updateStyle(filename, code, el);
				return;
			}
		}
		
		// Look through style tags for a tag with a data-href property matching _filename_
		for(i=0;(el = styles[i]);i++) {
			if(el.getAttribute("data-href") === filename) {
				this.updateStyle(filename, code, el);
				return;
			}
		}
	},
	//* Replace _inElementToReplace_ with a new style tag containing _inNewCode_
	updateStyle: function(inFilename, inNewCode, inElementToReplace) {
		var head = document.getElementsByTagName("head")[0],
			newTag = document.createElement("style");
		
		newTag.setAttribute("type", "text/css");
		newTag.setAttribute("data-href", inFilename);
		newTag.innerHTML = inNewCode;
		
		head.insertBefore(newTag, inElementToReplace);
		head.removeChild(inElementToReplace);
	},
	enterCreateMode: function(inData) {
		this.setCreatePaletteItem(inData);
	},
	leaveCreateMode: function() {
		this.setCreatePaletteItem(null);
	},
	
	
	
	
	
	
	
	
	
	
	
	
	
	holdOver: function(inEvent) {
		var x = inEvent.clientX,
			y = inEvent.clientY,
			currentContainerItem = this.getContainerItem(),
			currentBeforeItem = this.getBeforeItem(),
			newBeforeItem,
			newContainer,
			container = this.getCurrentDropTarget(),
			onEdge = this.checkDragOverBoundary(container, x, y);
		
		if (!container) {
			return;
		}
		
		if (onEdge < 0) {
			newContainer = container.parent;
			newBeforeItem = container;
		} else if (onEdge > 0) {
			newContainer = container.parent;
			newBeforeItem = this.findAfterItem(newContainer, container, x, y);
		} else {
			newContainer = container;
			newBeforeItem = (container.children.length > 0) ? this.findBeforeItem(container, x, y) : null;
		}
		
		this.setContainerItem(newContainer);
		this.setBeforeItem(newBeforeItem);
		
		// If we are creating a new item and the current selection is not equal to the new item, set _this.selection_
		if (this.getCreatePaletteItem() && (!this.selection || this.selection.aresId !== this.getCreatePaletteItem().aresId)) {
			this.selection = this.getContainerItem().createComponent(this.getCreatePaletteItem()).render();
		}
		
		this.prerenderDrop();
	},
	//* Handle drop that has been trigged from outside of the iframe (i.e. in the ComponentView)
	foreignPrerenderDrop: function (inData) {
		var containerItem = this.getControlById(inData.targetId),
			beforeItem    = inData.beforeId ? this.getControlById(inData.beforeId) : null;
		
		this.setContainerItem(containerItem);
		this.setBeforeItem(beforeItem);
		this.prerenderDrop();
	},
	prerenderDrop: function() {
		var movedControls, movedInstances;
		
		// If not a legal drop, do nothing
		if (!this.legalDrop()) {
			return;
		}
		
		// Create copy of app in post-move state
		this.renderUpdatedAppClone();
		
		// Figure which controls need to move to get to the new state
		movedControls = this.getMovedControls();
		
		// Hide app copy
		this.hideUpdatedAppClone();
		
		// Move (hidden) selected control to new position
		this.moveSelection();
		
		// Hide any controls that need to be moved
		movedInstances = this.hideMovedControls(movedControls);
		
		// Turn off selection/drop area highlighting
		this.hideSelectHighlight();
		this.unhighlightDropTargets();
		
		// Create copies of controls that need to move, and animate them to the new posiitions
		this.animateMovedControls(movedControls);
		
		// When animation completes, udpate parent instance to reflect changes. TODO - don't use setTimeout, do this on an event when the animation completes
		setTimeout(enyo.bind(this, function() { this.prerenderMoveComplete(movedInstances); }), this.moveControlSecs*1000 + 100);
	},
	prerenderMoveComplete: function(inInstances) {
		// Hide layer with flying controls
		this.$.flightArea.hide();
		// Show hidden controls in app
		this.showMovedControls(inInstances);
		// Point _this.parentInstance_ to current client controls
		this.parentInstance = this.$.client.getClientControls()[0];
	},
	legalDrop: function() {
		var containerId = (this.getContainerItem()) ? this.getContainerItem().aresId : null,
			beforeId    = (this.getBeforeItem())    ? this.getBeforeItem().aresId    : null;
		
		// If creating a new item, drop is legal
		if (this.getCreatePaletteItem()) {
			return true;
		}
		
		if ((!this.getContainerItem() || !this.selection) || this.selection.aresId === containerId || this.selection.aresId === beforeId) {
			return false;
		}
		
		return true;
	},
	//* Render updated copy of the parentInstance into _cloneArea_
	renderUpdatedAppClone: function() {
		this.$.cloneArea.destroyClientControls();
		this.$.cloneArea.createComponent({kind: this.parentInstance.kind});
		this.$.cloneArea.applyStyle("display", "block");
		this.$.cloneArea.render();
		
		var containerId = (this.getContainerItem()) ? this.getContainerItem().aresId : null,
			container   = this.getControlById(containerId, this.$.cloneArea),
			beforeId    = (this.getBeforeItem()) ? this.getBeforeItem().aresId : null,
			before      = (beforeId) ? this.getControlById(beforeId, this.$.cloneArea) : null,
			selection   = this.getControlById(this.selection.aresId, this.$.cloneArea),
			clone       = this.cloneControl(this.selection); //this.createSelectionGhost(selection);
		
		if (before) {
			clone = enyo.mixin(clone, {beforeId: beforeId, addBefore: before});
		}
		
		container.createComponent(clone).render();
		
		if (selection) {
			selection.destroy();
		}
	},
	//* Return all controls that will be affected by this move
	getMovedControls: function() {
		var originalPositions = this.getControlPositions(this.$.client.children),
			updatedPositions  = this.getControlPositions(this.$.cloneArea.children),
			movedControls     = [],
			originalItem,
			updatedItem,
			i,
			j;
		
		for (i = 0; (originalItem = originalPositions[i]); i++) {
			for (j = 0; (updatedItem = updatedPositions[j]); j++) {
				if (originalItem.comp.aresId === updatedItem.comp.aresId && !this.rectsAreEqual(originalItem.rect, updatedItem.rect)) {
					movedControls.push({
						comp:      originalItem.comp,
						origStyle: this.cloneCSS(enyo.dom.getComputedStyle(originalItem.comp.hasNode())),
						newStyle:  this.cloneCSS(enyo.dom.getComputedStyle(updatedItem.comp.hasNode())),
						origRect:  originalItem.rect,
						newRect:   updatedItem.rect
					});
				}
			}
		}
		
		return movedControls;
	},
	cloneCSS: function(inCSS) {
		for(var i = 0, cssText = ""; i < inCSS.length; i++) {
			if (
					inCSS[i] === "position" ||
					inCSS[i] === "top" ||
					inCSS[i] === "left" ||
					inCSS[i] === "-webkit-transition-duration" ||
					inCSS[i] === "-webkit-transition-property"
				) {
				continue;
			}
			cssText += inCSS[i] + ": " + inCSS.getPropertyValue(inCSS[i]) + "; ";
		}
		return cssText;
	},
	hideMovedControls: function(inControls) {
		var originalControls = this.flattenChildren(this.$.client.children),
			hiddenControls = [];
			
		for (var i = 0; i < originalControls.length; i++) {
			if (!originalControls[i].aresId) {
				continue;
			}
			for (var j = 0; j < inControls.length; j++) {
				if (inControls[j].comp.aresId && originalControls[i].aresId === inControls[j].comp.aresId) {
					originalControls[i].applyStyle("opacity", "0");
					hiddenControls.push(originalControls[i]);
				}
			}
		}
		
		return hiddenControls;
	},
	// Move selection to new position
	moveSelection: function() {
		var containerId = (this.getContainerItem()) ? this.getContainerItem().aresId : null,
			container   = this.getControlById(containerId),
			beforeId    = (this.getBeforeItem()) ? this.getBeforeItem().aresId : null,
			before      = (beforeId) ? this.getControlById(beforeId) : null,
			clone       = this.cloneControl(this.selection); //this.createSelectionGhost(this.selection);
		
		if (before) {
			clone = enyo.mixin(clone, {beforeId: beforeId, addBefore: before});
		}
		
		this.selection.destroy();
		this.selection = container.createComponent(clone).render();
	},
	//* Draw controls that will do aniumating at starting points and then kick off animation
	animateMovedControls: function(inControls) {
		this.renderAnimatedControls(inControls);
		this.animateAnimatedControls();
	},
	renderAnimatedControls: function(inControls) {
		// Clean up existing animated controls
		this.$.flightArea.destroyClientControls();
		
		// Create a copy of each control that is being moved
		for (var i = 0, control; i < inControls.length; i++) {
			if (inControls[i].comp.aresId === this.selection.aresId) {
				control = this.$.flightArea.createComponent(
					{
						kind:     "enyo.Control",
						aresId:   inControls[i].comp.aresId,
						moveTo:   inControls[i].newRect,
						newStyle: inControls[i].newStyle
					}
				);
				control.addStyles("z-index:1000;");
			} else {
				control = this.$.flightArea.createComponent(
					{
						kind:     inControls[i].comp.kind,
						content:  inControls[i].comp.getContent(),
						aresId:   inControls[i].comp.aresId,
						moveTo:   inControls[i].newRect,
						newStyle: inControls[i].newStyle
					}
				);
			}
			
			// Set the starting top/left values and props to enable animation
			control.addStyles(
				inControls[i].origStyle +
				"position: absolute; " +
				"top: "  + inControls[i].origRect.top  + "px; " +
				"left: " + inControls[i].origRect.left + "px; " +
				"-webkit-transition-duration: " + this.moveControlSecs + "s; " +
				"-webkit-transition-property: all; "
			);
		}
		
		// Render animated controls
		this.$.flightArea.render().applyStyle("display", "block");
	},
	animateAnimatedControls: function() {
		var controls = this.$.flightArea.getClientControls();
		setTimeout(function() {
			for(var i=0;i<controls.length;i++) {
				controls[i].addStyles(
					controls[i].newStyle +
					"position: absolute; " +
					"top: "  + controls[i].moveTo.top  + "px; " +
					"left: " + controls[i].moveTo.left + "px; "
				);
				controls[i].render();
			}
		}, 0);
	},
	//* Show controls that were hidden for the move
	showMovedControls: function(inControls) {
		for (var i = 0; i < inControls.length; i++) {
			inControls[i].applyStyle("opacity", "1");
		}
	},
	renderUpdatedAppClone: function() {
		this.$.cloneArea.destroyClientControls();
		this.$.cloneArea.createComponent({kind: this.parentInstance.kind});
		this.$.cloneArea.applyStyle("display", "block");
		this.$.cloneArea.render();
		
		var containerId = (this.getContainerItem()) ? this.getContainerItem().aresId : null,
			container   = this.getControlById(containerId, this.$.cloneArea),
			beforeId    = (this.getBeforeItem()) ? this.getBeforeItem().aresId : null,
			before      = (beforeId) ? this.getControlById(beforeId, this.$.cloneArea) : null,
			selection   = this.getControlById(this.selection.aresId, this.$.cloneArea),
			clone       = this.cloneControl(this.selection); //this.createSelectionGhost(selection);
		
		if (before) {
			clone = enyo.mixin(clone, {beforeId: beforeId, addBefore: before});
		}
		
		container.createComponent(clone).render();
		if (selection) {
			selection.destroy();
		}
	},
	hideUpdatedAppClone: function() {
		this.$.cloneArea.destroyClientControls();
		this.$.cloneArea.hide();
	},
	//* TODO - This createSelectionGhost is WIP
	createSelectionGhost: function (inItem) {
		var computedStyle = enyo.dom.getComputedStyle(inItem.hasNode()),
			rect = inItem.hasNode().getBoundingClientRect(),
			borderWidth = 1,
			height,
			style;
		
		if (!computedStyle) {
			enyo.warn("Attempted to clone item with no node: ", inItem);
			return null;
		}
		
		this.log("h: ", parseInt(computedStyle.height), "w: ", parseInt(computedStyle.width), "p: ", parseInt(computedStyle.padding), "m: ", parseInt(computedStyle.margin));
		
		style = "width: "   + computedStyle.width + "; " +
				"height: "  + computedStyle.height + "; " +
				//"margin: "  + computedStyle.margin + "; " +
				//"padding: " + computedStyle.padding + "; " +
				"border: "  + borderWidth + "px dotted black; " +
				"display: " + computedStyle.display + "; " +
				"background: rgba(255,255,255,0.8); ";
		
		return {
			kind:   "enyo.Control",
			aresId: inItem.aresId,
			style:  style
		};
	},
	cloneControl: function(inSelection) {
		return {
			kind:     inSelection.kind,
			content:  inSelection.getContent(),
			aresId:   inSelection.aresId,
			classes:  inSelection.classes,
			style:    inSelection.style
		};
	},
	getControlPositions: function(inComponents) {
		var controls = this.flattenChildren(inComponents),
			positions = [];
		
		for(var i=0;i<controls.length;i++) {
			if (controls[i].aresId && controls[i].hasNode()) {
				positions.push({comp: controls[i], rect: controls[i].hasNode().getBoundingClientRect()});
			}
		}
		
		return positions;
	},
	rectsAreEqual: function(inRectA, inRectB) {
		return (inRectA.top === inRectB.top && inRectA.left === inRectB.left && inRectA.bottom === inRectB.bottom && inRectA.right === inRectB.right && inRectA.height === inRectB.height && inRectA.width === inRectB.width);
	},
	checkDragOverBoundary: function(inContainer, x, y) {
		if (!inContainer) {
			return 0;
		}
		
		var bounds = inContainer.hasNode().getBoundingClientRect();
		if (x - bounds.left <= this.edgeThresholdPx) {
			return -1;
		} else if ((bounds.left + bounds.width) - x <= this.edgeThresholdPx) {
			return 1;
		} else if (y - bounds.top <= this.edgeThresholdPx) {
			return -1;
		} else if ((bounds.top + bounds.height) - y <= this.edgeThresholdPx) {
			return 1;
		} else {
			return 0;
		}
	},
	findBeforeItem: function(inContainer, inX, inY) {
		if (!inContainer) {
			return null;
		}
		
		var childData = [],
			aboveItems,
			belowItems,
			rightItems,
			sameRowItems;
		
		// Build up array of nodes
		for (var i = 0; i < inContainer.children.length; i++) {
			if (inContainer.children[i].hasNode()) {
				childData.push(enyo.mixin(
					enyo.clone(inContainer.children[i].node.getBoundingClientRect()),
					{aresId: inContainer.children[i].aresId}
				));
			}
		}
		
		aboveItems = this.findAboveItems(childData, inY);
		// If no above items, place as the first item in this container
		if (aboveItems.length === 0) {
			return childData[0];
		}
		
		belowItems = this.findBelowItems(childData, inY);
		// If no below items, place as the last item in this container
		if (belowItems.length === 0) {
			return null;
		}
		
		// Items on the same row are both above and below the dragged item
		sameRowItems = this.removeDuplicateItems(aboveItems, belowItems);
		
		// If we have items on the same row as the dragged item, find the first item to the left
		if (sameRowItems.length > 0) {
			// If on the same row but no left items, place as the first item on this row
			if (this.findLeftItems(sameRowItems, inX).length === 0) {
				return this.filterArrayForMinValue(sameRowItems, "left");
			// If there are left items, the leftmost right item becomes the before item
			} else {
				rightItems = this.findRightItems(sameRowItems, inX);
				// If there are no items to the right, insert before topmost and leftmost below item
				if(rightItems.length === 0) {
					return this.filterArrayForMinValue(this.findLeftmostItems(belowItems), "top", inY);
				// If there are items to the right, return the leftmost one
				} else {
					return this.filterArrayForMinValue(rightItems, "left");
				}
			}
		}
		
		// If there are no items on the same row as this one, insert before topmost and leftmost below item
		return this.filterArrayForMinValue(this.findLeftmostItems(belowItems), "top");
	},
	//* Return the item in _inContaienr_ that is immediately "after" _inItem_
	findAfterItem: function(inContainer, inItem, inX, inY) {
		if (!inContainer) {
			return null;
		}
		
		var childData = [],
			aboveItems,
			belowItems,
			sameRowItems;
		
		for (var i = 0; i < inContainer.children.length; i++) {
			if (inContainer.children[i].hasNode()) {
				childData.push(enyo.mixin(
					enyo.clone(inContainer.children[i].node.getBoundingClientRect()),
					{aresId: inContainer.children[i].aresId}
				));
			}
		}
		
		// Filter out _inItem_ from _aboveItems_
		aboveItems = this.findAboveItems(childData, inY).filter(function(elem, pos, self) {
			return elem.aresId !== inItem.aresId;
		});
		// Filter out _inItem_ from _belowItems_
		belowItems = this.findBelowItems(childData, inY).filter(function(elem, pos, self) {
			return elem.aresId !== inItem.aresId;
		});
		
		// If no below items, place as the last item in this container
		if (belowItems.length === 0) {
			return null;
		}
		
		// Items on the same row are both above and below the dragged item
		sameRowItems = this.removeDuplicateItems(aboveItems, belowItems);
		
		/**
			If we have items on the same row as the dragged item, find the first item
			to the right of _inItem_
		*/
		if (sameRowItems.length > 0) {
			return this.filterArrayForMinValue(this.findRightItems(sameRowItems, inX), "left");
		}
		
		// If no above items, place as the first item in this container
		if (aboveItems.length === 0) {
			return childData[0];
		}
		
		// If there are no items on the same row as this one, insert before topmost and leftmost below item
		return this.filterArrayForMinValue(this.findLeftmostItems(belowItems), "top");
	},
	findAboveItems: function(inChildren, inY) {
		for (var i = 0, items = []; i < inChildren.length; i++) {
			if (inChildren[i].top - inY < 0) {
				items.push(inChildren[i]);
			}
		}
		return items;
	},
	findBelowItems: function(inChildren, inY) {
		for (var i = 0, items = []; i < inChildren.length; i++) {
			if (inY < inChildren[i].bottom) {
				items.push(inChildren[i]);
			}
		}
		return items;
	},
	findLeftItems: function(inChildren, inX) {
		for (var i = 0, items = []; i < inChildren.length; i++) {
			if (inChildren[i].left < inX) {
				items.push(inChildren[i]);
			}
		}
		return items;
	},
	findRightItems: function(inChildren, inX) {
		for (var i = 0, items = []; i < inChildren.length; i++) {
			if (inX < inChildren[i].right) {
				items.push(inChildren[i]);
			}
		}
		return items;
	},
	findLeftmostItems: function(inItems) {
		var i, val, items = [];
		for (i = 0, val = null; i < inItems.length; i++) {
			if (val === null || inItems[i].left < val) {
				val = inItems[i].left;
			}
		}
		for (i = 0, items = []; i < inItems.length; i++) {
			if (inItems[i].left === val) {
				items.push(inItems[i]);
			}
		}
		return items;
	},
	filterArrayForMinValue: function(inArray, inProp, inMin) {
		for (var i = 0, index = -1; i < inArray.length; i++) {
			if (inMin && inArray[i][inProp] <= inMin) {
				continue;
			}
			if (index === -1 || inArray[i][inProp] <= inArray[index][inProp]) {
				index = i;
			}
		}
		return index === -1 ? null : inArray[index];
	},
	removeDuplicateItems: function(inA, inB) {
		return inA.concat(inB).filter(function(elem, pos, self) {
	    	return self.indexOf(elem) !== pos;
		});
	}
});
