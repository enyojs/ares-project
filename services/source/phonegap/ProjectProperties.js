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
		{name: "targetsRows", kind: "FittableRows", classes: 'ares_projectView_switches'}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.config = {};
		this.targets = [
			{id: 'android',		name: "Google Android"},
			{id: 'ios',		name: "Apple iOS"},
			{id: 'winphone',	name: "Microsoft Windows Phone 7"},
			{id: 'blackberry',	name: "RIM Blackberry"},
			{id: 'webos',		name: "HP webOS 2"}
		];
		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.createComponent({
				name: target.id,
				kind: "PhoneGap.ProjectProperties.Target",
				targetId: target.id,
				targetName: target.name,
				enabled: false
			});
		}, this);
	},
	setConfig: function(config) {
		this.config = config;
		if (this.debug) this.log("config:", this.config);
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '' );
		this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};

		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.$[target.id].setConfig(this.config.targets[target.id]);
		}, this);
	},
	getConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.targets, function(target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getConfig();
		}, this);

		if (this.debug) this.log("config:", this.config);
		return this.config;
	}
});

/**
 * This widget is aware of the differences between the PhoneGap Build targets.
 */
enyo.kind({
	name: "PhoneGap.ProjectProperties.Target",
	debug: true,
	published: {
		targetId: "",
		targetName: "",
		enabled: "",
		targetKeys: {},
		config: {}
	},
	events: {
		onManageKeys: ""
	},
	components: [
		{kind: "FittableColumns", components: [
			{kind: "onyx.InputDecorator", components: [
				{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
				{name: "targetLbl", content: ""},
				{name: "targetDrw", orient: "h", kind: "onyx.Drawer", open: false, components: [
					{name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey", showing: false, components: [
						{kind: "onyx.PickerButton", content: "Choose Signing Key..."},
						{kind: "onyx.Picker", name: "targetKeys", components: [
						]},
						{kind: "onyx.Button", content: "Manage Keys...", ontap: "manageKeys"}
					]}
				]}
			]}
		]}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setConfig: function(config) {
		if (this.debug) this.log("config:", config);
		this.config = config;
		this.setEnabled(!!this.config);
		this.setTargetKeys(this.getProvider().getKey(this.targetId));

		// PhoneGap build uses apps signing keys for some
		// platforms only
		if (this.targetId === 'android' ||
		    this.targetId === 'ios' ||
		    this.targetId === 'blackberry') {
			this.$.keyPicker.show();
		}

		if (this.config && this.config.key && this.config.key.id) {
			this.$.targetKeys.$[this.config.key.id].setActive(true);
		}
	},
	getConfig: function() {
		return this.config;
	},
	/**
	 * @private
	 */
	getProvider: function() {
		this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
		return this.provider;
	},
	/**
	 * @private
	 */
	targetNameChanged: function(old) {
		if (this.debug) this.log(old, "->", this.enabled);
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function(old) {
		if (this.debug) this.log(old, "->", this.enabled);
		this.$.targetChkBx.setChecked(this.enabled);
		this.updateDrawer();
	},
	/**
	 * @private
	 */
	setTargetKeys: function(targetKeys) {
		// Remove any former key Component.  Do not use
		// Component#destroyComponents() to not destroy the
		// onyx.Picker Scroller.
		for (var id in this.targetKeys) {
			this.$.targetKeys.$[id].destroy();
		}

		// Create components for new keys
		this.targetKeys = targetKeys;
		this.log("targetKeys:", this.targetKeys);
		for (id in this.targetKeys) {
			this.$.targetKeys.createComponent({name: id, content: targetKeys[id].name});
		}
		this.$.targetKeys.render();
	},
	/**
	 * @private
	 */
	updateDrawer: function() {
		this.$.targetDrw.setOpen(this.$.targetChkBx.checked);
		this.config = this.$.targetChkBx.checked && this.config;
	},
	/**
	 * @private
	 */
	selectKey: function(inSender, inValue) {
		this.config.key = undefined;
		for (var id in this.targetKeys) {
			if(this.targetKeys[id].name === inValue.content) {
				this.config.key = this.targetKeys[id];
			}
		}
		this.log("selected key:", this.config.key);
	},
	/**
	 * @private
	 */
	manageKeys: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		this.doManageKeys({phonegap: {target: this.targetId}});
	}
});
