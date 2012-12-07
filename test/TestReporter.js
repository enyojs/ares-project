// UI kind responsible for creating test component, running tests, receiving & displaying test results.
enyo.kind({
	name: "Ares.TestReporter",
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
					{kind: "Control", content: "Click on "},
					{kind: "onyx.InputDecorator", components: [
						{name: "runTests", kind: "onyx.IconButton", src: "$test/images/play.png", ontap: "runTests"},
						{kind: "onyx.Tooltip", content: "Run Ares Test Suite..."},
					]},
				]},

			]},
			{kind: enyo.Scroller, name: "group"}
		]},		
	],
	classes: "enyo-testcase",
	timeout: 3000,
	aresIdeW: null,
	debug: true,
	create: function() {
		if (this.debug) {
			console.log("I am Ares Test Reporter ...");
		}
		this.inherited(arguments);
		this.aresIdeW = Ares.TestReporter.aresIdeW;
		// listen for dispatched messages (received from Ares Ide)
		window.addEventListener("message", enyo.bind(this, "recMsgFromIde"), false);
	},
	runTests: function() {
		if (this.aresIdeW !== null) {			
			if (this.debug) {
				console.log("Post ARES.TEST.RUN ...");
				console.log("this.aresIdeW: "+this.aresIdeW);
			}
			this.aresIdeW.postMessage("ARES.TEST.RUN", "http://127.0.0.1:9009");
		} else {
			if (this.debug) console.log("window.self.opener ...POST ARES.TEST.RERUN");
			window.self.opener.postMessage("ARES.TEST.RERUN", "http://127.0.0.1:9009");
		}
		this.$.runTests.setDisabled(true);
	},
	testNameDisplay: function(inData) {
		if (this.debug) {
			console.log("TestReporter: testNameDisplay: "+JSON.stringify(inData));
		}
		this.$.group.createComponent({classes: "enyo-testcase-title", content: inData.data}).render();
	},
	testBegun: function(inData) {
		if (this.debug) {
			console.log("TestReporter: testBegun: "+JSON.stringify(inData));
		}
		this.$.group.createComponent({name: inData.data.test, classes: "enyo-testcase-running", content: inData.data.test + ": running", allowHtml: true}).render();
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
		var results = JSON.parse(inData.data.results);
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
		// source must be valid
		if (event.source === null) {
			return;
		}
		// keep the reference 
		if (this.aresIdeW === null) {
			this.aresIdeW = event.source;
			Ares.TestReporter.aresIdeW = this.aresIdeW;			
		}
		if (event.data === "ARES.TEST.START") {
			if (this.debug) console.log("Received ARES.TEST.START ... Post ARES.TEST.READY ...");
			event.source.postMessage("ARES.TEST.READY", event.origin);
		} 
		if(event.data.evt === "ARES.TEST.NAME") {
			if (this.debug) console.log("Received ARES.TEST.NAME ...");
			this.testNameDisplay(event.data);
		}
		if(event.data.evt === "ARES.TEST.RUNNING") {
			if (this.debug) console.log("Received ARES.TEST.RUNNING ...");
			this.testBegun(event.data);
		}
		if(event.data.evt === "ARES.TEST.RESULT") {
			if (this.debug) console.log("Received ARES.TEST.RESULT ...");
			this.updateTestDisplay(event.data);
		}
	},
	statics: {
		aresIdeW: null,
    }
});

