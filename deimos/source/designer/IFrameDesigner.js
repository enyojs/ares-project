enyo.kind({
	name: "IFrameDesigner",
	published: {
		iframeReady: false,
		currentKind: null
	},
	events: {
		onDesignRendered: "",
		onSelect: "",
		onSelected: ""
	},
	components: [
		{name: "client", tag: "iframe", style: "width:100%;height:100%;border:none;"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "../deimos/source/designer/iframe.html",
	selection: null,
	rendered: function() {
		this.inherited(arguments);
		this.$.communicator.setRemote(this.$.client.hasNode().contentWindow);
	},
	updateSource: function(inSource) {
		this.setIframeReady(false);
		this.$.client.hasNode().src = this.baseSource + "?src=" + inSource;
	},
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	receiveMessage: function(inSender, inEvent) {
		var msg = inEvent.message;
		if(msg.op === "state" && msg.val === "ready") {
			this.setIframeReady(true);
			this.renderCurrentKind();
		} else if(msg.op === "rendered") {
			// Re-codify json string and bubble
			this.doDesignRendered({components: enyo.json.codify.from(msg.val)});
		} else if(msg.op === "selected") {
			this.selection = enyo.json.codify.from(msg.val);
			this.doSelected({component: this.selection});
		}
	},
	renderCurrentKind: function() {
		if(!this.getIframeReady()) {
			this.log("Can't render current kind - iFrame not ready.")
			return;
		}
		
		this.sendMessage({op: "render", val: this.getCurrentKind()});
	},
	currentKindChanged: function() {
		this.inherited(arguments);
		this.renderCurrentKind();
	},
	select: function(inControl) {
		this.sendMessage({op: "select", val: inControl});
		return;
		
		if (inControl && (inControl == this || !inControl.isDescendantOf(this.$.sandbox))) {
			inControl = null;
		}
		this.selection = inControl;
		this.$.selectionOutline.outlineControl(this.selection);
		this.$.containerOutline.outlineControl(this.getSelectedContainer());
	},
	highlightDropTarget: function(inControl) {
		this.sendMessage({op: "highlight", val: inControl});
		return;
	},
	unHighlightDropTargets: function() {
		this.sendMessage({op: "unhighlight"});
		return;
	},
	drop: function(inDropData) {
		this.sendMessage({op: "drop", val: {item: inDropData.item, target: inDropData.target}});
	},
	modifyProperty: function(inProperty, inValue) {
		this.sendMessage({op: "modify", val: {property: inProperty, value: inValue}});
	}
});


enyo.kind({
	name: "RPCCommunicator",
	kind: "enyo.Component",
	published: {
		remote: window.parent
	},
	events: {
		onMessage: ""
	},
	sendMessage: function(inMessage) {
		//this.log("designer sending message:", inMessage);
		this.getRemote().postMessage({message: inMessage}, "*");
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.setupRPC();
	},
	remoteChanged: function() {
		this.inherited(arguments);
	},
	setupRPC: function() {
		enyo.dispatcher.listen(window, "message", enyo.bind(this, "receiveMessage"));
	},
	receiveMessage: function(inMessage) {
		//this.log("designer receiving message:", inMessage);
		this.doMessage(inMessage.data);
	}
});