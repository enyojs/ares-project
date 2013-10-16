enyo.kind({
	name: "Ares.TestCtrlRunner",
	kind: enyo.Component,
	components: [
		{name: "infoPopup", kind: "InfoPopup", onCancel: "cancel"}
	],
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
		} else {
			// Popup to inform results are available into console when executing tests on IE	
			if (window.aresTestW === null) {
				this.$.infoPopup.show();
			}
			// No new test to run, we need to remove the temp test/root directory
			var req = new enyo.Ajax({
				url: '/res/tester',
				method: 'DELETE',
				handleAs: "text"
			});
			req.error(this, function(inSender, inError) {
				this.log("Ares test cleanup failed ... (" + inError + ")");
			});
			req.go();
		}
	}
});

enyo.kind({
	name: "InfoPopup",
	kind: "onyx.Popup",
	events: {
		onCancel: ""
	},
	modal: true,
	centered: true,
	floating: true,
	components: [
		{tag: "h3", content: "The results of the Ares TestRunner are available in the console!!"},
		{tag: "br"},
		{kind: "FittableColumns", components: [
			{name: "cancelButton", kind: "onyx.Button", content: "cancel", ontap: "deleteCancel"},
			{fit: true},
		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	deleteCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	}
});

