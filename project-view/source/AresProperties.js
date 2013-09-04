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
		{kind: "onyx.Toolbar", classes: "ares-right-toolbar", components: [
			{content: "About"}
		]},
		{name: "thumbnail", kind: "onyx.RadioGroup", onActivate: "switchDrawers"},
		{name: "toolbarId", classes: "ares-right-toolbar", kind: "onyx.Toolbar", components: [
			{name: "ok", kind: "onyx.Button", content: "OK", ontap: "confirmTap"}
		]},
		{kind: "Signals", onPluginRegist: "handlePluginRegist"}
	],

	debug: false,
	
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
			kind: "AboutAresPanel"
		};
		this.createAboutTab(aresAboutTabEntry);
	}, 

	/**
	 * Create a tab to display basic informations about Ares or embeeded plugins
	 * 
	 * @param  {Object} inTabEntry object that define the name of the tab thumbnail & drawer
	 *                             and the kind of the tab panel.
	 * @private
	 */
	createAboutTab: function(inTabEntry) {
		var drawer = this.createComponent({
			name: inTabEntry.id + 'Drawer',
			kind: "onyx.Drawer",
			open: false
		},{addBefore: this.$.toolbarId});

		inTabEntry.panel = drawer.createComponent({
			name: inTabEntry.id,
			kind: inTabEntry.kind
		});

		inTabEntry.tab = this.$.thumbnail.createComponent({
			name: inTabEntry.id + 'Tab',
			content: inTabEntry.name,
			componentId: inTabEntry.id,
			showing: true,
			active: true
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
		this.createAboutTab(pluginService);		
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
		this.hide();
	}
	
});

enyo.kind({
	name: "AboutAresPanel",
	kind: "FittableRows",
	published: {
		config: {},
		aboutAresData: undefined
	},
	events: {
		onError: ""
	},
	components: [
		{name: "errorMessage", content: "Error: Unable to load Ares About data from Ares IDE Server", showing: false},
		{	kind: "FittableRows",
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
							{content: "If you encounter any bug please report it in the following link ", classes: "ares-about-description"},
							{name: "brValue", kind: "enyo.Control", tag: "a", content: "Report a bug", attributes: {"target": "_blank"}}
						]
					},
					{
						kind:"FittableColumns", 
						components: [				
							{content: "We would welcome any contribution you can come with ", classes: "ares-about-description"},
							{name: "homeValue", kind: "enyo.Control", tag: "a", content: "Project Homepage", attributes: {"target": "_blank"}}				
						]
					},
					{
						kind:"FittableColumns", 
						components: [				
							{content: "Copyright: ", classes: "ares-about-description"},
							{name: "license", classes: "ares-about-description"},
							{ content: " all rights reserved"}
						]
					}
				]
			}
	],
	
	/**
	 * private
	 */
	create: function(){
		this.inherited(arguments);
		this.getAboutAresData();

	},

	/**
	 * Send an AJAX request to the  Backend in order to get the needed data for the Ares description.
	 * @rprivate
	 */
	getAboutAresData: function(){
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE

		var req = new enyo.Ajax({
			url: origin + '/res/aboutares'
		});

		req.response(this, function(inSender, inData) {	
			this.setAboutAresData(inData.aboutAres);
		});

		//Show the error in a Pop-up.
		req.error(this, function(inSender, inError){
			
			this.doError({msg: "("+inError +") Unable to load Ares About data", err: inError});
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
