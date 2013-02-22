/**
	Simple kind wrapping the window.postMessage() function.
	
	The kind sends messages to the window specified in the _remote_ property, and
	receives messages by listnening to the _message_ event on it's containing window.
	Receieved messages are bubbled to the kind's owner via the onMessage event.
	
	{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	
	receiveMessage: function(inSender, inEvent) {
		// Get message
		var message = inEvent.message;
	}
	
	sendMessage: function(myMessage) {
		this.$.communicator.sendMessage(myMessage);
	}
*/
enyo.kind({
	name: "RPCCommunicator",
	kind: "enyo.Component",
	published: {
		/**
			A reference to the window to which messages should be sent. This
			can be obtained by using the _contentWindow_ property of an iframe,
			by saving the return value of a _window.open_ call, or by referencing
			an item in the _window.frames_ array.
			
			this.$.communicator.setRemote(this.$.myIframe.hasNode().contentWindow);
		*/
		remote: window.parent
	},
	events: {
		/**
			When a message event is receieved from the window containing this
			kind, the event data is bubbled to this kind's owner.
		*/
		onMessage: ""
	},
	//* Send (text string) message _inMessage_ to _this.remote_.
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