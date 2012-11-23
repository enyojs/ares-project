/**
 * This kind provide a widget to tune project properties (phonegap
 * stuff included).
 * 
 * By default, this widget is tuned for project modification.  In case
 * of project *creation*, the method setup_create must be called after
 * construction.
 */
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
		{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail", components: [
			{content: "Project", active: true, attributes: {title: 'project attributes...'}},
			{content: "PhoneGap", attributes: {title: 'phonegap build parameters...'}}
		]},
		{name: "projectDrawer", kind: "onyx.Drawer", open:true, components: [
			{content: "Project", tag:"h2"},
			{tag: 'table', components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "Name: "},
					 {tag: 'td', components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectName"}
						  ]}
					 ]},
					 {tag: 'td', content: "Title: "},
					 {tag: "td" , components: [
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectTitle"}
						   ]}
					  ]}
				]},
				{tag: "tr" , components: [
					 {tag: "td" , content: "Version: "},
					 {tag: 'td', components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectVersion"}
						  ]}
					 ]},
					 {tag: 'td', content: "Id: "},
					 {tag: "td" , components: [
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectId", 
								attributes: {title: "Application ID in reverse domain-name format: com.example.apps.myapp"}}
						   ]}
					  ]}
				]},
				{tag: "tr" , name:'directoryEntry', canGenerate:false, components: [
					 {tag: "td", content: "Directory: "},
					 {tag: 'td', attributes: {colspan: 3}, content: "", name: "projectDirectory" }
				]}
			]}
		]},
		// FIXME: use true for debug
		{name: "phoneGapDrawer", kind: "onyx.Drawer", open: false, components: [
			{content: "PhoneGap", tag:"h2"},
			{kind: "onyx.ToggleButton", onContent: "enabled", offContent: "disabled", onChange: "togglePhonegap"},
			{tag: 'table', attributes: {'class': 'ares_projectView_table'}, components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "AppId: "},
					 {tag: 'td', attributes: {colspan: 3}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "phonegapId", placeholder: "com.example.myapp"}
						   ]}
					 ]}
				]},
				{tag: "tr" , components: [
					 {tag: 'td', content: "PhoneGap targets", attributes: {colspan: 3}}
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Android", offContent: "Android", onChange: "togglePhonegapTarget"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Ios", offContent: "Ios", onChange: "togglePhonegapTarget"}
					]},
					{tag: "td" , components: [

						  {kind: "onyx.ToggleButton", onContent: "Winphone", offContent: "Winphone", onChange: "togglePhonegapTarget"}
					]}
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Blackberry", offContent: "Blackberry", onChange: "togglePhonegapTarget"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Webos", offContent: "Webos", onChange: "togglePhonegapTarget"}
					]}
				]}
			]}
		]},

		// FIXME: there should be an HTML/CSS way to avoid using FittableStuff...
		{kind: "FittableRows", style: "margin-top: 10px; width: 100%", fit: true, components: [
			{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "doCanceled"},
			{name: "ok", kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", ontap: "createProject"}
		]},

		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"}
	],

	debug: false,

	/**
	 * Tune the widget for project creation
	 */
	setup_create: function() {
		this.$.ok.setDisabled(true) ;
		this.$.directoryEntry.show() ;
	},

	/**
	 * close one drawer and open the other depending on which radio button was tapped
	 */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			if (inEvent.originator.getContent() === "Project") {
				this.$.projectDrawer.setOpen(true) ;
				this.$.phoneGapDrawer.setOpen(false) ;
			}
			else {
				this.$.projectDrawer.setOpen(false) ;
				this.$.phoneGapDrawer.setOpen(true) ;
			}
		}
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
		// FIXME: creation? this.$.confirm.setDisabled(false);
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
