/* jshint indent: false */ // TODO: ENYO-3311
/* global ares */
/**
 * This kind provide a widget to tune global properties
 */

enyo.kind({
	name: "AresProperties",
	classes: "enyo-unselectable ares-classic-popup",
	kind:"onyx.Popup",
	fit: true,
	modal: true, 
	centered: true,
	floating: true,
	autoDismiss: false,
	events: {
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: ""
	},	

	components: [
		{classes:"title left-align", components:[
			{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail", classes:"ares-radio-group", components: []}
		]},
		{kind: "onyx.Toolbar", name: "toolbarId", classes:"bottom-toolbar", components: [
			{name: "ok", classes:"right", kind: "onyx.Button", content: "Close", ontap: "confirmTap"}
		]},
		{kind: "Signals", onPluginRegist: "handlePluginRegist"}
	],

	debug: false,
	pluginServicesList:[],
	/**
	 * @protected
	 */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.createAresAboutDrawer();
	},

	/**
	 * @private
	 */
	createAresAboutDrawer: function() {
		var aresAboutTabEntry = {
			id: "aresAbout",
			name: "Ares",
			kind: "AboutAresPanel",
			components:[{content:"Ares", classes:"large-fixed"},{tag:"span", classes:"ares-bottom-check"}]
		};
		this.createComponentTab(aresAboutTabEntry);
	}, 

	/**
	 * Create a tab to display basic informations about Ares or embeeded plugins
	 * 
	 * @param  {Object} inTabEntry object that define the name of the tab thumbnail & drawer
	 *                             and the kind of the tab panel.
	 * @private
	 */
	createComponentTab: function(inTabEntry) {
		var drawer = this.createComponent({
			name: inTabEntry.id + 'Drawer',
			kind: "onyx.Drawer",
			open: false
		},{addBefore: this.$.toolbarId});

		inTabEntry.panel = drawer.createComponent({
			name: inTabEntry.id,
			kind: inTabEntry.kind,
			mainToolbar: false //TO DO MAKE USE OF KIND PARAMS GENERIC
		});

		inTabEntry.tab = this.$.thumbnail.createComponent({
			name: inTabEntry.id + 'Tab',
			content: inTabEntry.name,
			componentId: inTabEntry.id,
			showing: true,
			active: true,
			components:inTabEntry.components
		});
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
		this.createComponentTab(pluginService);
		this.pluginServicesList.push(pluginService);
	},

	// /**
	//  * close one drawer and open the other depending on which radio button was tapped
	//  */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			enyo.forEach(inEvent.originator.parent.children, function(tab) {
				var activate = (tab.componentId === inEvent.originator.componentId);
				this.$[tab.componentId + 'Drawer'].setOpen(activate);
			}, this);
		}
	},

	confirmTap: function(inSender, inEvent) {
		for(var index in this.pluginServicesList){
			var pluginId = this.pluginServicesList[index].id;
			if(typeof this.$[pluginId+'Drawer'].$[pluginId].okButtonAction === 'function'){
				this.$[this.pluginServicesList[index].id+'Drawer'].$[pluginId].okButtonAction();
			}
		}
		this.hide();
	}	
});

enyo.kind({
	name: "AboutAresPanel",
	kind: "enyo.Scroller",
	fit: "true",
	classes: "ares-about-drawer",
	published: {
		config: {},
		aboutAresData: undefined
	},
	events: {
		onError: ""
	},
	components: [
		{name: "errorMessage", content: "Error: Unable to load Ares About data from Ares IDE Server", showing: false},
		{	
			kind: "FittableRows",
			name: "aboutDescription",
				components: [
					{
						kind:"FittableColumns", 
						components: [
							{content: "Ares version: ", classes: "ares-about-description"},
							{name: "versionValue"}
						]
					},
					{
						kind:"FittableColumns", 
						components: [				
							{content: "In case of issue, please consider ", classes: "ares-about-description"},
							{name: "brValue", kind: "enyo.Control", tag: "a", content: "Reporting a bug", attributes: {"target": "_blank"}}
						]
					},
					{
						kind:"FittableColumns", 
						components: [				
							{content: "See ", classes: "ares-about-description"},
							{name: "homeValue", kind: "enyo.Control", tag: "a", content: "Project Homepage", attributes: {"target": "_blank"}}				
						]
					},
					{
						kind:"FittableColumns", 
						components: [				
							{content: "License: ", classes: "ares-about-description"},
							{name: "license", classes: "ares-about-description"}
						]
					}
				]
		}
	],
	
	/**
	 * @protected
	 */
	create: function(){
		this.inherited(arguments);
		this.reqAboutAresData();

	},

	/**
	 * Send an AJAX request to the  Backend in order to get the needed data for the Ares description.
	 * @private
	 */
	reqAboutAresData: function(){
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE

		var req = new enyo.Ajax({
			url: origin + '/res/aboutares'
		});

		req.response(this, function(inSender, inData) {	
			this.setAboutAresData(inData.aboutAres);
		});

		//Show the error in a Pop-up.
		req.error(this, function(inSender, inError){
			
			this.doError({msg: "Unable to load data about Ares", err: inError});
			this.$.errorMessage.show();
			this.$.aboutDescription.hide();
		});
		
		req.go();
	},
	
	/**
	 * @private
	 */
	aboutAresDataChanged: function(){
		this.$.versionValue.content = this.aboutAresData.version;
		this.$.brValue.setAttribute("href", this.aboutAresData.bugReportURL);
		this.$.homeValue.setAttribute("href", this.aboutAresData.projectHomePage);
		this.$.license.content = this.aboutAresData.license;
	}	
});

enyo.kind({
	name: "AboutAres",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	classes:"ares-classic-popup",
	published: {
		config: {},
		aboutAresData: undefined
	},
	events: {
		onError: ""
	},
	components: [
		{tag: "div", name: "title", classes:"title", content: "About"},
		{kind: "enyo.Scroller",  classes: "ares-small-popup", /*fit: true,*/ components: [
			{classes:"ares-small-popup-details", name:"popupContent", components:[
				{kind: "FittableRows", name: "aboutDescription", components: [
					{kind:"FittableColumns", components: [
						{content: "Ares version: ", classes: "ares-about-description"},
						{name: "versionValue"}
					]},
					{kind:"FittableColumns", components: [				
						{content: "In case of issue, please consider ", classes: "ares-about-description"},
						{name: "brValue", kind: "enyo.Control", tag: "a", content: "Reporting a bug", attributes: {"target": "_blank"}}
					]},
					{kind:"FittableColumns", components: [				
						{content: "See ", classes: "ares-about-description"},
						{name: "homeValue", kind: "enyo.Control", tag: "a", content: "Project Homepage", attributes: {"target": "_blank"}}				
					]},
					{kind:"FittableColumns", components: [				
						{content: "License: ", classes: "ares-about-description"},
						{name: "license", classes: "ares-about-description"}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", name: "buttons", components: [
			{name:"cancelButton", classes:"right", kind: "onyx.Button", content: "Close", ontap: "actionClose"}
		]},
		{name: "errorMessage", content: "Error: Unable to load Ares About data from Ares IDE Server", showing: false},
	],
	
	/**
	 * @protected
	 */
	create: function(){
		this.inherited(arguments);
		this.reqAboutAresData();

	},

	/**
	 * Send an AJAX request to the  Backend in order to get the needed data for the Ares description.
	 * @private
	 */
	reqAboutAresData: function(){
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE

		var req = new enyo.Ajax({
			url: origin + '/res/aboutares'
		});

		req.response(this, function(inSender, inData) {	
			this.setAboutAresData(inData.aboutAres);
		});

		//Show the error in a Pop-up.
		req.error(this, function(inSender, inError){
			
			this.doError({msg: "Unable to load data about Ares", err: inError});
			this.$.errorMessage.show();
			this.$.aboutDescription.hide();
		});
		
		req.go();
	},
	
	/**
	 * @private
	 */
	aboutAresDataChanged: function(){
		this.$.versionValue.content = this.aboutAresData.version;
		this.$.brValue.setAttribute("href", this.aboutAresData.bugReportURL);
		this.$.homeValue.setAttribute("href", this.aboutAresData.projectHomePage);
		this.$.license.content = this.aboutAresData.license;
	},
	actionClose: function(inSender, inEvent) {
		this.hide();
		return true;
	},	
});
