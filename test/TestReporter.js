// UI kind responsible for creating test component, running tests, receiving & displaying test results.
enyo.kind({
	name: "enyo.TestReporter",
	kind: enyo.Control,
	published: {
		results: null
	},
	events: {
		onFinishAll: ""
	},
	components: [
		{name: "title", classes: "enyo-testcase-title"},
		{name: "group", classes: "enyo-testcase-group"}
	],
	classes: "enyo-testcase",
	timeout: 3000,
	create: function() {
		this.inherited(arguments);
		this.$.title.setContent(this.name);
	},
	initComponents: function() {
		this.inherited(arguments);
		this.createComponent({name: "testSuite", kind: this.name, onBegin: "testBegun", onFinish: "updateTestDisplay"});
	},
	runTests: function() {
		this.$.testSuite.runAllTests();
	},
	testBegun: function(inSender, inEvent) {
		this.$.group.createComponent({name: inEvent.testName, classes: "enyo-testcase-running", content: inEvent.testName + ": running", allowHtml: true}).render();
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
	updateTestDisplay: function(inSender, inEvent) {
		var results = inEvent.results;
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
	}
});

