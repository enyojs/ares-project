enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onCancelSettings: "",
	},
	debug: false,
	components: [
	    {kind: "FittableRows", fit: true, name: "fittableRows", components: [
	    	{content: "Settings", style: "width:100%"},
	    	{tag: "br"},
			{kind: "FittableColumns", name: "fittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Format: ", name: "control4format"},
					{fit: true},
					{kind: "onyx.InputDecorator", content: "Format: ", name: "inputDecorator", components: [
							{kind: "Input", disabled: true, placeholder: "1", name: "format"}
						]}
				]},
			{kind: "FittableColumns", name: "fittableColumns2", style: "width:100%", components: [
					{kind: "Control", content: "Project Id:", name: "control4Id"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator2", components: [
							{kind: "onyx.Input", placeholder: "com.example.myapp", name: "projectId", onchange: "pIdChanged"}
						]},
				]},
			{kind: "FittableColumns", name: "fittableColumns3", style: "width:100%", components: [
					{kind: "Control", content: "Project Name:", name: "control4Name"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator3", components: [
							{kind: "onyx.Input", defaultFocus: true, placeholder: "My Project Name", name: "projectName",  onchange: "pNameChanged"}
					]},
				]},
			{kind: "FittableColumns", name: "fittableColumns4", style: "width:100%", components: [
					{kind: "Control", content: "Version:", name: "control4version"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator4", components: [
							{kind: "onyx.Input", disabled: true, placeholder: "1.0", name: "projectVersion"}
					]},
				]},	
			{tag: "br"},
			{content: "PhoneGap ...", style: "width:100%", ontap:"activateDrawer"},
					{tag: "br"},
					{name: "phoneGapDrawer", kind: "onyx.Drawer", open:false, components: [
					{kind: "FittableColumns", name: "fittableColumns5", style: "width:100%", components: [
						{kind: "Control", content: "Target Build:", name: "control4target"},
						{fit: true},
						{kind: "onyx.InputDecorator", name: "inputDecorator5", components: [
							{kind: "onyx.Input", placeholder: "Enter target build", name: "targetBuild"}
						]},
					]},	
					{kind: "FittableColumns", name: "fittableColumns6", style: "width:100%", components: [
						{kind: "Control", content: "PhoneGap Key:", name: "control4key"},
						{fit: true},
						{kind: "onyx.InputDecorator", name: "inputDecorator6", components: [
							{kind: "onyx.Input", placeholder: "Enter your key", name: "phonegapKey"}
						]},
					]},	
				]},
			{name: "status", tag: "p", content: "You need to create a project!", style: "width:100%; color: red"},
			{kind: "FittableColumns", style: "width:100%", name: "fittableColumns10", components: [
					{kind: "Control", name: "control4buttons"},
					{fit: true},
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "doCancelSettings"},
					{kind: "onyx.Button", content: "Apply", classes: "onyx-affirmative", name: "apply", ontap: "doApply"}
				]}
		]},
    ],
    create: function() {
    	this.inherited(arguments);
    	this.$.apply.setDisabled(true);
    },
	activateDrawer: function() {
		this.$.phoneGapDrawer.setOpen(!this.$.phoneGapDrawer.open);
	},
	enable: function(inData) {
		this.log("enableSettings function");
		this.$.status.setContent(" ");
		this.$.apply.setDisabled(false);
		this.$.projectId.setPlaceholder("com.exemple."+inData.name);
		this.$.projectName.setPlaceholder(inData.name);
	},
	pNameChanged: function(inSender, inEvent) {
		this.setName(this.$.Name.getValue());
	},
	reset: function() {
		this.log("reset function");
		this.$.projectName.setValue("");
		this.$.projectId.setValue("com.example.myapp");
		this.$.apply.setDisabled(true);
	},
});

enyo.kind({
	name: "ProjectPropertiesPopup",
	kind: "onyx.Popup",
	modal: true, centered: true, floating: true, autoDismiss: false,
	components: [
        {kind: "ProjectProperties"}
	],
	reset: function() {
		this.$.projectProperties.reset();
	},
	enableSettings: function(inData) {
		this.$.projectProperties.enable(inData);
	}
});
