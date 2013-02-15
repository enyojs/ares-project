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
		onSyncDropTargetHighlighting: "",
		onDesignChange: ""
	},
	components: [
		{name: "client", tag: "iframe", style: "width:100%;height:100%;border:none;"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "../deimos/source/designer/iframe.html",
	selection: null,
	this.sandboxData: null,
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
		this.$.client.hasNode().src = this.baseSource + "?src=" + inSource;
	},
	
	//* Send message via communicator
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	//* Respond to message from communicator
	receiveMessage: function(inSender, inEvent) {
		var msg = inEvent.message;
		
		// Iframe is loaded and ready to do work.
		if(msg.op === "state" && msg.val === "ready") {
			this.setIframeReady(true);
			this.renderCurrentKind();
		} else if(msg.op === "rendered") {
			this.sandboxData = msg.val;
			this.doDesignRendered({components: enyo.json.codify.from(msg.val)});
			this.doDesignChange(); // TODO <---- only do this when a change occurs
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
	
	//* Tell iFrame to render the current kind
	renderCurrentKind: function() {
		if(!this.getIframeReady()) {
			return;
		}
		
		this.sendMessage({op: "render", val: this.getCurrentKind()});
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
	},
	save: function() {
		return this.sandboxData;
	},
});
