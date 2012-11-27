/*
To add a test case:
	1) Create a subclass of EnyoTestCase
	2) Add file to package.js
*/
enyo.kind({
	name: "ares.TestConsoleRunner",
	kind: enyo.Control,
	index: 0,
	rendered: function() {
		this.inherited(arguments);
		this.next();
	},
	next: function() {
		var test = ares.TestSuite.tests[this.index++];
		if (test) {
			var aresRunner = this.createComponent({name: test.prototype.kindName, kind: ares.TestConsoleReporter, onFinishAll: "next"});
			aresRunner.runTests();
		}
	}
});
