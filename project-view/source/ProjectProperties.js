/**
 * This kind provide a widget to tune project properties
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
			{content: "Project", serviceId: "project", active: true, attributes: {title: 'project attributes...'}},
			{content: "Preview", serviceId: "preview", attributes: {title: 'project preview parameters...'}}
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
			{kind: "enyo.FittableColumns", name: "servicesList"},
			{kind: "enyo.FittableColumns", components: [
				{kind: "Control", content: "Template:"},
				{kind: "onyx.PickerDecorator", fit: true, components: [
					{name: "templateButton", kind: "onyx.PickerButton", fit: true},
					{kind: "onyx.FlyweightPicker", name: "templatePicker", components: [
						{name: "template"}
					], onSetupItem: "templateSetupItem", onSelect: "templateSelected"}
				]}
			]}
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

		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],

	debug: false,
	templates: [],
	TEMPLATE_NONE: "NONE",
	selectedTemplate: undefined,

	services: {},

	/**
	 * Receive the {onServicesChange} broadcast notification
	 * @param {Object} inEvent.serviceRegistry
	 */
	handleServicesChange: function(inSender, inEvent) {
		if (this.debug) this.log();
		this.services = this.services || {};
		inEvent.serviceRegistry.forEach(enyo.bind(this, function(inService) {
			var service = {
				id: inService.id,
				name: inService.getName() || inService.getId(),
				kind: inService.getProjectPropertiesKind && inService.getProjectPropertiesKind()
			};
			if (this.debug) this.log("service:", service);
			if (service.kind) {
				this.services[service.id] = service;
			}
		}));
		if (this.debug) this.log("services:", this.services);
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			var drawer = this.$[service.id + 'Drawer'] || this.createComponent({
				name: service.id + 'Drawer',
				kind: "onyx.Drawer",
				open: false
			});
			service.panel = drawer.$[service.id] || drawer.createComponent({
				name: service.id,
				kind: service.kind
			});
			service.tab = this.$.thumbnail[service.id + 'Tab'] || this.$.thumbnail.createComponent({
				name: service.id + 'Tab',
				content: service.name,
				serviceId: service.id,
				showing: false
			});
			this.$.servicesList.createComponent({
				name: service.id + 'Frame'
			});
			if (!service.frame) {
				service.frame = this.$.servicesList.$[service.id + 'Frame'];
				service.frame.createComponent({
					tag: 'span',
					content: service.name
				});
				service.checkBox = service.frame.createComponent({
					kind: 'onyx.Checkbox',
					name: service.id + 'CheckBox',
					onchange: 'toggleService',
					serviceId: service.id
				}, {
					owner: this
				});
			}

			// Take the project configuration into account
			// to show the service or not
			this.showService(serviceId);
		}, this);
	},
	/**
	 * Toggle a service panel
	 */
	toggleService: function(inSender, inEvent) {
		var serviceId = inEvent.originator.serviceId,
		    checked = inEvent.originator.checked;
		this.log("serviceId:", serviceId, 'checked:', checked);
		var service = this.services[serviceId];
		if (service.tab) {
			service.tab.setShowing(checked);
		}
	},
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
			enyo.forEach(inEvent.originator.parent.children, function(tab) {
				var activate = (tab.serviceId === inEvent.originator.serviceId);
				this.$[tab.serviceId + 'Drawer'].setOpen(activate);
			}, this);
		}
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

		// Load each builder service configuration into its
		// respective ProjectProperties panel
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			this.showService(serviceId);
		}, this);

		if (! conf.preview ) {conf.preview = {} ;}
		this.$.ppTopFile.setValue(conf.preview.top_file);

		return this ;
	},

	showService: function(serviceId) {
		var service = this.services[serviceId];
		var config = this.config && this.config.build &&
			    this.config.build[serviceId];
		var enabled = config && config.enabled;
		service.checkBox.setChecked(enabled);
		service.tab.setShowing(enabled);
		if (config) {
			service.panel.setProjectConfig(config);
		}
	},

	confirmTap: function(inSender, inEvent) {
		var tglist, ppConf ;
		// retrieve modified values

		this.config.id       = this.$.projectId     .getValue();
		this.config.version  = this.$.projectVersion.getValue();
		this.config.name     = this.$.projectName   .getValue();
		this.config.title    = this.$.projectTitle  .getValue();

		this.config.author.name = this.$.projectAuthor.getValue();
		this.config.author.href = this.$.projectContact.getValue();

		// Dump each builder service configuration panel into
		// the project configuration.
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			this.config.build[service.id] = service.panel.getProjectConfig();
			this.config.build[service.id].enabled = service.checkBox.checked;
		}, this);

		ppConf = this.config.preview ;
		ppConf.top_file = this.$.ppTopFile.getValue();

		// to be handled by a ProjectWizard
		this.doModifiedConfig({data: this.config, template: this.selectedTemplate}) ;

		this.doDone();

		if (inEvent.callBack) {
			inEvent.callBack() ;
		}

		// handled here (don't bubble)
		return true;
	},
	setTemplateList: function(templates) {
		this.$.templateButton.applyStyle("width", "20em");
		this.templates = [this.TEMPLATE_NONE];
		enyo.forEach(templates, function(item) {
			this.templates.push(item.id);
		}, this);
		this.$.templatePicker.setCount(this.templates.length);
		this.$.templatePicker.setSelected(0);
		this.selectedTemplate = undefined;
	},
	templateSetupItem: function(inSender, inEvent) {
		this.$.template.setContent(this.templates[inEvent.index]);
		return true;
	},
	templateSelected: function(inSender, inEvent) {
		if (inEvent.content === this.TEMPLATE_NONE) {
			this.selectedTemplate = undefined;
		} else {
			this.selectedTemplate = inEvent.content;
		}
	}
});
