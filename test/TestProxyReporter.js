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
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	initComponents: function() {
		this.inherited(arguments);
		this.createComponent({name: "testSuite", kind: this.name, onBegin: "testBegun", onFinish: "updateTestDisplay"});
	},
	runTests: function() {
		this.$.testSuite.runAllTests();
	},
	testBegun: function(inSender, inEvent) {
		console.log("=>Ares Proxy Reporter *****" + "Group: " + this.name + " *****test: " +inEvent.testName + " is running ...");

		// Post SEND_TEST_RUNNING event with info relate dto the group and the name of the unit test
		var data = {
			evt: "SEND_TEST_RUNNING",
			group: this.name,
			test: inEvent.testName,
			state: "RUNNING"

		};
		aresTestW.postMessage(data, "http://127.0.0.1:9009");
		if (this.debug) {
			console.log("Post SEND_TEST_RUNNING ... "
				+JSON.stringify(data));
		}
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
		return out;
	},
	updateTestDisplay: function(inSender, inEvent) {
		var results = inEvent.results;
		var e = results.exception;
		var content = "=>Ares Proxy Reporter *****" + "Group: " + this.name + " *****test: " + results.name + " " + (results.passed ? "  is            PASSED  " : results.message);

		// Exception formatting usefull only for console.log here
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

		// content printed into Ares Ide console
		console.dir(content);

		// Post SEND_TEST_RESULT event with associated results
		var data = {
			evt: "SEND_TEST_RESULT",
			group: this.name,
			results: JSON.stringify(results),	
		};		
		aresTestW.postMessage(data, "http://127.0.0.1:9009");
		if (this.debug) {
			console.log("Post SEND_TEST_RESULT ... "
				+JSON.stringify(data));
		}

	}
});

