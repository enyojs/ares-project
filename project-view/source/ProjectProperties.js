/**
 * This kind provide a widget to tune project properties (phonegap
 * stuff included).
 *
 * By default, this widget is tuned for project modification.  In case
 * of project *creation*, the method setupCreate must be called after
 * construction. Since the widget is re-used between call for creation
 * or modification, the methos setupModif must be called also.
 */

enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: ""
	},
	createMode: true,

	components: [
		{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail", components: [
			{content: "Project", active: true, attributes: {title: 'project attributes...'}},
			{content: "PhoneGap", name: "phonegapTab", attributes: {title: 'phonegap build parameters...'}, showing: false},
			{content: "Preview", attributes: {title: 'project preview parameters...'}}
		]},
		{name: "projectDrawer", kind: "onyx.Drawer", open:true, components: [
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
				{tag: "tr" , components: [
					 {tag: "td" , content: "Author name: "},
					 {tag: 'td', attributes: {colspan: 1}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "projectAuthor",
								attributes: {title: "Vendor / Committer Name"}
							   }
						   ]}
					 ]},
					 {tag: "td" , content: "Contact: "},
					 {tag: 'td', attributes: {colspan: 2}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "projectContact",
								attributes: {title: "mail address or home page of the author"}
							   }
						   ]}
					 ]}
				]},
				{tag: "tr" , name:'directoryEntry', canGenerate:false, components: [
					 {tag: "td", content: "Directory: "},
					 {tag: 'td', attributes: {colspan: 3}, content: "", name: "projectDirectory" }
				]}
			]},
			{kind: "enyo.FittableColumns", components: [
				{components: [
					{tag: "span", content: "PhoneGap Build:"},
					{name: "phonegapCheckBox", kind: "onyx.Checkbox", onchange: "togglePhoneGap"}
				]}
			]}
		]},

		{name: "phonegapDrawer", kind: "onyx.Drawer", open: false, components: [
			{kind: "PhoneGap.ProjectProperties", name: "phonegap"}
		]},

		{name: "previewDrawer", kind: "onyx.Drawer", open: false, components: [
			{tag: 'table', components: [
				{tag: "tr" , components: [
					{tag: "td" , content: "top application file: "},
					{tag: 'td', attributes: {colspan: 1}, components:[
						{kind: "onyx.InputDecorator", components: [
							{kind: "Input", name: "ppTopFile",
							attributes: {title: 'top file of your application. Typically index.html'}
							}
						]}
					]}
				]}
			]}
		]},

		// FIXME: there should be an HTML/CSS way to avoid using FittableStuff...
		{kind: "FittableRows", style: "margin-top: 10px; width: 100%", fit: true, components: [
			{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "doDone"},
			{name: "ok", kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", ontap: "confirmTap"}
		]},

		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"}
	],

	debug: false,

	/**
	 * Tune the widget for project creation
	 */
	setupCreate: function() {
		//this.$.ok.setDisabled(true) ;
		this.$.directoryEntry.show() ;
	},

	/**
	 * Tune the widget for project modification
	 */
	setupModif: function() {
		//this.$.ok.setDisabled(true) ;
		this.$.directoryEntry.hide() ;
	},

	/**
	 * close one drawer and open the other depending on which radio button was tapped
	 */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			var status = {
				project: false,
				phonegap: false,
				preview: false
			} ;

			status[inEvent.originator.getContent().toLowerCase()] = true ;

			for (var drawer in status) {
				this.$[drawer + 'Drawer'].setOpen(status[drawer]) ;
			}
		}
	},

	togglePhoneGap: function(inSender, inEvent) {
		this.$.phonegapTab.setShowing(inEvent.originator.checked);
	},

	/**
	 * pre-fill the widget with configuration data
	 * @param {Object} config is configuration data (typically from project.json)
	 *  can be a json string or an object.
	 */
	preFill: function(inData) {
		this.config = typeof inData === 'object' ? inData : JSON.parse(inData) ;
		var conf = this.config ;
		var confDefault = ProjectConfig.PREFILLED_CONFIG_FOR_UI ;

		 // avoid storing 'undefined' in there
		this.$.projectId.     setValue(conf.id      || '' );
		this.$.projectVersion.setValue(conf.version || '' );
		this.$.projectName.   setValue(conf.name    || '' );
		this.$.projectTitle.  setValue(conf.title   || '' );

		if (! conf.author) { conf.author =  {} ;}
		this.$.projectAuthor. setValue(conf.author.name || '') ;
		this.$.projectContact.setValue(conf.author.href || '') ;

		this.$.phonegapTab.setShowing(conf.build.phonegap.enabled);
		this.$.phonegapCheckBox.setChecked(conf.build.phonegap.enabled);
		this.$.phonegap.setConfig(this.config.build.phonegap);

		if (! conf.preview ) {conf.preview = {} ;}
		this.$.ppTopFile.setValue(conf.preview.top_file);

		return this ;
	},

	confirmTap: function(inSender, inEvent) {
		var tglist, ppConf ;
		// retrieve modified values
		this.log('ok tapped') ;

		this.config.id       = this.$.projectId     .getValue();
		this.config.version  = this.$.projectVersion.getValue();
		this.config.name     = this.$.projectName   .getValue();
		this.config.title    = this.$.projectTitle  .getValue();

		this.config.author.name = this.$.projectAuthor.getValue();
		this.config.author.href = this.$.projectContact.getValue();

		this.config.build.phonegap = this.$.phonegap.getConfig();
		this.config.build.phonegap.enabled = this.$.phonegapCheckBox.checked;

		ppConf = this.config.preview ;
		ppConf.top_file = this.$.ppTopFile.getValue();

		// to be handled by a ProjectWizard
		this.doModifiedConfig({data: this.config}) ;

		this.doDone();

		if (inEvent.callBack) {
			inEvent.callBack() ;
		}

		// handled here (don't bubble)
		return true;
	}
});

