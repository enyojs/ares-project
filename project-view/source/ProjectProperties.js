enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onCustomConfigProject: "",
		onSaveGeneratedXml: "",
		onCanceled: "",
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
							{kind: "onyx.Input", style: "width:180px", placeholder: "com.example.myapp", name: "projectId"}
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
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Title:"},
					{fit: true},
					{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", style: "width:230px", placeholder: "", name: "projectTitle"}
					]},
				]},
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Description:"},
					{fit: true},
					{kind: "onyx.InputDecorator", components: [
							{kind: "onyx.Input", style: "width:180px", placeholder: "", name: "projectDescription"}
					]},
				]},
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
				]},
			{name: "status", tag: "p", content: "You need to create a project!", style: "width:100%; color: red"},
			{kind: "FittableColumns", style: "width:100%", components: [
					{kind: "Control"},
					{fit: true},
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "doCanceled"},
					{kind: "onyx.Button", content: "OK", classes: "onyx-affirmative", name: "confirm", ontap: "confirmTap"}
				]}
		]},
	],
	debug: false,
	create: function() {
		this.inherited(arguments);
		this.$.confirm.setDisabled(true);
	},
	activateDrawer: function() {
		//drawer is closed
		this.$.phoneGapDrawer.setOpen(!this.$.phoneGapDrawer.open);
	},
	reset: function(inData) {
		this.$.confirm.setDisabled(true);
		this.activateDrawer();
	},
	/**
	 * pre-fill the widget with configuration data
	 * @param {Object} config is configuration data (typically from project.json)
	 *  can be a json string or an object. 
	 */
	preFill: function(inData) {
		this.log(inData) ;
		var config = typeof inData === 'object' ? inData : JSON.parse(inData) ;

		if (config.name !== undefined) {
			this.$.projectId.setValue("com.example.apps."+config.name);
		} else {
			this.$.projectId.setValue("com.example.apps.myapp");
		}
		this.$.projectName.setValue(config.name);
		this.$.projectTitle.setValue(config.title);
		this.$.projectDescription.setValue(config.description);
		this.$.confirm.setDisabled(false);
		this.$.status.setContent(" ");
		return this ;
	},
	confirmTap: function(inSender, inEvent) {
		// retrieve modified values
		var obj = {
			name: this.$.projectName.getValue(),
			id: this.$.projectId.getValue(),
			title: this.$.projectTitle.getValue(),
			description: this.$.projectDescription.getValue()
		}
		this.doCustomConfigProject(obj);
		// handled here (don't bubble)
		return true;
	}
});

enyo.kind({
	name: "ProjectPropertiesPopup",
	kind: "onyx.Popup",
	modal: true, centered: true, floating: true, autoDismiss: false,
	handlers: {
		onCanceled: "hide"
	},
	components: [
		{kind: "ProjectProperties"}
	],
	reset: function() {
		this.$.projectProperties.reset();
	},
	preFillConfig: function(inData) {
		this.$.projectProperties.preFill(inData);
		return this ;
	},
});
