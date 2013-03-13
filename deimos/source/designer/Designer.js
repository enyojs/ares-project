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
		onReloadComplete: ""
	},
	components: [
		{name: "client", tag: "iframe", classes: "ares-iframe-client"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "../deimos/source/designer/iframe.html",
	projectSource: null,
	selection: null,
	scale: 1,
	reloading: false,
	rendered: function() {
		this.inherited(arguments);
		this.$.communicator.setRemote(this.$.client.hasNode().contentWindow);
	},
	currentKindChanged: function() {
		this.inherited(arguments);
		this.renderCurrentKind();
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
		this.$.client.hasNode().src = this.baseSource + "?src=" + this.projectSource.getProjectUrl();
	},
	reload: function() {
		this.reloading = true;
		this.updateSource(this.projectSource);
	},
	
	//* Send message via communicator
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	//* Respond to message from communicator
	receiveMessage: function(inSender, inEvent) {
		if(!inEvent.message || !inEvent.message.op) {
			enyo.warn("Deimos designer received invalid message data:", msg);
			return;
		}
		
		var msg = inEvent.message;
		
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
	}
});
