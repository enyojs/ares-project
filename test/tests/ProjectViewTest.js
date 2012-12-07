enyo.kind({
	name: "ProjectViewTest",
	kind: "Ares.TestSuite",
	debug: true,

	create: function () {
		this.inherited(arguments);
	},
	/**
	*  TODO: under implementation
	*  just the schema is put in place
	*/
	testCreateNewProject: function() {
		this.log("Begin called in testCreateNewProject.");
		this.finish();
	},
	testImportProject: function() {
		this.log("Begin called in testImportProject.");
		//this.finish();
	},
	testScanProject: function() {
		this.log("Begin called in testScanProject.");
		//this.finish();
	}
});