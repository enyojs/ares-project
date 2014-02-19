/*global enyo, setTimeout, clearTimeout */

enyo.kind({
	name: "Ares.DesignerFrame",
	classes: "enyo-fit",
	id: "aresApp",
	handlers: {
		ondragleave: "designerFrameDragleave",
		onWebkitTransitionEnd: "prerenderMoveComplete" // TODO
	},
	published: {
		containerItem: null,
		beforeItem: null,
		currentDropTarget: null,
		createPaletteItem: null,
		dragType: null
	},
	components: [
		{name: "client", classes:"enyo-fit"},
		{name: "cloneArea", style: "background:rgba(0,200,0,0.5); opacity: 0;", classes: "enyo-fit enyo-clip", showing: false},
		{name: "flightArea", classes: "enyo-fit", showing: false},
		{name: "serializer", kind: "Ares.Serializer"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"},
		{name: "dropHighlight", classes: "designer-frame-highlight designer-frame-drop-highlight"},

		//* Resize handles
		{name: "topLeftResizeHandle", classes: "designer-frame-resize-handle", showing: false, sides: {top: true, left: true}, style: "top: 0px; left: 0px;"},
		{name: "topRightResizeHandle", classes: "designer-frame-resize-handle", showing: false, sides: {top: true, right: true}, style: "top: 0px; right: 0px;"},
		{name: "bottomLeftResizeHandle", classes: "designer-frame-resize-handle", showing: false, sides: {bottom: true, left: true}, style: "bottom: 0px; left: 0px;"},
		{name: "bottomRightResizeHandle", classes: "designer-frame-resize-handle", showing: false, sides: {bottom: true, right: true}, style: "bottom: 0px; right: 0px;"}
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


	// designerFrame will complain if user's application loads en enyo older than:
	minEnyoVersion: "2.3.0-pre.9",

	create: function() {
		this.trace = (this.debug === true ? this.log : function(){});
		this.inherited(arguments);
		this.addHandlers();
		this.addDispatcherFeature();
		window.onerror = enyo.bind(this, this.raiseLoadError);
	},
	raiseLoadError: function(msg, url, linenumber) {
		// I'm a goner
		var file = url.replace(/.*\/services(?=\/)/,'');
		var errMsg = "user app load FAILED with error '" + msg + "' in " + file + " line " + linenumber  ;
		this.trace(errMsg);
		this.sendMessage({op: "error", val: {msg: errMsg, reloadNeeded: true}});
		return true;
	},
	rendered: function() {
		this.inherited(arguments);
		this.trace("called");
		var splitRegExp = /[\.\-]+/ ;
		// version can be like 1.2.3-pre.4 or 1.2.3-rc.1
		// rc sorts after pre
		var expVer = this.minEnyoVersion.split(splitRegExp);
		var myVerStr = (enyo.version && enyo.version.enyo) || '0.0.0-pre.0';
		var myVer = myVerStr.split(splitRegExp);
		var errMsg, mysv, expsv ;

		while (expVer.length) {
			mysv  =  myVer.shift();
			expsv = expVer.shift();

			// myVer and exptVer contain a string. Need to cast them
			// to Number before trying a numeric comparison. Otherwise
			// a lexicographic comparison is used.
			if (/\d/.test(mysv) ? Number(mysv) > Number(expsv) : mysv > expsv) {
				// found a greater version, no need to compare lower fields
				break;
			}
			if (/\d/.test(mysv) ? Number(mysv) < Number(expsv) : mysv < expsv) {
				errMsg = "Enyo used by your application is too old ("
					+ myVerStr + "). Console log may show duplicated kind error "
					+ "and Designer may not work as expected. You should use Enyo >= "
					+ this.minEnyoVersion+" Read <a href='https://github.com/enyojs/ares-project/blob/master/README.md' target='_blank'>README.md to update Enyo libraries</a>";
				enyo.warn(errMsg);
				/*
				 * TODO this message should go in an error/warning history as described in ENYO-2462
				 * Un-commenting the following "sendMessage" call will result in a annoying modal message
				 * popping up too often. For the time being, we just issue a warning in the console.
				 *
				 * this.sendMessage({op: "error", val: {msg: errMsg, title: "warning"}});
				 */
				break;
			}
		}

		this.adjustFrameworkFeatures();

		this.trace("designer iframe load done");
		this.sendMessage({op: "state", val: "loaded"});
	},
	initComponents: function() {
		this.createSelectHighlight();
		this.inherited(arguments);
	},
	createSelectHighlight: function() {
		var components = [{name: "selectHighlight", classes: "designer-frame-highlight designer-frame-select-highlight", showing: false}];
		// IE can only support pointer-events:none; for svg elements
		if (enyo.platform.ie) {
			// Using svg for IE only as it causes performance issues in Chrome
			components[0].tag = "svg";
			// Unable to retrive offset values for svg elements in IE, thus we're forced to create additional dom for resizeHandle calculations
			components.push({name: "selectHighlightCopy", classes: "designer-frame-highlight", style: "z-index:-1;", showing: false});
		}
		this.createComponents(components);
	},
	//* Any core features of the framework that need to be overridden/diesabled happens here
	adjustFrameworkFeatures: function() {
		// Allow overriding kind definitions
		enyo.kind.allowOverride = true;
		// Disable autoStart/autoRender features of enyo.Application
		if (enyo.Application) {
			enyo.Application.prototype.start = enyo.nop;
			enyo.Application.prototype.render = enyo.nop;
		}
		// Disable controller instancing
		enyo.Control.prototype.controllerFindAndInstance = enyo.nop;
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
					_this[e.type](e);
				}
				e.preventDispatch = true;
				return true;
			}
		);
	},
	//* Send message to Deimos via _this.$.communicator_
	sendMessage: function(inMessage) {
		this.trace(" msg ",inMessage);
		this.$.communicator.sendMessage(inMessage);
	},
	//* Receive message from Deimos
	receiveMessage: function(inSender, inEvent) {

		var msg = inEvent.message;
		this.trace(" msg ",msg);

		if (!msg || !msg.op) {
			enyo.warn("Deimos designerFrame received invalid message data:", msg);
			return;
		}

		switch (msg.op) {
		case "containerData":
			// reply with msg op state val ready
			this.setContainerData(msg.val);
			break;
		case "render":
			// async (call selectItem) reply with msg:
			// op rendered
			// op: error
			// op: error with reload Needed in case of big problem
			this.renderKind(msg.val, msg.filename, msg.op);
			break;
		case "initializeOptions":
			// reply with msg op state val initialized
			this.initializeAllKindsAresOptions(msg.options);
			break;
		case "select":
			// async, reply with op select val: bunch of code
			this.selectItem(msg.val, "selected");
			break;
		case "highlight":
			// no reply
			this.highlightDropTarget(this.getControlById(msg.val.aresId));
			break;
		case "unhighlight":
			// no reply
			this.unhighlightDropTargets(msg.val);
			break;
		case "modify":
			// async, calls selectItem reply with op select val: bunch of code
			this.modifyProperty(msg.val, msg.filename);
			break;
		case "codeUpdate":
			// do an eval on msg.val. Replies "updated" (maybe with error)
			this.codeUpdate(msg.val);
			break;
		case "cssUpdate":
			// no reply
			this.cssUpdate(msg.val);
			break;
		case "cleanUp":
			// no reply
			this.cleanUpKind();
			break;
		case "resize":
			// no reply
			this.resized();
			break;
		case "prerenderDrop":
			// no reply even though async code is involved to render animation
			this.foreignPrerenderDrop(msg.val);
			break;
		case "requestPositionValue":
			// immediately replies op: "returnPositionValue"
			this.requestPositionValue(msg.val);
			break;
		case "serializerOptions":
			// no reply
			this.$.serializer.setSerializerOptions(msg.val);
			break;
		case "dragStart":
			// no reply
			this.setDragType(msg.val);
			break;
		default:
			enyo.warn("Deimos designerFrame received unknown message op:", msg);
			break;
		}
	},
	//* On down, set _this.selection_
	down: function(e) {
		var dragTarget = this.getEventDragTarget(e.dispatchTarget);

		if (dragTarget && dragTarget.aresComponent) {
			this._selectItem(dragTarget, "select");
		}

		// Using encoded 1px x 1px transparent png
		var imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEwRDRFRUY1Rjk3NDExRTI5NTRFQ0U1RjAwMURENDczIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEwRDRFRUY2Rjk3NDExRTI5NTRFQ0U1RjAwMURENDczIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTBENEVFRjNGOTc0MTFFMjk1NEVDRTVGMDAxREQ0NzMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MTBENEVFRjRGOTc0MTFFMjk1NEVDRTVGMDAxREQ0NzMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4/IH2ZAAAAEElEQVR42mL4//8/A0CAAQAI/AL+26JNFgAAAABJRU5ErkJggg==";
		this.createDragImage(imageData);
	},
	up: function(e) {
		this.clearDragImage();
	},
	//* On drag start, set the event _dataTransfer_ property to contain a serialized copy of _this.selection_
	dragstart: function(e) {
		if (!e.dataTransfer) {
			this.resizing = this.getActiveResizingHandle(e);
			return false;
		}

		var dragData = {
			type: "ares/moveitem",
			item: enyo.json.codify.from(this.$.serializer.serializeComponent(this.selection, true))
		};

		// Set drag data
		e.dataTransfer.setData("text", enyo.json.codify.to(dragData));

		// Hide the drag image ghost on platforms where it exists
		if (e.dataTransfer.setDragImage) {
			e.dataTransfer.setDragImage(this.dragImage, 0, 0);
		}
        return true;
	},
	//* On drag over, enable HTML5 drag-and-drop if there is a valid drop target
	dragover: function(inEvent) {
		if (!inEvent.dataTransfer) {
			return false;
		}

		// Enable HTML5 drag-and-drop
		inEvent.preventDefault();

		// Update dragover highlighting
		this.dragoverHighlighting(inEvent);

		// Don't do holdover if item is being dragged in from the palette
		if (this.getDragType() === "ares/createitem") {
			return true;
		}

		// If dragging in an absolute positioning container, go straight to _holdOver()_
		if (this.absolutePositioningMode(this.getCurrentDropTarget())) {
			this.holdOver(inEvent);

			// If mouse actually moved, begin timer for holdover
		} else if (this.mouseMoved(inEvent)) {
			this.resetHoldoverTimeout();

			// If mouse hasn't moved and timer isn't yet set, set it
		} else if (!this.holdoverTimeout) {
			this.holdoverTimeout = setTimeout(enyo.bind(this, function() { this.holdOver(inEvent); }), 200);
		}

		// Remember mouse location for next dragover event
		this.saveMouseLocation(inEvent);

		return true;
	},
	drag: function(inEvent) {
		if (this.resizing) {
			this.resizeOnEvent(inEvent);
		}
	},
	dragenter: function(inEvent) {
		// Enable HTML5 drag-and-drop
		inEvent.preventDefault();
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
			if (this.resizing) {
				this.resizeComplete();
			}
			return true;
		}

		var dropData = enyo.json.codify.from(inEvent.dataTransfer.getData("text")),
			dropItem = dropData.item,
			dataType = dropData.type,
			dropTargetId,
			dropTarget = this.getEventDropTarget(inEvent.dispatchTarget),
			beforeId
		;

		switch (dataType) {
		case "ares/moveitem":
			dropTargetId = (dropTarget) ? dropTarget.aresId : this.selection.parent.aresId;
			beforeId = this.selection.addBefore ? this.selection.addBefore.aresId : null;
			this.sendMessage({op: "moveItem", val: {itemId: dropItem.aresId, targetId: dropTargetId, beforeId: beforeId, layoutData: this.getLayoutData(inEvent)}});
			break;

		case "ares/createitem":
			dropTargetId = this.getContainerItem() ? this.getContainerItem() : dropTarget;
			dropTargetId = (dropTargetId && dropTargetId.aresId) || null;
			beforeId = this.getBeforeItem() ? this.getBeforeItem().aresId : null;
			this.sendMessage({op: "createItem", val: {config: dropData.item.config, options: dropData.item.options, targetId: dropTargetId, beforeId: beforeId}});
			break;

		default:
			enyo.warn("Component view received unknown drop: ", dataType, dropData);
			break;
		}

		this.setContainerItem(null);
		this.setBeforeItem(null);
		this.setDragType(null);

		return true;
	},
	dragend: function() {
		this.setCurrentDropTarget(null);
		this.syncDropTargetHighlighting();
		this.unhighlightDropTargets();
		this.clearDragImage();
	},
	createDragImage: function(inImage) {
		this.dragImage = document.createElement("img");
		this.dragImage.src = inImage;
		return this.dragImage;
	},
	clearDragImage: function() {
		this.dragImage = null;
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
		if (this.getDragType() === "ares/createitem") {
			this.selection = null;
			this.hideSelectHighlight();
		}

		// If not a valid drop target, reset _this.currentDropTarget_
		if (!this.isValidDropTarget(dropTarget)) {
			this.setCurrentDropTarget(null);
			return false;
		}

		// If drop target has changed, update drop target highlighting
		if (!(this.currentDropTarget && this.currentDropTarget === dropTarget)) {
			this.setCurrentDropTarget(dropTarget);
		}
	},
	//* Save _inData_ as _this.containerData_ to use as a reference when creating drop targets.
	setContainerData: function(inData) {
		this.containerData = inData;
		this.sendMessage({op: "state", val: "ready"});
	},
	//* Render the specified kind
	renderKind: function(inKind, inFileName, cmd) {
		// on msg "render"
		var errMsg;

		try {
			var kindConstructor = enyo.constructorForKind(inKind.name);

			if (!kindConstructor) {
				errMsg = "No constructor exists for ";
				enyo.warn(errMsg, inKind.name);
				this.sendMessage({op: "error", val: {triggeredByOp: cmd, msg: errMsg + inKind.name}});
				return;
			} else if(!kindConstructor.prototype) {
				errMsg = "No prototype exists for ";
				enyo.warn(errMsg, inKind.name);
				this.sendMessage({op: "error", val: {triggeredByOp: cmd, msg: errMsg + inKind.name}});
				return;
			}

			/*
			 Stomp on existing _kindComponents_ to ensure that we render exactly what the user
			 has defined. If components came in as a string, convert to object first.
			 */
			kindConstructor.prototype.kindComponents = (typeof inKind.components === "string") ? enyo.json.codify.from(inKind.componentKinds) : inKind.componentKinds;

			// Clean up after previous kind
			if (this.parentInstance) {
				this.cleanUpPreviousKind(inKind.name);
			}

			// Proxy Repeater and List
			this.manageComponentsOptions(kindConstructor.prototype.kindComponents);
			// Save this kind's _kindComponents_ array
			this.aresComponents = this.flattenKindComponents(kindConstructor.prototype.kindComponents);
			this.checkXtorForAllKinds(this.aresComponents);

			// Enable drag/drop on all of _this.aresComponents_
			this.makeComponentsDragAndDrop(this.aresComponents);

			// Save reference to the parent instance currently rendered
			this.parentInstance = this.$.client.createComponent({kind: inKind.name});

			// Mimic top-level app fitting (as if this was rendered with renderInto or write)
			if (this.parentInstance.fit) {
				this.parentInstance.addClass("enyo-fit enyo-clip");
			}
			this.parentInstance.domStyles = {};
			this.parentInstance.domStylesChanged();
			this.parentInstance.render();

			// Notify Deimos that the kind rendered successfully
			//* Send update to Deimos with serialized copy of current kind component structure
			this.sendMessage({
				op: "rendered",
				triggeredByOp: cmd, // 'render'
				val: this.$.serializer.serialize(this.parentInstance, true),
				filename: inFileName
			});

			// Select a control if so requested
			if (inKind.selectId) {
				this.selectItem({aresId: inKind.selectId},"select");
			}
		} catch(error) {
			errMsg = "Unable to render kind '" + inKind.name + "':" + ( typeof error === 'object' ? error.message : error );
			var errStack = typeof error === 'object' ? error.stack : '' ;
			this.error(errMsg, errStack );
			this.sendMessage({op: "error", val: {msg: errMsg, triggeredByOp: cmd, requestReload: true, reloadNeeded: true, err: {stack: errStack}}});
		}
	},
	//* Rerender current selection
	rerenderKind: function(inFileName, cmd) {
		var copy = this.getSerializedCopyOfComponent(this.parentInstance).components;
		copy[0].componentKinds = copy;
		this.renderKind(copy[0], inFileName, cmd);
	},
	checkXtorForAllKinds: function(kinds) {
		enyo.forEach(kinds, function(kindDefinition) {
			var name = kindDefinition.kind;
			if ( ! enyo.constructorForKind(name)) {
				var errMsg = 'No constructor found for kind "' + name + "'";
				this.log(errMsg);
				this.sendMessage({op: "error", val: {msg: errMsg}});
			}
		}, this);
	},
	/**
	 * @private
	 *
	 * Response to message sent from Deimos. Enhance the whole application code with aresOptions
	 * and send back a state message.
	 */
	initializeAllKindsAresOptions: function(inOptions) {
		// on msg "initializeOptions"
		// genuine enyo.kind's master function extension
		var self = this;
		this.trace("starting user app initialization within designer iframe");
		enyo.genuineEnyoKind = enyo.kind;
		enyo.kind =  function(inProps) {
			self.addKindAresOptions(inProps.components, inOptions);

			enyo.genuineEnyoKind(inProps);
		};
		enyo.mixin(enyo.kind, enyo.genuineEnyoKind);

		// warning: user code error will trigger this.raiseLoadError
		// through window.onerror handler
		// another warning: enyo.load is asynchronous. try/catch is useless
		enyo.load("$enyo/../source/package.js", enyo.bind(this, function() {
			this.trace("user app initialization done within designer iframe");
			this.sendMessage({op: "state", val: "initialized"});
		}));

	},
	addKindAresOptions: function(inComponents, inOptions) {
		if (!inComponents) {
			return;
		}

		for(var i = 0; i < inComponents.length; i++) {
			this.addAresOptionsToComponent(inComponents[i], inOptions);
			if (inComponents[i].components) {
				this.addKindAresOptions(inComponents[i].components, inOptions);
			}
		}
	},
	addAresOptionsToComponent: function(inComponent, inOptions) {
		// FIXME: ENYO-3433 specific enyo.Repeater create method must be generic one accordingly to kinds that require options
		function aresOptionCreate() {
			if (this.__create) {
				this.__create();
			}

			// for enyo.Repeater (currently only kind in defaultkindOptions set)
			if (this.__aresOptions.isRepeater === true) {
				this.onSetupItem = "aresUnImplemetedFunction";
				this.set("count", 1);
			}
		}

		for(var o in inOptions) {
			if (o === inComponent.kind) {
				var options = inOptions[o];

				if (options) {
					inComponent.__aresOptions = options;

					var kindConstructor= enyo.constructorForKind(inComponent.kind);

					if (kindConstructor.prototype.__create) {
						this.trace(inComponent.kind, "already has __create");
					} else {
						kindConstructor.prototype.__create = kindConstructor.prototype.create;
						kindConstructor.prototype.create = aresOptionCreate;
					}
				}
			}
		}
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
	 Response to message sent from Deimos. Highlight the specified control
	 and send a message with a serialized copy of the control.
	 */
	selectItem: function(inItem, reply) {

		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.aresId === inItem.aresId) {
				// this method is typically called right after a
				// render.  The algorithm used in there will query the
				// DOM to get the boundary and coordinates of the
				// selected kind. This query must be issued only when
				// the rendering phase is finished, lest bogus data
				// are used to draw the highlight rectangle. The call
				// to timeout ensures that _selectItem is called once
				// the rendering phase is done.
				setTimeout(this._selectItem.bind(this, c, reply), 0);
				return;
			}
		}
	},
	//* Update _this.selection_ property value based on change in Inspector
	modifyProperty: function(inData, inFileName) {
		if (typeof inData.value === "undefined") {
			this.removeProperty(inData.property);
		} else {
			this.updateProperty(inData.property, inData.value);
		}
		this.rerenderKind(inFileName, "modify");
		this.selectItem(this.selection, "select");
	},
	removeProperty: function(inProperty) {
		delete this.selection[inProperty];
	},
	updateProperty: function(inProperty, inValue) {
		var options = this.selection.__aresOptions;
		if (options && options.isRepeater && (inProperty === "onSetupItem" || inProperty === "count")) {
			// DO NOT APPLY changes to the properties mentioned above
			// TODO: could be managed later on thru config in .design files if more than one kind need special processings.
			this.trace("Skipping modification of \"", inProperty, "\"");
		} else {
			this.selection[inProperty] = inValue;
		}
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
	manageComponentsOptions: function(inComponents) {
		var c;
		for (var i=0;(c = inComponents[i]);i++) {
			this.manageComponentOptions(c);
			if (c.components) {
				this.manageComponentsOptions(c.components);
			}
		}
	},
	manageComponentOptions: function(inComponent) {
		if (inComponent.__aresOptions) {
			var options = inComponent.__aresOptions;
			if (options.isRepeater === true) {
				/*
				 We are handling a Repeater or a List.
				 Force "count" to 1 and invalidate "onSetupItem" to
				 manage them correctly in the Designer
				 */
				this.trace("Manage repeater ", inComponent.kind, inComponent);
				inComponent.count = 1;
				inComponent.onSetupItem = "aresUnImplemetedFunction";
			}
		}
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
			var b = this.selection.hasNode().getBoundingClientRect();
			this.$.selectHighlight.setBounds(b);
			this.$.selectHighlight.show();

			if (this.$.selectHighlightCopy) {
				this.$.selectHighlightCopy.setBounds(b);
				this.$.selectHighlightCopy.show();
			}

			// Resize handle rendering
			this.hideAllResizeHandles();

			if (this.absolutePositioningMode(this.selection.parent)) {
				this.showAllResizeHandles();
			} else {
				this.showBottomRightResizeHandle();
			}
		}
	},
	hideSelectHighlight: function() {
		this.$.selectHighlight.hide();
		if (this.$.selectHighlightCopy) {
			this.$.selectHighlightCopy.hide();
		}
		this.hideAllResizeHandles();
	},
	syncDropTargetHighlighting: function() {
		var dropTarget = this.currentDropTarget ? this.$.serializer.serializeComponent(this.currentDropTarget, true) : null;
		// to move the inspector spotlight during drag
		this.sendMessage({op: "syncDropTargetHighlighting", val: dropTarget});
	},
	//* Set _inItem_ to _this.selected_ and notify Deimos
	_selectItem: function(inItem, reply) {
		this.selection = inItem;
		this.highlightSelection();
		this.sendMessage({op: reply, val: this.$.serializer.serializeComponent(this.selection, true)});
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

	/**
	 * Eval code passed in by designer
	 * @param {String} inCode
	 */
	codeUpdate: function(inCode) {
		var msg;
		try {
			/* jshint evil: true */
			eval(inCode); // TODO: ENYO-2074, replace eval.
			/* jshint evil: false */
			msg = {op: "updated"};
		}
		catch (e) {
			msg = {
				op: "error",
				triggeredByOp: "codeUpdate",
				requestReload: true,
				msg: "caught error: " + e
			};
		}
		this.sendMessage(msg);
	},

	//* Update CSS by replacing the link/style tag in the head with an updated style tag
	cssUpdate: function(inData) {
		var next = (function(err) {
			var msg =  {op: "updated"};
			if (err) {
				msg = {
					op: "error",
					triggeredByOp: "cssUpdate",
					msg: err
				};
			}
			this.sendMessage(msg);
		}).bind(this);

		this._cssUpdate(inData, next);
	},

	_cssUpdate: function(inData, next) {
		if(!inData.filename || !inData.code) {
			enyo.warn("Invalid data sent for CSS update:", inData);
			next ("Invalid data sent for CSS update. Check console for more information");
			return;
		}

		var filename = inData.filename,
			code = inData.code,
			head = document.getElementsByTagName("head")[0],
			links = head.getElementsByTagName("link"),
			styles = head.getElementsByTagName("style"),
			el,
			i
		;

		// Look through link tags for a linked stylesheet with a filename matching _filename_
		for(i = 0; (el = links[i]); i++) {
			if(el.getAttribute("rel") === "stylesheet" && el.getAttribute("type") === "text/css" && el.getAttribute("href") === filename) {
				this.updateStyle(filename, code, el);
				next();
				return;
			}
		}

		// Look through style tags for a tag with a data-href property matching _filename_
		for(i=0;(el = styles[i]);i++) {
			if(el.getAttribute("data-href") === filename) {
				this.updateStyle(filename, code, el);
				next();
				return;
			}
		}
		this.trace("Did not find anything to call updateStyle on");
		next();
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
	holdOver: function(inEvent) {
		var container = this.getCurrentDropTarget();

		if (!container) {
			return;
		}

		if (this.absolutePositioningMode(container)) {
			this.absolutePositioningHoldover(inEvent, container);
		} else {
			this.staticPositioningHoldover(inEvent, container);
		}
	},
	absolutePositioningHoldover: function(inEvent, inContainer) {
		this.setContainerItem(inContainer);
		this.setBeforeItem(null);
		this.absolutePrerenderDrop(inEvent);
	},
	absolutePrerenderDrop: function(inEvent) {
		var x = this.getAbsoluteXPosition(inEvent),
			y = this.getAbsoluteYPosition(inEvent)
		;

		this.moveSelectionToAbsolutePosition(x, y);
	},
	// Move selection to new position
	moveSelectionToAbsolutePosition: function(inX, inY) {
		var container = this.getContainerItem(),
			clone = this.cloneControl(this.selection, true) //this.createSelectionGhost(this.selection)
		;

		this.hideSelectHighlight();

		this.selection.destroy();
		this.selection = container.createComponent(clone).render();
		this.selection.applyStyle("position", "absolute");
		this.selection.applyStyle("pointer-events", "none");
		this.addVerticalPositioning(this.selection, inY);
		this.addHorizontalPositioning(this.selection, inX);
	},
	//* Add appropriate vertical positioning to _inControl_ based on _inY_
	addVerticalPositioning: function(inControl, inY) {
		var container = this.getContainerItem(),
			containerBounds = this.getRelativeBounds(container),
			controlBounds = this.getRelativeBounds(inControl),
			styleProps = {}
		;

		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(inControl.style), styleProps);

		if (styleProps.top || (!styleProps.top && !styleProps.bottom)) {
			inControl.applyStyle("top", inY + "px");
		}
		if (styleProps.bottom) {
			inControl.applyStyle("bottom", (containerBounds.height - inY - controlBounds.height) + "px");
		}
	},
	//* Add appropriate horizontal positioning to _inControl_ based on _inX_
	addHorizontalPositioning: function(inControl, inX) {
		var container = this.getContainerItem(),
			containerBounds = this.getRelativeBounds(container),
			controlBounds = this.getRelativeBounds(inControl),
			styleProps = {}
		;

		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(inControl.style), styleProps);

		if (styleProps.left || (!styleProps.left && !styleProps.right)) {
			inControl.applyStyle("left", inX + "px");
		}
		if (styleProps.right) {
			inControl.applyStyle("right", (containerBounds.width - inX - controlBounds.width) + "px");
		}
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		return inStr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
	staticPositioningHoldover: function(inEvent, inContainer) {
		var x = inEvent.clientX,
			y = inEvent.clientY,
			onEdge = this.checkDragOverBoundary(inContainer, x, y),
			beforeItem;

		if (onEdge < 0) {
			beforeItem = inContainer;
			inContainer = inContainer.parent;
		} else if (onEdge > 0) {
			beforeItem = this.findAfterItem(inContainer.parent, inContainer, x, y);
			inContainer = inContainer.parent;
		} else {
			beforeItem = (inContainer.children.length > 0) ? this.findBeforeItem(inContainer, x, y) : null;
			inContainer = inContainer;
		}

		this.setContainerItem(inContainer);
		this.setBeforeItem(beforeItem);
		this.staticPrerenderDrop();
	},
	//* Handle drop that has been trigged from outside of the designerFrame
	foreignPrerenderDrop: function(inData) {
		var containerItem = this.getControlById(inData.targetId),
			beforeItem    = inData.beforeId ? this.getControlById(inData.beforeId) : null
		;

		this.setContainerItem(containerItem);
		this.setBeforeItem(beforeItem);

		// Do static prerender drop if not an AbsolutePositioningLayout container
		if (!this.absolutePositioningMode(containerItem)) {
			this.staticPrerenderDrop();
		}
	},
	staticPrerenderDrop: function() {
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
		this.$.flightArea.applyStyle("display", "none");
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
			clone       = this.cloneControl(this.selection, true); //this.createSelectionGhost(this.selection);

		// If the selection should be moved before another item, use the _addBefore_ property
		if (before) {
			clone = enyo.mixin(clone, {beforeId: beforeId, addBefore: before});
		}

		// If the selection has absolute positioning applied, remove it
		if (clone.style) {
			clone.style = this.removeAbsolutePositioningStyle(clone);
		}

		this.selection.destroy();
		this.selection = container.createComponent(clone).render();
	},
	removeAbsolutePositioningStyle: function(inControl) {
		var currentStyle = inControl.style || "",
			styleProps = currentStyle.split(";"),
			updatedProps = [],
			prop,
			i;

		for (i = 0; i < styleProps.length; i++) {
			prop = styleProps[i].split(":");
			if (prop[0].match(/position/) || prop[0].match(/top/) || prop[0].match(/left/)) {
				continue;
			}
			updatedProps.push(styleProps[i]);
		}

		for (i = 0, currentStyle = ""; i < updatedProps.length; i++) {
			currentStyle += updatedProps[i];
		}

		return currentStyle;
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
	//* Render updated copy of the parentInstance into _cloneArea_
	renderUpdatedAppClone: function() {
		this.$.cloneArea.destroyClientControls();
		this.$.cloneArea.applyStyle("display", "block");
		var appClone = this.$.cloneArea.createComponent(this.cloneControl(this.parentInstance));

		// Mimic top-level app fitting (as if this was rendered with renderInto or write)
		if (this.parentInstance.fit) {
			appClone.addClass("enyo-fit enyo-clip");
		}

		var containerId = (this.getContainerItem()) ? this.getContainerItem().aresId : null,
			container   = this.getControlById(containerId, this.$.cloneArea),
			beforeId    = (this.getBeforeItem()) ? this.getBeforeItem().aresId : null,
			before      = (beforeId) ? this.getControlById(beforeId, this.$.cloneArea) : null,
			selection   = this.getControlById(this.selection.aresId, this.$.cloneArea),
			clone       = this.cloneControl(this.selection, true)
		;

		if (before) {
			clone = enyo.mixin(clone, {beforeId: beforeId, addBefore: before});
		}

		// If the selection has absolute positioning applied, remove it
		if (clone.style) {
			clone.style = this.removeAbsolutePositioningStyle(clone);
		}

		container.createComponent(clone);

		if (selection) {
			selection.destroy();
		}

		this.$.cloneArea.render();
	},
	hideUpdatedAppClone: function() {
		this.$.cloneArea.destroyClientControls();
		this.$.cloneArea.applyStyle("display", "none");
	},
	//* TODO - This createSelectionGhost is WIP
	createSelectionGhost: function (inItem) {
		var computedStyle = enyo.dom.getComputedStyle(inItem.hasNode()),
			borderWidth = 1,
			style;

		if (!computedStyle) {
			enyo.warn("Attempted to clone item with no node: ", inItem);
			return null;
		}

		this.log("h: ", parseInt(computedStyle.height, 10), "w: ", parseInt(computedStyle.width, 10), "p: ", parseInt(computedStyle.padding, 10), "m: ", parseInt(computedStyle.margin,10));

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
	cloneControl: function(inSelection, inCloneChildren) {
		var clone = {
			layoutKind: inSelection.layoutKind,
			content:    inSelection.content,
			aresId:     inSelection.aresId,
			classes:    inSelection.classes,
			style:      inSelection.style
		};

		// if inSelection.kind is undefined, let enyo apply the defaultKind
		if (inSelection.kind) {
			clone.kind = inSelection.kind;
		}

		if (inCloneChildren) {
			clone.components = this.cloneChildComponents(inSelection.components);
		}

		return clone;
	},
	cloneChildComponents: function(inComponents) {
		var childComponents = [];

		if (!inComponents || inComponents.length === 0) {
			return childComponents;
		}

		for (var i = 0, comp; (comp = inComponents[i]); i++) {
			childComponents.push(this.cloneControl(comp, true));
		}

		return childComponents;
	},
	getControlPositions: function(inComponents) {
		var controls = this.flattenChildren(inComponents),
			positions = [];

		for(var i=0;i<controls.length;i++) {
			if (controls[i].aresId) {
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
	},
	absolutePositioningMode: function(inControl) {
		return inControl && inControl.layoutKind === "AbsolutePositioningLayout";
	},
	getLayoutData: function(inEvent) {
		var layoutKind = this.selection.parent ? this.selection.parent.layoutKind : null;

		switch (layoutKind) {
		case "AbsolutePositioningLayout":
			var bounds = this.getRelativeBounds(this.selection);

			return {
				layoutKind: layoutKind,
				bounds: bounds
			};
		default:
			return null;
		}
	},
	getAbsoluteXPosition: function(inEvent) {
		return this.getAbsolutePosition(inEvent, "x");
	},
	getAbsoluteYPosition: function(inEvent) {
		return this.getAbsolutePosition(inEvent, "y");
	},
	getAbsolutePosition: function(inEvent, inAxis) {
		var containerBounds = this.getAbsoluteBounds(this.getContainerItem());
		return (inAxis === "x") ? inEvent.clientX - containerBounds.left : inEvent.clientY - containerBounds.top;
	},
	getRelativeBounds: function(inControl) {
		if (!inControl) {
			return {top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0};
		}

		var bounds = inControl.getBounds();
		var absoluteBounds = this.getAbsoluteBounds(inControl);
		var parentBounds = this.getAbsoluteBounds(inControl.parent);
		var node = inControl.hasNode();

		bounds.right = parentBounds.width - bounds.left - absoluteBounds.width;
		bounds.bottom = parentBounds.height - bounds.top - absoluteBounds.height;

		if(typeof inControl.parent.scrollNode == "undefined"){
			if(bounds.width + bounds.left >= node.offsetParent.clientWidth){
				bounds.width = node.offsetParent.clientWidth - bounds.left;
			}

			if(bounds.height + bounds.top >= node.offsetParent.clientHeight){
				bounds.height = node.offsetParent.clientHeight - bounds.top;
			}
		}

		return bounds;
	},
	getAbsoluteBounds: function(inControl) {
		var left = 0,
			top = 0,
			match = null,
			node = inControl.hasNode() || inControl.scrollNode,
			width = node.offsetWidth,
			height = node.offsetHeight,
			transformProp = enyo.dom.getStyleTransformProp(),
			xRegEx = /translateX\((-?\d+)px\)/i,
			yRegEx = /translateY\((-?\d+)px\)/i;

		if (node.offsetParent) {
			do {
				// Fix for FF (GF-2036), offsetParent is working differently between FF and chrome
				if (enyo.platform.firefox) {
					left += node.offsetLeft;
					top  += node.offsetTop;
				} else {
					left += node.offsetLeft - (node.offsetParent ? node.offsetParent.scrollLeft : 0);
					top  += node.offsetTop  - (node.offsetParent ? node.offsetParent.scrollTop  : 0);
				}
				if (transformProp) {
					match = node.style[transformProp].match(xRegEx);
					if (match && typeof match[1] != 'undefined' && match[1]) {
						left += parseInt(match[1], 10);
					}
					match = node.style[transformProp].match(yRegEx);
					if (match && typeof match[1] != 'undefined' && match[1]) {
						top += parseInt(match[1], 10);
					}
				}
			} while ((node = node.offsetParent));
		}
		return {
			top		: top,
			left	: left,
			bottom	: document.body.offsetHeight - top  - height,
			right	: document.body.offsetWidth  - left - width,
			height	: height,
			width	: width
		};
	},

	//****** RESIZING CODE ******//

	getActiveResizingHandle: function(inEvent) {
		if (inEvent.dispatchTarget.sides) {
			this.$resizeHandle = inEvent.dispatchTarget;
			this.intialDragBounds = this.getRelativeBounds(this.selection);
			this.selectionDragAnchors = this.getDragAnchors(this.selection, this.$resizeHandle);
			return true;
		}

		return false;
	},
	resizeOnEvent: function(inEvent) {
		this.resizeWidth(inEvent.dx);
		this.resizeHeight(inEvent.dy);
		this.renderSelectHighlight();
	},
	resizeWidth: function(inDelta) {
		if (this.selectionDragAnchors) {
			if (this.selectionDragAnchors.left) {
				this.selection.applyStyle("left", (this.intialDragBounds.left + inDelta) + "px");
			} else if (this.selectionDragAnchors.right) {
				this.selection.applyStyle("right", (this.intialDragBounds.right - inDelta) + "px");
			}
			if (this.selectionDragAnchors.width) {
				this.selection.applyStyle("width", (
					(this.$resizeHandle.sides.left) ? this.intialDragBounds.width - inDelta : this.intialDragBounds.width + inDelta
				) + "px");
			}
		}
	},
	resizeHeight: function(inDelta) {
		if (this.selectionDragAnchors) {
			if (this.selectionDragAnchors.top) {
				this.selection.applyStyle("top", (this.intialDragBounds.top + inDelta) + "px");
			} else if (this.selectionDragAnchors.bottom) {
				this.selection.applyStyle("bottom", (this.intialDragBounds.bottom - inDelta) + "px");
			}
			if (this.selectionDragAnchors.height) {
				this.selection.applyStyle("height", (
					(this.$resizeHandle.sides.top) ? this.intialDragBounds.height - inDelta : this.intialDragBounds.height + inDelta
				) + "px");
			}
		}
	},
	getDragAnchors: function(inResizeComponent, inHandle) {
		var styleProps = {},
			anchors = {}
		;

		// Convert css string to hash
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(inResizeComponent.style), styleProps);

		// Setup anchors hash
		anchors.top = (styleProps.top !== undefined && this.trimWhitespace(styleProps.top) !== "");
		anchors.right = (styleProps.right !== undefined && this.trimWhitespace(styleProps.right) !== "");
		anchors.bottom = (styleProps.bottom !== undefined && this.trimWhitespace(styleProps.bottom) !== "");
		anchors.left = (styleProps.left !== undefined && this.trimWhitespace(styleProps.left) !== "");

		// Select top/bottom side to be adjusted based on the corner the user is dragging
		if (inHandle.sides.top) {
			if (anchors.top) {
				if (anchors.bottom) {
					anchors.height = false;
					anchors.bottom = false;
				} else {
					anchors.height = true;
				}
			} else {
				anchors.height = true;
				anchors.bottom = false;
			}
		} else if (inHandle.sides.bottom) {
			if (anchors.bottom) {
				if (anchors.top) {
					anchors.height = false;
					anchors.top = false;
				} else {
					anchors.height = true;
				}
			} else {
				anchors.height = true;
				anchors.top = false;
			}
		}

		// Select left/right side to be adjusted based on the corner the user is dragging
		if (inHandle.sides.left) {
			if (anchors.left) {
				if (anchors.right) {
					anchors.width = false;
					anchors.right = false;
				} else {
					anchors.width = true;
				}
			} else {
				anchors.width = true;
				anchors.right = false;
			}
		} else if (inHandle.sides.right) {
			if (anchors.right) {
				if (anchors.left) {
					anchors.width = false;
					anchors.left = false;
				} else {
					anchors.width = true;
				}
			} else {
				anchors.width = true;
				anchors.left = false;
			}
		}

		return anchors;
	},
	showAllResizeHandles: function() {
		var bounds = this.getRelativeBounds(this.$.selectHighlightCopy || this.$.selectHighlight);
		this.showTopLeftResizeHandle(bounds);
		this.showTopRightResizeHandle(bounds);
		this.showBottomRightResizeHandle(bounds);
		this.showBottomLeftResizeHandle(bounds);
	},
	showTopLeftResizeHandle: function(inBounds) {
		inBounds = inBounds || this.getRelativeBounds(this.$.selectHighlightCopy || this.$.selectHighlight);
		this.$.topLeftResizeHandle.applyStyle("top", inBounds.top + "px");
		this.$.topLeftResizeHandle.applyStyle("left", inBounds.left + "px");
		this.$.topLeftResizeHandle.show();
	},
	showTopRightResizeHandle: function(inBounds) {
		inBounds = inBounds || this.getRelativeBounds(this.$.selectHighlightCopy || this.$.selectHighlight);
		this.$.topRightResizeHandle.applyStyle("top", inBounds.top + "px");
		this.$.topRightResizeHandle.applyStyle("right", inBounds.right + "px");
		this.$.topRightResizeHandle.show();
	},
	showBottomRightResizeHandle: function(inBounds) {
		inBounds = inBounds || this.getRelativeBounds(this.$.selectHighlightCopy || this.$.selectHighlight);
		this.$.bottomRightResizeHandle.applyStyle("bottom", inBounds.bottom + "px");
		this.$.bottomRightResizeHandle.applyStyle("right", inBounds.right + "px");
		this.$.bottomRightResizeHandle.show();
	},
	showBottomLeftResizeHandle: function(inBounds) {
		inBounds = inBounds || this.getRelativeBounds(this.$.selectHighlightCopy || this.$.selectHighlight);
		this.$.bottomLeftResizeHandle.applyStyle("bottom", inBounds.bottom + "px");
		this.$.bottomLeftResizeHandle.applyStyle("left", inBounds.left + "px");
		this.$.bottomLeftResizeHandle.show();
	},
	hideAllResizeHandles: function() {
		this.$.topLeftResizeHandle.hide();
		this.$.topRightResizeHandle.hide();
		this.$.bottomLeftResizeHandle.hide();
		this.$.bottomRightResizeHandle.hide();
	},
	resizeComplete: function() {
		this.sendMessage({op: "resize", val: {itemId: this.selection.aresId, sizeData: this.getResizeCompleteData()}});
	},
	getResizeCompleteData: function() {
		var bounds = this.getRelativeBounds(this.selection);
		var sizeData = {};

		if (this.selectionDragAnchors.top) {
			sizeData.top = bounds.top + "px";
		}
		if (this.selectionDragAnchors.right) {
			sizeData.right = bounds.right + "px";
		}
		if (this.selectionDragAnchors.bottom) {
			sizeData.bottom = bounds.bottom + "px";
		}
		if (this.selectionDragAnchors.left) {
			sizeData.left = bounds.left + "px";
		}
		if (this.selectionDragAnchors.height) {
			sizeData.height = bounds.height + "px";
		}
		if (this.selectionDragAnchors.width) {
			sizeData.width = bounds.width + "px";
		}

		return sizeData;
	},
	//* Return value of prop on _inSender_
	requestPositionValue: function(inProp) {
		this.sendMessage({op: "returnPositionValue", val: {prop: inProp, value: this.getRelativeBounds(this.selection)[inProp]}});
	}
});
