enyo.kind({
	name: "ares.TestCtrlRunner",
	kind: enyo.Component,
	index: 0,
	rendered: function() {
		this.inherited(arguments);
		this.next();
	},
	next: function() {
		var test = ares.TestSuite.tests[this.index++];
		if (test) {
			var aresRunner = this.createComponent({name: test.prototype.kindName, kind: ares.TestProxyReporter, onFinishAll: "next"});
			aresRunner.runTests();
		}
	}
});
