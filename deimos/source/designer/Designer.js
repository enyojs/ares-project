/*global ProjectKindsModel, ares, enyo, ComponentsRegistry */

enyo.kind({
	name: "Designer",
	published: {
		designerFrameReady: false,
		height: null,
		width: null
	},
	events: {
		onSelect: "",
		onSelected: "",
		onCreateItem: "",
		onMoveItem: "",
		onSyncDropTargetHighlighting: "",
		onReloadComplete: "",
		onResizeItem: "",
		onError: "",
		onReturnPositionValue: ""
	},
	components: [
		{name: "client", tag: "iframe", classes: "ares-designer-frame-client"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "designerFrame.html",
	projectSource: null,
	selection: null,
	reloadNeeded: false,
	scale: 1,
	reloading: false,
	debug: false,
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		this.$.communicator.setRemote(this.$.client.hasNode().contentWindow);
	},
	heightChanged: function() {
		this.$.client.applyStyle("height", this.getHeight()+"px");
		this.resizeClient();
		this.repositionClient();
	},
	widthChanged: function() {
		this.$.client.applyStyle("width", this.getWidth()+"px");
		this.resizeClient();
		this.repositionClient();
	},
	zoom: function(inScale) {
		this.scale = (inScale >= 0) ? Math.max(inScale / 100, 0.2) : 1;
		enyo.dom.transformValue(this.$.client, "scale", this.scale);
		this.$.client.resized();
		this.repositionClient();
	},
	repositionClient: function() {
		var height = this.getHeight(),
			width = this.getWidth(),
			scaledHeight = height * this.scale,
			scaledWidth =  width  * this.scale,
			y = -1*(height - scaledHeight)/2,
			x = -1*(width  - scaledWidth)/2;
		
		this.$.client.addStyles("top: " + y + "px; left: " + x + "px");
	},
	
	updateSourcePending: [],
	/**
	 *
	 * @param {Ares.Model.Project} inSource is a backbone object defined in WorkspaceData.js
	 * @param {Function} next
	 * @returns {}
	 */
	updateSource: function(inSource,next) {
		if (this.updateSourceCallback) {
			this.log("updateSource called while previous "
							+ "updateSourceCallback is still pending ");
			this.updateSourcePending.push([inSource,next]);
			return ;
		}
		var serviceConfig = inSource.getService().config;
		this.setDesignerFrameReady(false);
		this.projectSource = inSource;
		this.projectPath = serviceConfig.origin + serviceConfig.pathname + "/file";
		var iframeUrl = this.projectSource.getProjectUrl() + "/" + this.baseSource + "?overlay=designer";
		this.trace("Setting designerFrame url: ", iframeUrl);
		this.$.client.hasNode().src = iframeUrl;
		// next callback is run once a "ready" message is received from designerFrame
		this.updateSourceCallback = next;
	},
	reload: function() {
		this.reloading = true;
		this.updateSource(this.projectSource);
	},
	
	//* Send message via communicator
	sendMessage: function(inMessage) {
		this.trace("Op: ", inMessage.op, inMessage);
		this.$.communicator.sendMessage(inMessage);
	},
	//* Respond to message from communicator
	receiveMessage: function(inSender, inEvent) {
		
		var msg = inEvent.message;
		var deimos = this.owner;
		var cbData;

		this.trace("Op: ", msg.op, msg);

		if(!msg || !msg.op) {
			enyo.warn("Deimos designer received invalid message data:", msg);
			return;
		}
		
		// designerFrame is initialized and ready to do work.
		if(msg.op === "state" && msg.val === "initialized") {
			this.sendDesignerFrameContainerData();
		// designerFrame received container data
		} else if(msg.op === "state" && msg.val === "ready") {
			this.setDesignerFrameReady(true);
			if(this.reloading) {
				this.doReloadComplete();
				this.reloading = false;
			}
			// call back *once* the function passed to updateSource
			if (this.updateSourceCallback) {
				this.trace("calling updateSourceCallback");
				this.updateSourceCallback();
				this.updateSourceCallback = null;
				// FIXME a real state machine is needd here
				if (this.updateSourcePending.length) {
					this.log("resuming delayed update source");
					cbData = this.updateSourcePending.shift() ;
					this.updateSource(cbData[0], cbData[1]);
				}
			}
		// Loaded event sent from designerFrame and awaiting aresOptions.
		} else if(msg.op === "state" && msg.val === "loaded") {
			this.designerFrameLoaded();
		// The current kind was successfully rendered in the iframe
		} else if(msg.op === "rendered") {
			this.updateKind(msg);
		// Select event sent from here was completed successfully. Set _this.selection_.
		} else if(msg.op === "selected") {
			this.selection = enyo.json.codify.from(msg.val);
			this.doSelected({component: this.selection});
		// New select event triggered in designerFrame. Set _this.selection_ and bubble.
		} else if(msg.op === "select") {
			this.selection = enyo.json.codify.from(msg.val);
			this.doSelect({component: this.selection});
		// Highlight drop target to minic what's happening in designerFrame
		} else if(msg.op === "syncDropTargetHighlighting") {
			this.doSyncDropTargetHighlighting({component: enyo.json.codify.from(msg.val)});
		// New component dropped in designerFrame
		} else if(msg.op === "createItem") {
			this.doCreateItem(msg.val);
		// Existing component dropped in designerFrame
		} else if(msg.op === "moveItem") {
			this.doMoveItem(msg.val);
		} else if (msg.op === "reloadNeeded") {
			this.reloadNeeded = true;
		} else if(msg.op === "error") {
			if (( ! msg.val.hasOwnProperty('popup')) || msg.val.popup === true) {
				if ( msg.val.triggeredByOp === 'render' && this.renderCallback ) {
					this.log("dropping renderCallback after error ", msg.val.msg);
					this.renderCallback = null;
				}
				if (msg.val.requestReload === true) {
					msg.val.callback = deimos.closeDesigner.bind(deimos);
					msg.val.action = "Switching back to code editor";
				}
				this.doError(msg.val);
			} else {
				// TODO: We should store the error into a kind of rotating error log - ENYO-2462
			}
		// Existing component resized
		} else if(msg.op === "resize") {
			this.doResizeItem(msg.val);
		// Returning requested position value
		} else if(msg.op === "returnPositionValue") {
			this.doReturnPositionValue(msg.val);
		// Default case
		} else {
			enyo.warn("Deimos designer received unknown message op:", msg);
		}
	},
	//* Pass _isContainer_ info down to designerFrame
	sendDesignerFrameContainerData: function() {
		this.sendMessage({op: "containerData", val: ProjectKindsModel.getFlattenedContainerInfo()});
	},

	//* Tell designerFrame to render the current kind
	renderKind: function(fileName, theKind, inSelectId,next) {
		this.trace("reloadNeeded", this.reloadNeeded);
		if (this.reloadNeeded) {
			this.reloadNeeded = false;
			// trigger a complete reload of designerFrame
			this.reload();
			return;
		}

		if(!this.getDesignerFrameReady()) {
			// frame is still being reloaded.
			return;
		}
		
		if (this.renderCallback) {
			// a rendering is on-going
			return;
		}
		this.currentFileName = fileName;
		this.renderCallback = next ;

		var components = [theKind];
		// FIXME: ENYO-3181: synchronize rendering for the right rendered file
		this.sendMessage({
			op: "render",
			filename: fileName,
			val: {
				name: theKind.name,
				components: enyo.json.codify.to(theKind.components),
				componentKinds: enyo.json.codify.to(components),
				selectId: inSelectId
			}
		});
	},
	select: function(inControl) {
		this.sendMessage({op: "select", val: inControl});
	},
	highlightDropTarget: function(inControl) {
		this.sendMessage({op: "highlight", val: inControl});
	},
	unHighlightDropTargets: function() {
		this.sendMessage({op: "unhighlight"});
	},
	//* Property was modified in Inspector, update designerFrame.
	modifyProperty: function(inProperty, inValue) {
		// FIXME: ENYO-3181: synchronize rendering for the right rendered file
		this.sendMessage({op: "modify", filename: this.currentFileName, val: {property: inProperty, value: inValue}});
	},
	//* Send message to Deimos with new kind/components from designerFrame
	updateKind: function(msg) {
		var deimos = ComponentsRegistry.getComponent("deimos");

		// need to check if the rendered was done for the current file
		if (msg.filename === this.currentFileName) {
			deimos.buildComponentView(msg);
			deimos.updateCodeInEditor(msg.filename); // based on new Component view

			// updateKind may be called by other op than 'render'
			if (this.renderCallback && msg.triggeredByOp === 'render') {
				this.renderCallback() ;
				this.renderCallback = null;
			}
		}
		else {
			this.log("dropped rendered message for stale file ",msg.filename);
			if (this.renderCallback && msg.triggeredByOp === 'render') {
				// other cleanup may be needed...
				this.renderCallback = null;
			}
		}
	},
	//* Initialize the designerFrame depending on aresOptions
	designerFrameLoaded: function() {
		// FIXME: ENYO-3433 : options are hard-coded with
		// defaultKindOptions that are currently known. the whole/real
		// set must be determined indeed.
		this.sendMessage({op: "initializeOptions", options: ProjectKindsModel.get("defaultKindOptions")});
	},
	//* Clean up the designerFrame before closing designer
	cleanUp: function() {
		this.sendMessage({op: "cleanUp"});
	},

	/**
	 * Pass inCode down to the designerFrame (to avoid needing to reload the iFrame)
	 * @param {String} projectName
	 * @param {String} filename
	 * @param {String} inCode
	 */
	syncFile: function(projectName, filename, inCode) {
		// check if the file is indeed part of the current project
		if (projectName === this.projectSource.getName() ){
			if(filename.slice(-4) === ".css") {
				// Sync the CSS in inCode with the designerFrame (to avoid needing to reload the iFrame)
				this.sendMessage({op: "cssUpdate", val: {filename: this.projectPath + filename, code: inCode}});
			} else if(filename.slice(-3) === ".js") {
				this.sendMessage({op: "codeUpdate", val: inCode});
			}
		}
		else {
			this.warn("syncFile aborted: project mismatch. Expected " + this.projectSource.getName()
					  + ' got '+ projectName + ' with file ' + filename);
		}
	},

	resizeClient: function() {
		this.sendMessage({op: "resize"});
	},
	//* Prerender simulated drop in designerFrame
	prerenderDrop: function(inTargetId, inBeforeId) {
		this.sendMessage({op: "prerenderDrop", val: {targetId: inTargetId, beforeId: inBeforeId}});
	},
	//* Request auto-generated position value from designerFrame
	requestPositionValue: function(inProp) {
		this.sendMessage({op: "requestPositionValue", val: inProp});
	},
	sendSerializerOptions: function(serializerOptions) {
		this.sendMessage({op: "serializerOptions", val: serializerOptions});	
	},
	sendDragType: function(type) {
		this.sendMessage({op: "dragStart", val: type});
	}
});
