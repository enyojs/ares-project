enyo.kind({
	name: "ares.TestConsoleReporter",
	kind: enyo.Component,
	published: {
		results: null
	},
	events: {
		onFinishAll: ""
	},
	classes: "enyo-testcase",
	timeout: 3000,
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
		console.log("=>Ares Reporter *****" + "Group: " + this.name + " *****test: " +inEvent.testName + " is running ...");
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
		var content = "=>Ares Reporter *****" + "Group: " + this.name + " *****test: " + results.name + " " + (results.passed ? "  is            PASSED  " : results.message);
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
		console.dir(content);
	}
});

