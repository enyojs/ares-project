enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onCustomConfigProject: "",
		onCancelSettings: "",
		onSaveGeneratedXml: "",
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
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "doCancelSettings"},
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
		var pjson= JSON.parse(inData);
		if (pjson.name !== undefined) {
			this.$.projectId.setValue("com.example."+pjson.name);
		} else
			this.$.projectId.setValue("com.example.myapp");
		this.$.projectName.setValue(pjson.name);
		if (pjson.phonegapbuild !== undefined) {
			this.$.targetBuild.setValue(pjson.phonegapbuild.target);
			this.$.phonegapKey.setValue(pjson.phonegapbuild.key);
		}
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
	generate: function(inData) {
		var props = inData.properties;
		var pgap = props.phonegapbuild;
		var strXml = null;
		var xw = new XMLWriter('UTF-8');
		xw.indentation = 4;
		xw.writeStartDocument();
			xw.writeStartElement( 'widget' );
				xw.writeAttributeString('xmlns','http://www.w3.org/ns/widgets');
				xw.writeAttributeString('xmlns:gap','http://phonegap.com/ns/1.0');
				xw.writeAttributeString('format', props.format);
				xw.writeAttributeString('id', props.id);
				xw.writeAttributeString('version',props.version);
				xw.writeComment('');
				xw.writeElementString('name', 'PhoneGap Application:'+props.name);
				xw.writeComment('');
				xw.writeElementString('description', 'Getting started with PhoneGap development and build.phonegap.com');
				xw.writeComment('');
				xw.writeStartElement('gap:platforms');
				xw.writeElementString('name', pgap.target);
				xw.writeEndElement();
			xw.writeEndElement();
		//xw.writeEndDocument(); called by flush()
		strXml = xw.flush();
		if (this.debug) console.log(xw.flush());

		this.doSaveGeneratedXml({folderId: inData.folderId, configXML:strXml}); 
	}
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
	generateConfigXML: function(inData) {
		this.$.projectProperties.generate(inData);
	}
});
