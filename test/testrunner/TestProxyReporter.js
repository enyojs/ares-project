/* global ares */
enyo.kind({
	name: "Ares.TestProxyReporter",
	kind: enyo.Component,
	published: {
		results: null
	},
	events: {
		onFinishAll: ""
	},
	classes: "enyo-testcase",
	timeout: 3000,
	debug: true,
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		if (window.aresTestW !== null) {
			// Post ARES.TEST.NAME event to infor the Ares Test Reporter the name of the TestSuite
			window.aresTestW.postMessage({evt:"ARES.TEST.NAME", data:this.name}, "http://127.0.0.1:9009");
			this.trace("Post ARES.TEST.NAME ...name: ", this.name);
		}
	},
	initComponents: function() {
		this.inherited(arguments);
		this.createComponent({name: "testSuite", kind: this.name, onBegin: "testBegun", onFinish: "updateTestDisplay", aresObj: this.aresObj});
	},
	runTests: function() {
		this.$.testSuite.runAllTests();
	},
	testBegun: function(inSender, inEvent) {
		this.trace("=>Ares Proxy Reporter *****", "Group: ", this.name, " *****test: ", inEvent.testName, " is running ...");

		if (window.aresTestW !== null) {
			// Post ARES.TEST.RUNNING event with info related to the group and the name of the unit test
			var obj = {
				group: this.name,
				test: inEvent.testName,
				state: "RUNNING"

			};
			window.aresTestW.postMessage({evt:"ARES.TEST.RUNNING", data:obj}, "http://127.0.0.1:9009");
			this.trace("Post ARES.TEST.RUNNING ... ", JSON.stringify(obj));
		}
	},
	formatStackTrace: function(inStack) {
		var stack = inStack.split("\n");
		var out = [''];
		for (var i=0, s; (s=stack[i]); i++) {
			if (s.indexOf("    at Object.do") === 0 || s.indexOf("    at Object.dispatch") === 0 || s.indexOf("TestSuite.js") != -1) {
				continue;
			}
			out.push(s);
		}
		return out;
	},
	updateTestDisplay: function(inSender, inEvent) {
		var results = inEvent.results;
		var e = results.exception;
		var content = "=>Ares Proxy Reporter *****" + "Group: " + this.name + " *****test: " + results.name + " " + (results.passed ? "  is            PASSED  " : results.message);

		// Exception formatting usefull only for logging
		if (e) {
			// If we have an exception include the stack trace or file/line number.
			if (e.stack) {
				content += this.formatStackTrace(e.stack);
			} else if (e.sourceURL && e.line) {
				content += e.sourceURL + ":" + e.line;
			}
			// if fail was called with an object, show the JSON.  This is likely a service request error or somesuch.
			if (results.failValue) {
				//content += enyo.json.stringify(results.failValue);
				content += enyo.json.stringify(results.failValue);
			}
		}
		// Show logs if we have any.
		if (!results.passed && results.logs) {
			content += results.logs;
		}

		enyo.log(content);

		if (window.aresTestW !== null) {
			// Post ARES.TEST.RESULT event with associated results
			var obj = {
				group: this.name,
				results: enyo.json.stringify(results)
			};		
			window.aresTestW.postMessage({evt:"ARES.TEST.RESULT", data:obj}, "http://127.0.0.1:9009");
			this.trace("Post ARES.TEST.RESULT ... ", JSON.stringify(obj));
			enyo.log("Post ARES.TEST.RESULT ... ", enyo.json.stringify(obj));
		}
	}
});

