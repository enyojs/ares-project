/*global enyo */

enyo.kind({
	name: "ComponentView",
	events: {
		onSelect: "",
		onHighlightDropTarget: "",
		onUnHighlightDropTargets: "",
		onMoveItem: "",
		onCreateItem: "",
		onHoldOver: ""
	},
	handlers: {
		onItemDown: "itemDown",
		onItemDragover: "itemDragover",
		onPlaceholderDrop: "placeholderDrop",
		onItemDrop: "itemDrop",
		onItemDragend: "itemDragend"
	},
	published: {
		dragType: null
	},
	style: "position: relative;",
	components: [
		{kind: "Scroller", classes: "enyo-fit", components: [
			{name: "client", style: "padding: 8px;"}
		]}
	],

	holdoverTimeout:   null,
	holdoverTimeoutMS: 500,
	scroll: false,

	//* Draw component view visualization of component tree
	visualize: function(inComponents) {
		this.destroyClientControls();
		this._visualize(inComponents, this);
		this.render();
	},
	//* Create component view representation of designer
	_visualize: function(inComponents, inParent) {
		for (var i=0, entry, c; (c=inComponents[i]); i++) {
			entry = inParent.createComponent(this.createEntry(c));
			if (c.components) {
				this._visualize(c.components, entry);
			}
		}
	},
	//* Create an entry in the component view
	createEntry: function(inComponent) {
		return {kind: "ComponentViewItem", comp: inComponent};
	},
	//* Unhighlight existing selection and set _this.selection_ to _inComponent_
	select: function(inComponent) {
		if(this.selection) {
			this.unHighlightItem(this.selection);
		}
		this.selection = inComponent;
		this.highlightSelection();
		if(this.scroll){
			this.$.scroller.scrollIntoView(this.selection, true);
		}
		this.scroll = false;
	},
	//* Select control with _comp.aresId_ that matches _inComponent_
	setSelected: function(inComponent, haveToScroll) {
		this.scroll = haveToScroll;
		this._setSelected(inComponent.aresId, this.getClientControls());
	},
	_setSelected: function(inId, inComponents) {
		for (var i=0, c; (c=inComponents[i]); i++) {
			if(c.comp && c.getAresId() === inId) {
				this.select(c);
				return true;
			}
			if (c.getClientControls().length > 0) {
				if(this._setSelected(inId, c.getClientControls())) {
					return true;
				}
			}
		}
	},

	itemDown: function(inSender, inEvent) {
		this.doSelect({component: inEvent.originator.comp});
		return true;
	},
	itemDragover: function(inSender, inEvent) {
		var target = inEvent.targetComponent,
			dropDetails,
			dropTarget,
			dropTargetId,
			beforeTarget,
			beforeItem,
			beforeId = null,
			createMode;

		if (inEvent.dataTransfer.items) {
			createMode = (this.getDragType() === "ares/createitem");
		}

		// In create mode, allow to drop even on the selected component.
		if ((createMode === true) && this.selection) {
			this.unHighlightItem(this.selection);
			this.selection = null;
		}

		if (!this.isValidDropTarget(target)) {
			this.resetDropDetails();
			this.unhighlightDropTargets();
			return true;
		}

		// Enable HTML5 drop
		inEvent.preventDefault();

		dropDetails = this.calcDropDetails(target, inEvent.clientY);

		// No need to redo the work if the data hasn't changed
		if (this.dropDetails && dropDetails.pos === this.dropDetails.pos && dropDetails.target === this.dropDetails.target) {
			return true;
		}

		this.dropDetails = dropDetails;
		dropTarget = dropDetails.target;

		// Clear the placeholder on every dragover
		this.destroyPlaceholder();

		// Reset the holdover timeout on every dragover
		this.resetHoldoverTimeout();

		if (dropDetails.pos === "center") {
			this.highlightDropTarget(dropTarget);
			dropTargetId = dropTarget.comp.aresId;
		} else {
			this.unhighlightDropTargets();
			this.createDropPlaceholder(dropTarget, dropDetails.pos);
			// TODO - owner should always have a getAresId() function - currently fails if owner is the app.
			dropTargetId = dropTarget.owner.getAresId ? dropTarget.owner.getAresId() : null;
			beforeTarget = this.findControlBeforeTarget(dropTarget, dropDetails.pos);
			beforeItem = beforeTarget ? beforeTarget.comp : null;
			beforeId = beforeItem ? beforeItem.aresId : null;
		}

		this.setHoldoverTimeout(dropTargetId, beforeId);
		return true;
	},
	//* When a component is dropped on another component
	itemDrop: function(inSender, inEvent) {
		this.destroyPlaceholder();

		var dropData = this.getDropData(inEvent),
			before,
			containerId,
			beforeId;

		// If the item was dropped in the center, add dragged control to target's controls
		if (this.dropDetails.pos === "center") {
			this.completeDrop(dropData, this.dropDetails.target.getAresId(), null);

		} else {
			before = this.findControlBeforeTarget(this.dropDetails.target, this.dropDetails.pos);

			// If dropping into the highest level control
			if (this.dropDetails.target.owner === this) {
				beforeId = (typeof before === "undefined" || before === null) ? null : before.getAresId();
				this.completeDrop(dropData, null, beforeId);

				// If _before_ === null, drop this item at the end of it's container (there is no before item)
			} else if (before === null) {
				this.completeDrop(dropData, this.dropDetails.target.owner.getAresId(), null);

				// Otherwise drop current item before _before_
			} else {
				containerId = (this.dropDetails.target.owner === this) ? null : this.dropDetails.target.owner.getAresId();
				this.completeDrop(dropData, containerId, before.getAresId());
			}
		}

		return true;
	},
	itemDragend: function(inSender, inEvent) {
		this.destroyPlaceholder();
	},
	//* When a component is dropped on a placeholder
	placeholderDrop: function(inSender, inEvent) {
		this.destroyPlaceholder();

		var dropData = this.getDropData(inEvent),
			containerId = (this.dropDetails.target.owner.comp) ? this.dropDetails.target.owner.getAresId() : null,
			before = this.findControlBeforeTarget(this.dropDetails.target, this.dropDetails.pos),
			beforeId = (before && before.comp) ? before.getAresId() : null;

		this.completeDrop(dropData, containerId, beforeId);
		return true;
	},
	getDropData: function(inEvent) {
		var data = enyo.json.codify.from(inEvent.dataTransfer.getData("text")),
			item = data.item,
			type = data.type;
		return {type: type, data: item};
	},
	completeDrop: function(inDropData, inTargetId, inBeforeId) {
		switch (inDropData.type) {
		case "ares/moveitem":
			this.doMoveItem({
				itemId:   inDropData.data.aresId,
				targetId: inTargetId,
				beforeId: inBeforeId
			});
			break;
		case "ares/createitem":
			this.doCreateItem({
				config:   inDropData.data.config,
				options:  inDropData.data.options,
				targetId: inTargetId,
				beforeId: inBeforeId
			});
			break;
		default:
			enyo.warn("Component view received unknown drop: ", inDropData);
			break;
		}

		this.resetDropDetails();
	},
	setHoldoverTimeout: function (inTargetId, inBeforeId) {
		this.holdoverTimeout = setTimeout(enyo.bind(this, function() { this.holdOver(inTargetId, inBeforeId); }), this.holdoverTimeoutMS);
	},
	holdOver: function (inTargetId, inBeforeId) {
		this.doHoldOver({targetId: inTargetId, beforeId: inBeforeId});
	},
	isValidDropTarget: function(inComponent) {
		return (inComponent !== this.selection && inComponent.getAttribute("dropTarget") === "true" && !inComponent.isDescendantOf(this.selection));
	},
	calcDropDetails: function(inTarget, inClientY) {
		if (!inTarget.hasNode()) {
			return null;
		}

		var rect = inTarget.hasNode().getBoundingClientRect(),
			topEdge = 5,
			bottomEdge = rect.height - topEdge,
			distanceFromTop = inClientY - rect.top,
			pos = (distanceFromTop <= topEdge) ? "top" : (distanceFromTop >= bottomEdge) ? "bottom" : "center";

		return {pos: pos, target: inTarget};
	},
	findControlFromDropDetails: function(inTarget, inPos) {
		var targetIndex = this.indexOfControl(inTarget),
			index = (inPos === "center") ? targetIndex : (inPos === "top") ? targetIndex-1 : targetIndex+1;
		return this.controlAtIndex(index);
	},
	createDropPlaceholder: function(inTarget, inPos) {
		var beforeControl = this.findControlBeforeTarget(inTarget, inPos),
			leftMargin = (typeof beforeControl === "undefined")
				?	"0px"
				:	(beforeControl === null)
				?	inTarget.owner.domStyles["padding-left"] || "0px"
				:	beforeControl.domStyles["padding-left"]  || "0px",
			placeholder = {kind: "ComponentViewPlaceholder", style: "margin-left:" + leftMargin};

		if (beforeControl) {
			placeholder.addBefore = beforeControl;
		}

		this.dropPlaceholder = inTarget.owner.createComponent(placeholder);
		this.dropPlaceholder.render();
	},
	findControlBeforeTarget: function(inTarget, inPos) {
		var addBeforeIndex = this.calcAddBeforeIndex(inTarget, inPos);
		return (addBeforeIndex === -1) ? null : inTarget.owner.controlAtIndex(addBeforeIndex);
	},
	calcAddBeforeIndex: function(inTarget, inPos) {
		var owner = inTarget.owner,
			targetIndex = owner.indexOfControl(inTarget),
			addBeforeIndex = (inPos === "top") ? targetIndex : targetIndex + 1;

		return (addBeforeIndex > owner.getClientControls().length + 1) ? -1 : addBeforeIndex;
	},
	destroyPlaceholder: function() {
		if(this.dropPlaceholder) {
			this.dropPlaceholder.destroy();
		}
	},
	resetDropDetails: function() {
		this.dropDetails = null;
		this.setDragType(null);
	},
	resetHoldoverTimeout: function() {
		clearTimeout(this.holdoverTimeout);
		this.holdoverTimeout = null;
	},
	highlightDropTarget: function(inComponent) {
		inComponent.$.label.applyStyle("background","#cedafe"); // TODO
		this.doHighlightDropTarget({component: inComponent.comp});
	},
	highlightSelection: function() {
		this.selection.$.label.applyStyle("background","orange"); // TODO
	},
	unHighlightItem: function(inComponent) {
		if(inComponent.$.label) {
			inComponent.$.label.applyStyle("background", "none"); // TODO
		}
	},
	unhighlightDropTargets: function() {
		this._unhighlightDropTargets(this.getClientControls());
		this.doUnHighlightDropTargets();
	},
	_unhighlightDropTargets: function(inComponents) {
		if (inComponents.length === 0) {
			return;
		}

		for (var i=0, c; (c=inComponents[i]); i++) {
			if(c === this.selection || c.kind === "ComponentViewPlaceholder") {
				continue;
			}

			this.unHighlightItem(c);
			this._unhighlightDropTargets(c.getClientControls());
		}
	},
	syncDropTargetHighlighting: function(inComponent) {
		var id = inComponent ? inComponent.aresId : null;
		this._syncDropTargetHighlighting(id, this.getClientControls());
	},
	_syncDropTargetHighlighting: function(inId, inComponents) {
		if (inComponents.length === 0) {
			return;
		}

		for (var i=0, c; (c=inComponents[i]); i++) {
			if(c === this.selection || !c.comp) {
				continue;
			} else if (c.getAresId() === inId) {
				this.highlightDropTarget(c);
				continue;
			}

			this.unHighlightItem(c);
			this._syncDropTargetHighlighting(inId, c.getClientControls());
		}
	}
});

enyo.kind({
	name: "ComponentViewItem",
	published: {
		comp: {}
	},
	events: {
		onItemDown: "",
		onItemDragover: "",
		onItemDrop: "",
		onItemDragend: ""
	},
	handlers: {
		ondown: "down",
		ondragstart: "dragstart",
		ondragover: "dragover",
		ondragleave: "dragleave",
		ondrop: "drop",
		ondragend: "dragend"
	},
	style: "padding-left: 15px;",
	attributes: {
		dropTarget: "true"
	},
	components: [
		{name: "label", components: [
			{name: "componentName", tag: "b", style: "pointer-events: none; line-height: 20px;"},
			{name: "componentKind", tag: "span", allowHtml: true, style: "pointer-events: none; line-height: 20px;"}
		]},
		{name: "client", style: "position: relative;"},
		{name: "dragTarget", attributes: {draggable: "true"}, comp: null, style: "background-color: white; position: absolute; opacity: 0.1;"}
	],
	rendered: function() {
		this.inherited(arguments);
		this.compChanged();
		this.$.dragTarget.setBounds(this.$.label.getBounds());
	},
	compChanged: function() {
		this.$.dragTarget.comp = this.getComp();
		this.$.componentName.setContent(this.getComp().name);
		this.$.componentKind.setContent("&nbsp;(<i>"+this.getComp().kind+"</i>)");
	},
	getAresId: function() {
		return this.getComp().aresId;
	},

	down: function(inSender, inEvent) {
		this.doItemDown(inEvent);

		// Using encoded 1px x 1px transparent png
		var imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEwRDRFRUY1Rjk3NDExRTI5NTRFQ0U1RjAwMURENDczIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEwRDRFRUY2Rjk3NDExRTI5NTRFQ0U1RjAwMURENDczIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTBENEVFRjNGOTc0MTFFMjk1NEVDRTVGMDAxREQ0NzMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MTBENEVFRjRGOTc0MTFFMjk1NEVDRTVGMDAxREQ0NzMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4/IH2ZAAAAEElEQVR42mL4//8/A0CAAQAI/AL+26JNFgAAAABJRU5ErkJggg==";
		this.createDragImage(imageData);
		return true;
	},
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}

		var dragData = {
			type: "ares/moveitem",
			item: inEvent.originator.comp
		};

		// Set drag data
		inEvent.dataTransfer.setData("text", enyo.json.codify.to(dragData));

		// Hide the drag image ghost on platforms where it exists
		if (inEvent.dataTransfer.setDragImage) {
			inEvent.dataTransfer.setDragImage(this.dragImage, 0, 0);
		}

		return true;
	},
	dragover: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
		inEvent.targetComponent = this;
		this.doItemDragover(inEvent);
		return true;
	},
	dragleave: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
	},
	drop: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
		this.doItemDrop(inEvent);
		return true;
	},
	dragend: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
		this.doItemDragend(inEvent);
		return true;
	},
	createDragImage: function(inImage) {
		this.dragImage = document.createElement("img");
		this.dragImage.src = inImage;
		return this.dragImage;
	}
});

enyo.kind({
	name: "ComponentViewPlaceholder",
	classes: "component-view-drop-placeholder",
	published: {
		before: null
	},
	handlers: {
		ondragover: "dragover",
		ondragleave: "dragleave",
		ondrop: "drop"
	},
	events: {
		onPlaceholderDrop: ""
	},
	dragover: function(inSender, inEvent) {
		inEvent.preventDefault();
		return true;
	},
	dragleave: function() {
		return true;
	},
	drop: function(inSender, inEvent) {
		this.doPlaceholderDrop(inEvent);
		return true;
	}
});
