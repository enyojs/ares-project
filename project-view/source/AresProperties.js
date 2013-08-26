/* global ares */
/**
 * This kind provide a widget to tune global properties
 */

enyo.kind({
	name: "AresProperties",
	classes: "enyo-unselectable",
	kind:"onyx.Popup",
	fit: true,
	modal: true, centered: true, floating: true, autoDismiss: false,
	events: {
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: ""
	},	

	components: [
		{kind: "aboutAresPanel"},
		{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail"},
		{name: "toolbarId", classes: "ares-right-toolbar", kind: "onyx.Toolbar", components: [
			{name: "ok", kind: "onyx.Button", content: "OK", ontap: "confirmTap"}
		]},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"},
		{kind: "Signals", onPluginRegist: "handlePluginRegist"}
	],

	debug: false,
	
	/**
	 * @protected
	 */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	},

	/**
	 * Receive the {onPluginRegist} broadcast notification
	 * @param {Object} inEvent.pluginService
	 */
	handlePluginRegist: function(inSender, inEvent) {
		this.trace("");

		if (typeof inEvent.pluginService.getAresPropertiesKind !== 'function') {
			return true;
		}
		
		var pluginService = {
			id: inEvent.pluginService.id,
			name: inEvent.pluginService.getName() || inEvent.pluginService.id,
			kind: inEvent.pluginService.getAresPropertiesKind()
		};

		var drawer = this.createComponent({
			name: pluginService.id + 'Drawer',
			kind: "onyx.Drawer",
			open: false
		},{addBefore: this.$.toolbarId});

		pluginService.panel = drawer.createComponent({
			name: pluginService.id,
			kind: pluginService.kind
		});

		pluginService.tab = this.$.thumbnail.createComponent({
			name: pluginService.id + 'Tab',
			content: pluginService.name,
			pluginServiceId: pluginService.id,
			showing: true,
			active: true
		});
	},

	// /**
	//  * close one drawer and open the other depending on which radio button was tapped
	//  */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			enyo.forEach(inEvent.originator.parent.children, function(tab) {
				var activate = (tab.pluginServiceId === inEvent.originator.pluginServiceId);
				this.$[tab.pluginServiceId+ 'Drawer'].setOpen(activate);
			}, this);
		}
	},

	confirmTap: function(inSender, inEvent) {
		this.hide();
	}
	
});

enyo.kind({
	name: "aboutAresPanel",
	kind: "FittableRows",
	published: {
		config: {},
		aboutAresData: undefined
	},
	components: [
		{
			kind:"FittableColumns", 
			components: [
				{content: "Version: "},
				{name: "versionValue"}
			]
		},
		{
			kind:"FittableColumns", 
			components: [
				{name: "brValue", kind: "enyo.Control", tag: "a", content: "Report a Bug", attributes: {"target": "_blank"}}
			]
		},
		{
			kind:"FittableColumns", 
			components: [
				{name: "phpValue", kind: "enyo.Control", tag: "a", content: "Project Repository", attributes: {"target": "_blank"}}				
			]
		},
		{
			kind:"FittableColumns", 
			components: [
				{content: "License: "},
				{name: "license"}
			]
		}
	],

	create: function(){
		this.inherited(arguments);
		this.getAboutAresData();		
	},

	getAboutAresData: function(){
		var req = new enyo.Ajax({
			url: 'http://127.0.0.1:9009/res/aboutares'
		});

		req.response(this, function(inSender, inData) {		
			this.setAboutAresData(inData.aboutAres);
			this.aboutAresDataChanged();
		});

		//TODO: manage the error more properly.
		req.error(function(){this.log("Request Error")});
		
		req.go();
	},

	aboutAresDataChanged: function(){
		this.$.versionValue.content = this.aboutAresData.version;
		this.$.brValue.setAttribute("href", this.aboutAresData.bugReportURL);
		this.$.phpValue.setAttribute("href", this.aboutAresData.projectHomePage);
		this.$.license.content = this.aboutAresData.license;
	}	
});
