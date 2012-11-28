enyo.kind({
	name: "ares.TestController",
	kind: enyo.Component,
	debug: true,
	status: "None",
	create: function() {
		this.inherited(arguments);
		// listen for dispatched messages (received from Ares Test Reporter)
		window.addEventListener("message", enyo.bind(this, "recMsgFromTestReporter"), false);

		// Create the new window browser named Ares Test Suite
		var url = "../test/index.html"
		var aresTestW = window.open(url, 'Ares Test Suite','scrollbars=auto, titlebar=yes, height=640,width=640', false);

		// Communication path between Ares Test and Ares Ide through postMessage window method
		// Warning: postMessage sent several times to make sure it has been received by Ares Test browser
		var count = 4;
		var repeatPostMsg = function() {
			if (this.debug) console.log("Post START ...");
			aresTestW.postMessage("START", "http://127.0.0.1:9009");
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
		// START and READY enabled the com path between Ide and Test windows
  		if (event.data === "READY") {
 			this.status = event.data;
   			if (this.debug) console.log("Received READY ... Communication path established ... Status: "+this.status);
   		}
  		// start button pressed on Ares Tsest window
  		// when event received - retireve result contents and sent them to Test Reporter
  		if (event.data === "RUN") {
  			this.status = event.data;
  			this.createComponent({kind: "ares.TestCtrlRunner", reporterKind: "ares.TestProxyReporter"});
  			if (this.debug) console.log("Received RUN ... Create ares.TestCtrlRunner and ares.TestProxyReporter ... Status: "+this.status);
  		}
   	}
});

