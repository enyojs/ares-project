enyo.kind({
	name: "IFrameDesigner",
	published: {
		iframeReady: false,
		currentKind: null
	},
	events: {
		onDesignRendered: "",
		onSelect: "",
		onSelected: "",
		onSyncDropTargetHighlighting: ""
	},
	components: [
		{name: "client", tag: "iframe", style: "width:100%;height:100%;border:none;"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "../deimos/source/designer/iframe.html",
	projectSource: null,
	selection: null,
	sandboxData: null,
	rendered: function() {
		this.inherited(arguments);
		this.$.communicator.setRemote(this.$.client.hasNode().contentWindow);
	},
	currentKindChanged: function() {
		this.inherited(arguments);
		this.renderCurrentKind();
	},
	
	updateSource: function(inSource) {
		this.setIframeReady(false);
		this.projectSource = inSource;
		this.$.client.hasNode().src = this.baseSource + "?src=" + inSource;
	},
	reloadIFrame: function() {
		this.updateSource(this.projectSource);
	},
	
	//* Send message via communicator
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	//* Respond to message from communicator
	receiveMessage: function(inSender, inEvent) {
		var msg = inEvent.message;
		
		// Iframe is loaded and ready to do work.
		if(msg.op === "state" && msg.val === "initialized") {
			this.sendIframeContainerData();
		} else if(msg.op === "state" && msg.val === "ready") {
			this.setIframeReady(true);
		} else if(msg.op === "rendered") {
			this.sandboxData = msg.val;
			this.doDesignRendered({components: enyo.json.codify.from(msg.val)});
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
		}
	},
	
	//* Pass _isContainer_ info down to iframe
	sendIframeContainerData: function() {
		this.sendMessage({op: "containerData", val: Model.getFlattenedContainerInfo()});
	},
	//* Tell iFrame to render the current kind
	renderCurrentKind: function() {
		if(!this.getIframeReady()) {
			return;
		}
		
		this.sendMessage({op: "render", val: this.getCurrentKind().name});
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
	//* Control was dropped the ComponentView - simulate drop in iframe
	drop: function(inDropData) {
		this.sendMessage({op: "drop", val: {item: inDropData.item, target: inDropData.target}});
	},
	//* Control was dragged from the Palette to the ComponentView - simulate dropping from Palette to iframe
	createNewControl: function(inDropData) {
		// Clean up drop data for RPC
		if(inDropData.originator) {
			delete inDropData.originator;
		}
		if(inDropData["__proto__"]) {
			delete inDropData["__proto__"];
		}
		
		this.sendMessage(inDropData);
	},
	modifyProperty: function(inProperty, inValue) {
		this.sendMessage({op: "modify", val: {property: inProperty, value: inValue}});
	},
	save: function() {
		return this.sandboxData;
	},
	//* Pass the current code in Phobos down to the iFrame (to avoid needing to reload the iFrame)
	loadPhobosCode: function(inCode) {
		this.sendMessage({op: "codeUpdate", val: inCode});
	},
	//* Clean up the iframe before closing designer
	cleanUp: function() {
		this.sendMessage({op: "cleanUp"});
	}
});
