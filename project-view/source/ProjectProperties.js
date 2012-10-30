enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onCustomConfigProject: "",
	},
	
	createMode: true,
	components: [
	    {kind: "FittableRows", fit: true, components: [
	    	{content: "Settings", style: "width:100%"},
	    	{tag: "br"},
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Project Id:"},
					{fit: true},
					{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", placeholder: "com.example.myapp", name: "projectId"}
						]},
				]},
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Project Name:"},
					{fit: true},
					{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", placeholder: "My Project Name", name: "projectName"}
					]},
				]},
			{tag: "br"},
			{content: "PhoneGap ...", style: "width:100%", ontap:"activateDrawer"},
					{tag: "br"},
					{name: "phoneGapDrawer", kind: "onyx.Drawer", open:false, components: [
					{kind: "FittableColumns", style: "width:100%", components: [
						{kind: "Control", content: "Target Build:"},
						{fit: true},
						{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", placeholder: "Enter a target build", name: "targetBuild"}
						]},
					]},	
					{kind: "FittableColumns", style: "width:100%", components: [
						{kind: "Control", content: "PhoneGap Key:"},
						{fit: true},
						{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", placeholder: "Enter your key", name: "phonegapKey"}
						]},
					]},	
				]},
			{name: "status", tag: "p", content: "You need to create a project!", style: "width:100%; color: red"},
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control"},
					{fit: true},
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "hide"},
					{kind: "onyx.Button", content: "OK", classes: "onyx-affirmative", name: "confirm", ontap: "confirmTap"}
				]}				
		]},
    ],
    create: function() {
    	this.inherited(arguments);
    	this.$.confirm.setDisabled(true);
    },
	activateDrawer: function() {
		//drawer is closed
		this.$.phoneGapDrawer.setOpen(!this.$.phoneGapDrawer.open);
	},
    reset: function() {
		this.$.projectName.setValue("");
		this.$.projectId.setValue("com.example.myapp");
		this.$.targetBuild.setPlaceholder("Enter a target build");
		this.$.phonegapKey.setPlaceholder("Enter your key");
		this.$.status.setContent("You need to create a project!");
		this.$.confirm.setDisabled(true);
		this.activateDrawer();
	},
	enable: function(inData) {
		// handle the pre-fill values
		if (inData.name !== undefined) {
			this.$.projectId.setValue(inData.id);
		} else
			this.$.projectId.setValue("com.example.myapp");
		this.$.projectName.setValue(inData.name);
		this.$.targetBuild.setValue(inData.phonegapbuild.target);
		this.$.phonegapKey.setValue(inData.phonegapbuild.key);
		this.$.confirm.setDisabled(false);
		this.$.status.setContent(" ");
	},
    confirmTap: function(inSender, inEvent) {
		// retrieve modified values
		var obj = {
		 	name: this.$.projectName.getValue(),
		 	id: this.$.projectId.getValue(),
		 	target: this.$.targetBuild.getValue(),
		 	key: this.$.phonegapKey.getValue()
		}
		this.doCustomConfigProject(obj);
		// handled here (don't bubble)
        return true;
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
	preFillConfig: function(inData) {
		this.$.projectProperties.enable(inData);
	},
});
