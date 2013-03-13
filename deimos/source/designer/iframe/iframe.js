enyo.kind({
	name: "Ares.App",
	classes: "enyo-fit",
	id: "aresApp",
	handlers: {
		ondragleave: "iframeDragleave"
	},
	components: [
		{name: "client", fit: true, classes:"enyo-fit"},
		{name: "serializer", kind: "Serializer"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"},
		{name: "selectHighlight", classes: "iframe-highlight iframe-select-highlight"},
		{name: "dropHighlight", classes: "iframe-highlight iframe-drop-highlight"}
	],
	
	selection: null,
	parentInstance: null,
	containerData: null,
	aresComponents: [],
	
	create: function() {
		this.inherited(arguments);
		this.addHandlers();
		this.addDispatcherFeature();
	},
	rendered: function() {
		this.inherited(arguments);
		this.sendMessage({op: "state", val: "initialized"});
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
		if(!inEvent.message || !inEvent.message.op) {
			enyo.warn("Deimos iframe received invalid message data:", msg);
			return;
		}
		
		var msg = inEvent.message;
		
		switch(msg.op) {
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
			default:
				enyo.warn("Deimos iframe received unknown message op:", msg);
				break;
		}
	},
	//* On down, set _this.selection_
	down: function(e) {
		var dragTarget = this.getEventDragTarget(e.dispatchTarget);
		
		if(dragTarget && dragTarget.aresComponent) {
			this._selectItem(dragTarget);
		}
	},
	//* On drag start, set the event _dataTransfer_ property to contain a serialized copy of _this.selection_
	dragstart: function(e) {
		if(!e.dataTransfer) {
			return false;
		}
		
		e.dataTransfer.setData('ares/moveitem', this.$.serializer.serializeComponent(this.selection, true));
        return true;
	},
	//* On drag over, enable HTML5 drag-and-drop if there is a valid drop target
	dragover: function(e) {
		var dropTarget;
		
		if(!e.dataTransfer) {
			return false;
		}

		// Deselect the currently selected item if we're creating a new item, so all items are droppable
		if (e.dataTransfer.types[0] == "ares/createitem") {
			// TODO: Should probably have a proper "deselect" operation that is synched
			// with the component view and inspector; for now just null it out
			this.selection = null;
			this.hideSelectHighlight();
		}
		
		dropTarget = this.getEventDropTarget(e.dispatchTarget);
		
		if(!this.isValidDropTarget(dropTarget)) {
			this.currentDropTarget = null;
			this.syncDropTargetHighlighting();
			return false;
		}

		e.preventDefault();
		
		// If dragging on current drop target, do nothing (redundant)
		if(this.currentDropTarget && this.currentDropTarget === dropTarget) {
			return false;
		}
		
		this.currentDropTarget = dropTarget;
		this.highlightDropTarget(this.currentDropTarget);
		this.syncDropTargetHighlighting();
		
		return true;
	},
	//* On drag leave, unhighlight previous drop target
	dragleave: function(e) {
		var dropTarget;
		
		if(!e.dataTransfer) {
			return false;
		}
		
		dropTarget = this.getEventDropTarget(e.dispatchTarget);

		if(!this.isValidDropTarget(dropTarget)) {
			return false;
		}
		
		this.currentDropTarget = null;
		this.syncDropTargetHighlighting();
		
		return true;
	},
	
	//* On drop, either move _this.selection_ or create a new component
	drop: function(inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}
		
		var dataType = inEvent.dataTransfer.types[0],
			dropData = enyo.json.codify.from(inEvent.dataTransfer.getData(dataType)),
			dropTarget = this.getEventDropTarget(inEvent.dispatchTarget);
		
		this.currentDropTarget = null;
		this.syncDropTargetHighlighting();
		
		if(!this.isValidDropTarget(dropTarget)) {
			return false;
		}
		
		switch(dataType) {
			case "ares/moveitem":
				this.sendMessage({op: "moveItem", val: {itemId: dropData.aresId, targetId: dropTarget.aresId}});
				break;
			case "ares/createitem":
				this.sendMessage({op: "createItem", val: {config: dropData.config, targetId: dropTarget.aresId}});
				break;
			default:
				enyo.warn("Component view received unknown drop: ", dataType, dropData);
				break;
		}
		
		return true;
	},
	
	//* Save _inData_ as _this.containerData_ to use as a reference when creating drop targets.
	setContainerData: function(inData) {
		this.containerData = inData;
		this.sendMessage({op: "state", val: "ready"});
	},
	//* Render the specified kind
	renderKind: function(inKind) {
		var kindConstructor = enyo.constructorForKind(inKind.name);
		
		// Saftey first
		if(!kindConstructor) {
			enyo.warn("No constructor exists for ", inKind.name);
			return;
		} else if(!kindConstructor.prototype) {
			enyo.warn("No prototype exists for ", inKind.name);
			return;
		}
		
		// Stomp on existing _kindComponents_ to ensure that we render exactly what the user
		// has defined. If components came in as a string, convert to object first.
		kindConstructor.prototype.kindComponents = (typeof inKind.components === "string") ? enyo.json.codify.from(inKind.components) : inKind.components;
		
		// Clean up after previous kind
		if(this.parentInstance) {
			this.cleanUpPreviousKind(inKind.name);
		}
		
		// Save this kind's _kindComponents_ array
		this.aresComponents = this.flattenKindComponents(kindConstructor.prototype.kindComponents);
		
		// Enable drag/drop on all of _this.aresComponents_
		this.makeComponentsDragAndDrop(this.aresComponents);
		
		// Save reference to the parent instance currently rendered
		this.parentInstance = this.$.client.createComponent({kind: inKind.name}).render();
		
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
		
		if(inData.property === "id") {
			this.rerenderKind();
			this.selectItem(this.selection);
		} else {
			this.refreshClient();
		}
	},
	removeProperty: function(inProperty) {
		delete this.selection[inProperty];
	},
	updateProperty: function(inProperty, inValue) {
		this.selection.setProperty(inProperty, inValue);
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
	getControlById: function(inId) {
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
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
	_selectItem: function(inItem) {
		this.selection = inItem;
		this.highlightSelection();
		this.sendMessage({op: "select",	 val: this.$.serializer.serializeComponent(this.selection, true)});
	},
	/**
		Create an object copy of the _inDroppedControl_, then destroy and recreate it
		as a child of _inTargetControl_
	*/
	dropControl: function(inDroppedControl, inTargetControl) {
		var droppedControlCopy = this.getSerializedCopyOfComponent(inDroppedControl),
			newComponent;
		
		inDroppedControl.destroy();
		
		// Create a clone of the moved control
		newComponent = inTargetControl.createComponent(droppedControlCopy, {owner: this.parentInstance});
		
		// Make sure all moved controls are draggable/droppable as appropriate
		this.setupControlDragAndDrop(newComponent);
		
		this.refreshClient();
		
		// Maintain selected state
		this._selectItem(newComponent);
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
	//* Rerender client, reselect _this.selection_, and notify Deimos
	refreshClient: function(noMessage) {
		this.$.client.render();
		
		if(!noMessage) {
			this.kindUpdated();
		}
		
		this.selectItem(this.selection);
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
	}
});
