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
		this.doMessage(inMessage.data);
	}
});