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
		onCancel: "",
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
			{kind: "onyx.ToggleButton", name: 'pgConfEnabled', onContent: "enabled", offContent: "disabled"},
			{tag: 'table', attributes: {'class': 'ares_projectView_table'}, components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "AppId: "},
					 {tag: 'td', attributes: {colspan: 3}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "pgConfId", placeholder: "com.example.myapp",
								attributes: {title: "unique identifier, assigned by build.phonegap.com"}
							   }
						   ]}
					 ]}
				]},
				{tag: "tr" , components: [
					 {tag: 'td', content: "PhoneGap targets", attributes: {colspan: 3}}
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", name: 'androidTarget', onContent: "Android", offContent: "Android"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", name: 'iosTarget', onContent: "Ios", offContent: "Ios"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", name: 'winphoneTarget', onContent: "Winphone", offContent: "Winphone"}
					]}
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", name: 'blackberryTarget', onContent: "Blackberry", offContent: "Blackberry"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", name: 'webosTarget',onContent: "Webos", offContent: "Webos"}
					]}
				]}
			]}
		]},

		// FIXME: there should be an HTML/CSS way to avoid using FittableStuff...
		{kind: "FittableRows", style: "margin-top: 10px; width: 100%", fit: true, components: [
			{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "doCancel"},
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

	/**
	 * pre-fill the widget with configuration data
	 * @param {Object} config is configuration data (typically from project.json)
	 *  can be a json string or an object. 
	 */
	preFill: function(inData) {
		this.log(inData) ;
		var config = typeof inData === 'object' ? inData : JSON.parse(inData) ;
		var pgConf ;
		var pgTarget ;

		this.$.projectId.setValue(config.id);
		this.$.projectVersion.setValue(config.version);
		this.$.projectName.setValue(config.name);
		this.$.projectTitle.setValue(config.title);

		if (config.build && config.build.phonegap) {
		    pgConf = config.build.phonegap ;
			this.$.pgConfEnabled.setValue(pgConf.enabled);
			this.$.pgConfId.setValue(pgConf.appId);
			
			if (pgConf.targets) {
				for (pgTarget in pgConf.targets ) {
					this.$[ pgTarget + 'Target' ].setContent(pgConf.targets[pgTarget]) ;
				}
			}
		}
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
		onCancel: "hide"
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
