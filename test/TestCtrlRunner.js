enyo.kind({
	name: "Ares.TestCtrlRunner",
	kind: enyo.Component,
	index: 0,
	create: function() {
		this.inherited(arguments);
		this.next();
	},
	next: function() {
		var test = Ares.TestSuite.tests[this.index++];
		if (test) {
			var aresRunner = this.createComponent({name: test.prototype.kindName, kind: Ares.TestProxyReporter, onFinishAll: "next", aresObj: this.aresObj});
			aresRunner.runTests();
		}
	}
});
