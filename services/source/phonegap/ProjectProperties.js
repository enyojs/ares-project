/**
 * Phonegap -- ProjectProperties
 */

enyo.kind({
	name: "PhoneGap.ProjectProperties",
	published: {
		config: {}
	},
	components: [
			{tag: 'table', components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "AppId: "},
					 {tag: 'td', attributes: {colspan: 1}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "pgConfId",
								attributes: {title: "unique identifier, assigned by build.phonegap.com"}
							   }
						   ]}
					 ]},
					 {tag: "td" , content: "Icon URL: "},
					 {tag: 'td', attributes: {colspan: 2}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "pgIconUrl",
								attributes: {title: "Relative location of the application icon. Defaults to Enyo icon."}
							   }
						   ]}
					 ]}
				]}
			]},
			{content: "Targets:"},
			{
				kind: "FittableRows", attributes: {'class': 'ares_projectView_switches'},
				components: [
					{kind: "onyx.ToggleButton", name: 'androidTarget', onContent: "Android", offContent: "Android"},
					{kind: "onyx.ToggleButton", name: 'iosTarget', onContent: "Ios", offContent: "Ios"},
					{kind: "onyx.ToggleButton", name: 'winphoneTarget', onContent: "Winphone", offContent: "Winphone"},
					{kind: "onyx.ToggleButton", name: 'blackberryTarget', onContent: "Blackberry", offContent: "Blackberry"},
					{kind: "onyx.ToggleButton", name: 'webosTarget',onContent: "Webos", offContent: "Webos"}
				]
			}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.properties = {};
	},
	setConfig: function(config) {
		this.config = config;
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '' );
		this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};
		// pgTarget is a key of object pgConf.targets
		for (var pgTarget in this.config.targets ) {
			this.$[ pgTarget + 'Target' ].setValue(this.config.targets[pgTarget]) ;
		}

	},
	getConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		var tglist = ['android','ios','winphone','blackberry','webos'] ;
		for (var i in tglist) {
			this.log('copy data from ' + tglist[i] +'Target') ;
			if (this.$[ tglist[i] + 'Target' ].getValue()) {
				this.config.targets[tglist[i]] = {};
			} else {
				this.config.targets[tglist[i]] = false;
			}
		}

		return this.config;
	}
});

enyo.kind({
	name: "ProjectProperties.PhoneGap.Target",
	published: {
		targetId: "",
		targetName: ""
	},
	components: [
	],
	create: function() {
		this.inherited(arguments);
	}
});
