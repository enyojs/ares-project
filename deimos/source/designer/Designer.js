/* global Model, ares */
enyo.kind({
	name: "IFrameDesigner",
	published: {
		iframeReady: false,
		currentKind: null,
		height: null,
		width: null
	},
	events: {
		onDesignRendered: "",
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
		{name: "client", tag: "iframe", classes: "ares-iframe-client"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "../deimos/source/designer/iframe.html",
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
	currentKindChanged: function() {
		this.trace("reloadNeeded", this.reloadNeeded);
		if (this.reloadNeeded) {
			this.reloadNeeded = false;
			this.reload();
		} else {
			this.renderCurrentKind();
		}
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
	
	updateSource: function(inSource) {
		var serviceConfig = inSource.getService().config;
		this.setIframeReady(false);
		this.projectSource = inSource;
		this.projectPath = serviceConfig.origin + serviceConfig.pathname + "/file";
		var iframeUrl = this.baseSource + "?src=" + this.projectSource.getProjectUrl();
		this.trace("Setting iframe url: ", iframeUrl);
		this.$.client.hasNode().src = iframeUrl;
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

		this.trace("Op: ", msg.op, msg);

		if(!msg || !msg.op) {
			enyo.warn("Deimos designer received invalid message data:", msg);
			return;
		}
		
		// Iframe is loaded and ready to do work.
		if(msg.op === "state" && msg.val === "initialized") {
			this.sendIframeContainerData();
		// Iframe received container data
		} else if(msg.op === "state" && msg.val === "ready") {
			this.setIframeReady(true);
			if(this.reloading) {
				this.doReloadComplete();
				this.reloading = false;
			}
		// The current kind was successfully rendered in the iframe
		} else if(msg.op === "rendered") {
			this.kindRendered(msg.val);
		// Select event sent from here was completed successfully. Set _this.selection_.
		} else if(msg.op === "selected") {
			this.selection = enyo.json.codify.from(msg.val);
			this.doSelected({component: this.selection});
		// New select event triggered in iframe. Set _this.selection_ and bubble.
		} else if(msg.op === "select") {
			this.selection = enyo.json.codify.from(msg.val);
			this.doSelect({component: this.selection});
		// Highlight drop target to minic what's happening in iframe
		} else if(msg.op === "syncDropTargetHighlighting") {
			this.doSyncDropTargetHighlighting({component: enyo.json.codify.from(msg.val)});
		// New component dropped in iframe
		} else if(msg.op === "createItem") {
			this.doCreateItem(msg.val);
		// Existing component dropped in iframe
		} else if(msg.op === "moveItem") {
			this.doMoveItem(msg.val);
		} else if (msg.op === "reloadNeeded") {
			this.reloadNeeded = true;
		// Existing component dropped in iframe
		} else if(msg.op === "error") {
			if (( ! msg.val.hasOwnProperty('popup')) || msg.val.popup === true) {
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
	//* Pass _isContainer_ info down to iframe
	sendIframeContainerData: function() {
		this.sendMessage({op: "containerData", val: Model.getFlattenedContainerInfo()});
	},
	//* Tell iFrame to render the current kind
	renderCurrentKind: function(inSelectId) {
		if(!this.getIframeReady()) {
			return;
		}
		
		var currentKind = this.getCurrentKind();
		this.sendMessage({op: "render", val: {name: currentKind.name, components: enyo.json.codify.to(currentKind.components), selectId: inSelectId}});
	},
	//* Render the current kind again for only dynamic UI component without changing source code
	refreshCurrentKind: function(inSelectId, inEvent) {
		if(!this.getIframeReady()) {
			return;
		}
		
		var currentKind = this.getCurrentKind();
		this.sendMessage({op: "render", val: {name: currentKind.name,
											components: enyo.json.codify.to(currentKind.components),
											selectId: inSelectId,
											refreshKindName: inEvent.inKindName,
											refreshKindProp: inEvent.inKindProp,
											refreshKindPanelIndex: inEvent.inPanelIndex}});
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
	//* Property was modified in Inspector, update iframe.
	modifyProperty: function(inProperty, inValue) {
		this.sendMessage({op: "modify", val: {property: inProperty, value: inValue}});
	},
	//* Send message to Deimos with components from iframe
	kindRendered: function(content) {
		this.doDesignRendered({content: content});
	},
	//* Clean up the iframe before closing designer
	cleanUp: function() {
		this.sendMessage({op: "cleanUp"});
	},
	//* Pass inCode down to the iFrame (to avoid needing to reload the iFrame)
	syncJSFile: function(inCode) {
		this.sendMessage({op: "codeUpdate", val: inCode});
	},
	//* Sync the CSS in inCode with the iFrame (to avoid needing to reload the iFrame)
	syncCSSFile: function(inFilename, inCode) {
		this.sendMessage({op: "cssUpdate", val: {filename: this.projectPath + inFilename, code: inCode}});
	},
	resizeClient: function() {
		this.sendMessage({op: "resize"});
	},
	//* Prerender simulated drop in iFrame
	prerenderDrop: function(inTargetId, inBeforeId) {
		this.sendMessage({op: "prerenderDrop", val: {targetId: inTargetId, beforeId: inBeforeId}});
	},
	//* Request auto-generated position value from iframe
	requestPositionValue: function(inProp) {
		this.sendMessage({op: "requestPositionValue", val: inProp});
	}
});
