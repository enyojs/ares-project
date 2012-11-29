// UI kind responsible for creating test component, running tests, receiving & displaying test results.
enyo.kind({
	name: "ares.TestReporter",
	kind: enyo.Control,
	published: {
		results: null
	},
	events: {
		onFinishAll: ""
	},
	components: [
		{kind: "FittableRows", fit: true, components: [
			{kind: "onyx.Toolbar",	classes: "onyx-menu-toolbar", isContainer: true, components: [
				{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Ares Test Suite", style: "margin-right: 10px"},
					{fit:true},
					{kind: "onyx.InputDecorator", components: [
						{name: "runTests", kind: "onyx.IconButton", src: "$test/images/play.png", ontap: "runTests"},
						{kind: "onyx.Tooltip", content: "Run Ares Test Suite..."},
					]},
				]},

			]},
			{name: "title", classes: "enyo-testcase-title"},
			{name: "group", classes: "enyo-testcase-group"}
		]},		
	],
	classes: "enyo-testcase",
	timeout: 3000,
	aresIdeW: null,
	debug: false,
	create: function() {
		this.inherited(arguments);
		this.$.title.setContent(this.name);
		this.aresIdeW = ares.TestReporter.aresIdeW;
		// listen for dispatched messages (received from Ares Ide)
		window.addEventListener("message", enyo.bind(this, "recMsgFromIde"), false);
	},
	initComponents: function() {
		this.inherited(arguments);
	},
	runTests: function() {
		if (this.debug) console.log("Post RUN ...");
		this.aresIdeW.postMessage("RUN", "http://127.0.0.1:9009");
		this.$.runTests.setDisabled(true);
	},
	testBegun: function(inData) {
		if (this.debug) {
			console.log("TestReporter: testBegun: "+JSON.stringify(inData));
		}
		this.$.group.createComponent({name: inData.test, classes: "enyo-testcase-running", content: inData.test + ": running", allowHtml: true}).render();
	},
	formatStackTrace: function(inStack) {
		var stack = inStack.split("\n");
		var out = [''];
		for (var i=0, s; s=stack[i]; i++) {
			if (s.indexOf("    at Object.do") == 0 || s.indexOf("    at Object.dispatch") == 0 || s.indexOf("TestSuite.js") != -1) {
				continue;
			}
			out.push(s);
		}
		return out.join("<br/>");
	},
	updateTestDisplay: function(inData) {
		if (this.debug) {
			console.log("TestReporter: updataTestDisplay: "+JSON.stringify(inData));
		}
		var results = inData.results;
		var e = results.exception;
		var info = this.$.group.$[results.name];
		var content = "<b>" + results.name + "</b>: " + (results.passed ? "PASSED" : results.message);
		if (e) {
			// If we have an exception include the stack trace or file/line number.
			if (e.stack) {
				content += this.formatStackTrace(e.stack);
			} else if (e.sourceURL && e.line) {
				content += "<br/>" + e.sourceURL + ":" + e.line;
			}
			// if fail was called with an object, show the JSON.  This is likely a service request error or somesuch.
			if (results.failValue) {
				content += "<br/>" + enyo.json.stringify(results.failValue).replace(/\\n/g, "<br/>");
			}
		}
		// Show logs if we have any.
		if (!results.passed && results.logs) {
			content += "<br/>" + results.logs.join("<br/>");
		}
		info.setContent(content);
		info.setClasses("enyo-testcase-" + (results.passed ? "passed" : "failed"));
	},
	recMsgFromIde: function(event) {
		// test bad origin
		if (event.origin !== "http://127.0.0.1:9009")
			return;
		// keep the reference 
 		if (this.aresIdeW === null) {
  			this.aresIdeW = event.source;
			ares.TestReporter.aresIdeW = this.aresIdeW;			
  		}
  		if (event.data === "START") {
  			if (this.debug) console.log("Received START ... Post READY ...");
			event.source.postMessage("READY", event.origin);
  		} 
  		if(event.data.evt === "SEND_TEST_RUNNING") {
			if (this.debug) console.log("Received SEND_TEST_RUNNING ...");
			this.testBegun(event.data);
  		}
  		if(event.data.evt === "SEND_TEST_RESULT") {
			if (this.debug) console.log("Received SEND_TEST_RESULT ...");
			this.updateTestDisplay(event.data);
  		}
	},
	statics: {
		aresIdeW: null,
    }
});

