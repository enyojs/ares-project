/*
To add a test case:
	1) Create a subclass of EnyoTestCase
	2) Add file to package.js
*/
enyo.kind({
	name: "enyo.TestRunner",
	kind: enyo.Control,
	index: 0,
	rendered: function() {
		this.inherited(arguments);
		this.next();
	},
	next: function() {
		var test = enyo.TestSuite.tests[this.index++];
		if (test) {
			this.createComponent({name: test.prototype.kindName, kind: enyo.TestReporter, onFinishAll: "next"}).render().runTests();
		}
	}
});
