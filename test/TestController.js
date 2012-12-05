enyo.kind({
	name: "Ares.TestController",
	kind: enyo.Component,
	debug: true,
	status: "None",
	aresTestW: null,
	create: function() {
		this.inherited(arguments);
		// listen for dispatched messages (received from Ares Test Reporter)
		window.addEventListener("message", enyo.bind(this, this.recMsgFromTestReporter), false);

		// Create the new window browser named Ares Test Suite
		var url = "../test/index.html"
		aresTestW = window.open(url, 'Ares Test Suite','scrollbars=auto, titlebar=yes, height=640,width=640', false);

		// Communication path between Ares Test and Ares Ide through postMessage window method
		// Warning: postMessage sent several times to make sure it has been received by Ares Test browser
		var count = 4;
		var repeatPostMsg = function() {
			if (this.debug) console.log("Post ARES.TEST.START ...");
			aresTestW.postMessage("ARES.TEST.START", "http://127.0.0.1:9009");
			count--;
			if (count > 0) {
				setTimeout(repeatPostMsg, 1000);
			}
		}
		setTimeout(repeatPostMsg, 1000);
	},
	recMsgFromTestReporter: function(event) {
		// test bad origin
		if (event.origin !== "http://127.0.0.1:9009")
			return;
		// source must be valid
		if (event.source === null) {
			return;
		}
		// START and READY enabled the com path between Ide and Test windows
		if (event.data === "ARES.TEST.READY") {
			if (this.debug) {
				this.status = event.data;
				console.log("Received ARES.TEST.READY ... Communication path established ... Status: "+this.status);
			}
		}
		// Start button pressed on Ares Test Reporter
		if (event.data === "ARES.TEST.RUN") {
			if (this.debug) {
				this.status = event.data;
				console.log("Received ARES.TEST.RUN ... Status: "+this.status);
			}
			// Create TextCtrlRunner and TestProxyReporter components
			// TestProxyReporter is created by TestCtrlRunner
			this.createComponent({name: "runner", kind: "Ares.TestCtrlRunner", testWindow: "aresTestW"});
		}
		if (event.data === "ARES.TEST.RERUN") {
			if (this.debug) {
				this.status = event.data;
				console.log("Received ARES.TEST.RERUN ... Status: "+this.status);
			}
			if (this.$.runner) {
				this.removeComponent(this.$.runner);
			}
			this.createComponent({name: "runner", kind: "Ares.TestCtrlRunner", testWindow: "aresTestW"});
		}
	}
});

