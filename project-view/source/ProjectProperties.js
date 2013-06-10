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
	debug: false,
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: "",
		onSelectPreviewTopFile: ""
	},
	classes:"ares-classic-popup",
	components: [
		{classes:"title left-align", content:"Project properties", components:[
			{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail", classes:"ares-radio-group", components: [
				{serviceId: "project", active: true, attributes: {title: 'project attributes...'}, components:[{classes:"large-fixed", content:"Project"},{tag:"span", classes:"ares-bottom-check"}]},
				{serviceId: "preview", attributes: {title: 'project preview parameters...'}, components:[{classes:"large-fixed", content:"Preview"},{tag:"span", classes:"ares-bottom-check"}]}
			]},
		]},
		{name: "projectDrawer", kind: "onyx.Drawer", open:true, components: [		
			{classes:"ares-project-properties",components:[
				{kind:"FittableColumns", components: [
					{kind:"FittableRows", components: [
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content: "Name: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectName"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content:"Version: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectVersion", placeholder:"0.0.1"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content:"Author name: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", name: "projectAuthor", attributes: {title: "Vendor / Committer Name"}, placeholder:"My Company"}
							]}

						]},
						{classes:"ares-row", name: "templatesEntry", showing: false, components: [
							{tag:"label", classes:"ares-fixed-label ares-small-label", content:"Template:"},
							{kind: "onyx.PickerDecorator", fit: true, components: [
								{name: "templateButton", classes:"very-large-width", kind: "onyx.PickerButton", fit: true},
								{kind: "onyx.FlyweightPicker", name: "templatePicker", components: [
									{name: "template"}
								], onSetupItem: "templateSetupItem", onSelect: "templateSelected"}
							]}
						]}
					]},
					{kind:"FittableRows", components: [
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content: "Title: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectTitle", placeholder:"My Example App"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content:"Id: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectId",
								attributes: {title: "Application ID in reverse domain-name format: com.example.apps.myapp"}, placeholder:"com.example.apps.myapp"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag:"label", classes : "ares-fixed-label ares-small-label", content:"Contact: "},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", name: "projectContact",
									attributes: {title: "mail address or home page of the author"}, placeholder:"support@example.com"
								}
							]}
						]}
					]}
				]},
				{name:'directoryEntry', canGenerate:false, components: [
					{content: "Directory: "},
					{content: "", name: "projectDirectory" }
				]},
				{tag:"p", classes:"break"},
				{kind: "enyo.FittableColumns", classes:"ares-row", name: "servicesList"}
			]}
		]},
		{name: "previewDrawer", kind: "onyx.Drawer", open: false, components: [
			{classes:"ares-project-properties",components:[
				{kind: 'FittableRows', components: [
					{classes:"ares-row", components:[
						{tag: "label" , classes:"ares-fixed-label", content: "Top application file: "},
						{kind: "onyx.InputDecorator", components: [
							{kind: "Input", name: "ppTopFile", ontap: "doSelectPreviewTopFile",
								attributes: {title: 'top file of your application. Typically index.html'}
							}
						]}
					]}
				]}
			]}
		]},
		{name: "toolbarId", kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{kind: "onyx.Button", content: "Cancel", ontap: "doDone"},
			{name: "ok", kind: "onyx.Button", content: "OK", classes:"right", ontap: "confirmTap"}
		]},

		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	published: {
		topFile: ""
	},

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
		this.services = enyo.clone(this.services) || {};
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
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			var drawer = this.$[service.id + 'Drawer'] || this.createComponent({
				name: service.id + 'Drawer',
				kind: "onyx.Drawer",
				open: false
			},{
				addBefore: this.$.toolbarId
			});
			service.panel = drawer.$[service.id] || drawer.createComponent({
				name: service.id,
				kind: service.kind
			});
			service.tab = this.$.thumbnail.$[service.id + 'Tab'] || this.$.thumbnail.createComponent({
				name: service.id + 'Tab',
				serviceId: service.id,
				showing: false,
				components:[{content:service.name, classes:"large-fixed"},{tag:"span", classes:"ares-bottom-check"}]
			});
			var frame = this.$.servicesList.$[service.id + 'Frame'];
			if (typeof frame !== 'object') {
				frame = this.$.servicesList.createComponent({
					name: service.id + 'Frame'
				});
				frame.createComponent({
					kind: 'onyx.Checkbox',
					name: service.id + 'CheckBox',
					onchange: 'toggleService',
					serviceId: service.id
				}, {
					owner: this
				});
				frame.createComponent({
					tag: 'label',
					classes: 'ares-label',
					content: service.name
				});
			}
			service.checkBox = this.$[service.id + 'CheckBox'];

			// Take the project configuration into account
			// to show the service or not
			this.showService(serviceId);
		}, this);
		if (this.debug) this.log("services:", this.services);
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
		this.$.templatesEntry.show();
	},

	/**
	 * Tune the widget for project modification
	 */
	setupModif: function() {
		this.$.directoryEntry.hide() ;
		this.$.templatesEntry.hide();
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
		var conf = typeof inData === 'object' ? inData : JSON.parse(inData);
		conf = ProjectConfig.checkConfig(conf);
		this.config =  conf;

		 // avoid storing 'undefined' in there
		this.$.projectId.     setValue(conf.id      || '' );
		this.$.projectVersion.setValue(conf.version || '' );
		this.$.projectName.   setValue(conf.name    || '' );
		this.$.projectTitle.  setValue(conf.title   || '' );

		if (! conf.author) { conf.author =  {} ;}
		this.$.projectAuthor. setValue(conf.author.name || '') ;
		this.$.projectContact.setValue(conf.author.href || '') ;

		// Load each provider service configuration into its
		// respective ProjectProperties panel
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			this.showService(serviceId);
		}, this);

		if (! conf.preview ) {conf.preview = {} ;}
		this.$.ppTopFile.setValue(conf.preview.top_file);

		return this ;
	},

	update: function(inData) {
		var conf = this.config ;

		enyo.forEach(enyo.keys(inData), function(key) {
			conf[key] = inData[key];
		});
		this.$.projectId.     setValue(conf.id      || '' );
		this.$.projectVersion.setValue(conf.version || '' );
		this.$.projectTitle.  setValue(conf.title   || '' );

		return this ;
	},


	showService: function(serviceId) {
		var service = this.services[serviceId];
		var config = this.config && this.config.providers &&
			    this.config.providers[serviceId];
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

		// Dump each provider service configuration panel into
		// the project configuration.
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			this.config.providers[service.id] = service.panel.getProjectConfig();
			this.config.providers[service.id].enabled = service.checkBox.checked;
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
	},
	topFileChanged: function() {
		this.$.ppTopFile.setValue(this.topFile);
	}
});
