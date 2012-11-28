// UI kind responsible for creating test component, running tests, receiving & displaying test results.
enyo.kind({
	name: "ares.TestReporter",
	kind: enyo.Control,
	published: {
		results: null
	},
	events: {
		onFinishAll: ""
	},
	components: [
		{kind: "FittableRows", fit: true, components: [
			{kind: "onyx.Toolbar",	classes: "onyx-menu-toolbar", isContainer: true, components: [
				{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Ares Test Suite", style: "margin-right: 10px"},
					{fit:true},
					{kind: "onyx.InputDecorator", components: [
						{name: "runTests", kind: "onyx.IconButton", src: "$test/images/play.png", ontap: "runTests"},
						{kind: "onyx.Tooltip", content: "Run Ares Test Suite..."},
					]},
				]},

			]},
			{name: "title", classes: "enyo-testcase-title"},
			{name: "group", classes: "enyo-testcase-group"}
		]},		
	],
	classes: "enyo-testcase",
	timeout: 3000,
	aresIdeW: null,
	debug: true,
	create: function() {
		this.inherited(arguments);
		this.$.title.setContent(this.name);
		this.aresIdeW = ares.TestReporter.aresIdeW;
		// listen for dispatched messages (received from Ares Ide)
		window.addEventListener("message", enyo.bind(this, "recMsgFromIde"), false);
	},
	initComponents: function() {
		this.inherited(arguments);
		this.createComponent({name: "testSuite", kind: this.name, onBegin: "testBegun", onFinish: "updateTestDisplay"});
	},
	runTests: function() {
		if (this.debug) console.log("Post RUN ...");
		this.aresIdeW.postMessage("RUN", "http://127.0.0.1:9009");
		this.$.runTests.setDisabled(true);
		this.$.testSuite.runAllTests();
	},
	testBegun: function(inSender, inEvent) {
		this.$.group.createComponent({name: inEvent.testName, classes: "enyo-testcase-running", content: inEvent.testName + ": running", allowHtml: true}).render();
	},
	formatStackTrace: function(inStack) {
	},
	updateTestDisplay: function(inSender, inEvent) {
		if (this.debug) console.log("updateTestDisplay");
	},
	recMsgFromIde: function(event) {
		// test bad origin
		if (event.origin !== "http://127.0.0.1:9009")
			return;
		// keep the reference 
 		if (this.aresIdeW === null) {
  			this.aresIdeW = event.source;
			ares.TestReporter.aresIdeW = this.aresIdeW;			
  		}
  		if (event.data === "START") {
  			if (this.debug) console.log("Received START ... Post READY ...");
			event.source.postMessage("READY", event.origin);
  		} 
	},
	statics: {
		aresIdeW: null,
	}
});

