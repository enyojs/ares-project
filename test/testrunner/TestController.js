/* global ares */
enyo.kind({
	name: "Ares.TestController",
	kind: enyo.Component,
	debug: false,
	status: "None",
	create: function() {
		ares.setupTraceLogger(this);
		this.trace("I am Ares Test Controller ...");

		// in charge of the setup&cleanup test environment
		var req = new enyo.Ajax({
			url: '/res/tester',
			method: 'POST',
			handleAs: "text"
		});
		req.error(this, function(inSender, inError) {
			this.log("Ares test setup failed ... (" + inError + ")");
		});
		req.go();                

		// in charge of Ares TestRunner Test Suite
		if (window.location.search.indexOf("norunner") == -1) {
			this.inherited(arguments);
			// postMessage API is not correctly supported by IE
			if (!enyo.platform.ie) {
				// listen for dispatched messages (received from Ares Test Reporter)
				window.addEventListener("message", enyo.bind(this, this.recMsgFromTestReporter), false);

				// Create the new window browser named Ares Test Suite
				var url = "../test/testrunner/index.html";
				window.aresTestW = window.open(url, 'Ares-Test-Suite','scrollbars=auto, titlebar=yes, height=640,width=640', false);

				// Communication path between Ares Test and Ares Ide through postMessage window method
				// Warning: postMessage sent several times to make sure it has been received by Ares Test browser
				var count = 4;
				var repeatPostMsg = function() {
					if (this.debug) {
						enyo.log("Post ARES.TEST.START ...");
					}
					window.aresTestW.postMessage("ARES.TEST.START", "http://127.0.0.1:9009");
					count--;
					if (count > 0) {
						setTimeout(repeatPostMsg, 1000);
					}
				};
				setTimeout(repeatPostMsg, 1000);
			} else {
				window.aresTestW = null;
				// Create TextCtrlRunner and TestProxyReporter components
				// TestProxyReporter is created by TestCtrlRunner
				if (this.$.runner) {
					this.removeComponent(this.$.runner);
				}
				this.createComponent({name: "runner", kind: "Ares.TestCtrlRunner", aresObj: this.aresObj});
			}
		}
	},
	recMsgFromTestReporter: function(event) {
		// test bad origin
		if (event.origin !== "http://127.0.0.1:9009") {
			return;
		}
		// source must be valid
		if (event.source === null) {
			return;
		}
		// START and READY enabled the com path between Ide and Test windows
		if (event.data === "ARES.TEST.READY") {
			if (this.debug) {
				this.status = event.data;
				enyo.log("Received ARES.TEST.READY ... Communication path established ... Status: "+this.status);
			}
		}
		// Start button pressed on Ares Test Reporter
		if (event.data === "ARES.TEST.RUN") {
			if (this.debug) {
				this.status = event.data;
				enyo.log("Received ARES.TEST.RUN ... Status: "+this.status);
			}
			// Create TextCtrlRunner and TestProxyReporter components
			// TestProxyReporter is created by TestCtrlRunner
			if (this.$.runner) {
				this.removeComponent(this.$.runner);
			}
			this.createComponent({name: "runner", kind: "Ares.TestCtrlRunner", aresObj: this.aresObj});
		}
	}
});

