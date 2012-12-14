enyo.kind({
	name: "TestSuiteTemplate",
	kind: "Ares.TestSuite",
	debug: false,

	create: function () {
		this.inherited(arguments);
	},
	/**
	* test success example
	*/
	testWithSuccess: function() {
		this.finish();
	},
	/**
	* test without success example
	*/
	testWithOutSuccess: function() {
		this.finish("test failure");
	},

});