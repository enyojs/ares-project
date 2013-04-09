/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.ProjectProperties
 */

enyo.kind({
	name: "Phonegap.ProjectProperties",
	debug: false,
	published: {
		config: {}
	},
	events: {
		onConfigure: ""
	},
	components: [
		{kind: "FittableRows", components: [
			{classes:"ares-row", components :[
				{tag:"label", classes: "ares-label", content: "AppId:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", name: "pgConfId",
						attributes: {title: "unique identifier, assigned by build.phonegap.com"}
					}
				]},
				{tag:"label", classes: "ares-label", content: "Icon URL:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", name: "pgIconUrl",
						attributes: {title: "Relative location of the application icon. Defaults to Enyo icon."}
					}
				]}
			]}
		]},

		{content: "Targets:", components: [
			{ kind: "onyx.Toolbar", classes: "ares-toolbar", components: [
				{kind: "onyx.Button", content: "Refresh...", ontap: "refresh"},
				{kind: "onyx.Button", content: "Configure", ontap: "configure"}
			]}
		]},
		{name: "targetsRows", kind: "FittableRows", classes: 'ares_projectView_switches'}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.targets = Phonegap.ProjectProperties.platforms;
		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.createComponent({
				name: target.id,
				classes:"ares-row",
				kind: "Phonegap.ProjectProperties.Target",
				targetId: target.id,
				targetName: target.name,
				enabled: false
			});
		}, this);
	},
	setProjectConfig: function(config) {
		this.config = config;
		if (this.debug) this.log("config:", this.config);
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '' );
		this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};

		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.$[target.id].setProjectConfig(this.config.targets[target.id]);
		}, this);
		this.refresh();
	},
	getProjectConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.targets, function(target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getProjectConfig();
		}, this);
		
		if (this.debug) this.log("config:", this.config);
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var provider = Phonegap.ProjectProperties.getProvider();
		provider.authorize(enyo.bind(this, this.loadKeys));
	},
	/**
	 * @protected
	 */
	configure: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		this.doConfigure({id: 'phonegap'});
	},
	/**
	 * @protected
	 */
	loadKeys: function(err) {
		if (this.debug) this.log("err:", err);
		if (err) {
			this.warn("err:", err);
		} else {
			var provider = Phonegap.ProjectProperties.getProvider();
			enyo.forEach(this.targets, function(target) {
				this.$.targetsRows.$[target.id].loadKeys(provider);
			}, this);
		}
	},
	statics: {
		platforms: [
			{id: 'android',		name: "Google Android"},
			{id: 'ios',		name: "Apple iOS"},
			{id: 'winphone',	name: "Microsoft Windows Phone 7"},
			{id: 'blackberry',	name: "RIM Blackberry"},
			{id: 'webos',		name: "HP webOS 2"}
		],
		getProvider: function() {
			this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
			return this.provider;
		}
	}
});

/**
 * This widget is aware of the differences between the Phoneap Build targets.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Target",
	debug: false,
	published: {
		targetId: "",
		targetName: "",
		enabled: "",
		keys: {},
		config: {}
	},
	components: [
			{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
			{tag:"label", name: "targetLbl", classes:"ares-label", content: ""},
			{name: "targetDrw", orient: "v", kind: "onyx.Drawer", open: false, components: [
					
			]}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setProjectConfig: function(config) {
		if (this.debug) this.log("id:", this.targetId, "config:", config);
		this.config = config;
		this.setEnabled(!!this.config);
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			 this.$.targetDrw.$.keySelector.setActiveKeyId(this.config.keyId);
		}
	},
	getProjectConfig: function() {
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			this.config.keyId = this.$.targetDrw.$.keySelector.getActiveKeyId();
		}
		if (this.debug) this.log("id:", this.targetId, "config:", this.config);
		return this.config;
	},
	/**
	 * @private
	 */
	targetNameChanged: function(old) {
		//if (this.debug) this.log(old, "->", this.enabled);
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.enabled);
		this.$.targetChkBx.setChecked(this.enabled);
		this.updateDrawer();
		if (this.enabled) {
			this.config = this.config || {};
		} else {
			this.config = false;
		}
	},
	/**
	 * @protected
	 */
	loadKeys: function(provider) {
		if ((this.targetId === 'android' ||
		     this.targetId === 'ios' ||
		     this.targetId === 'blackberry')) {
			if (this.debug) this.log("id:", this.targetId);

			if (this.$.targetDrw.$.keySelector) {
				this.$.targetDrw.$.keySelector.destroy();
			}

			var keys = provider.getKey(this.targetId);
			if (this.debug) this.log("id:", this.targetId, "keys:", keys);
			if (keys) {
				this.$.targetDrw.createComponent({
					name: "keySelector",
					kind: "Phonegap.ProjectProperties.KeySelector",
					targetId: this.targetId,
					keys: keys,
					activeKeyId: (this.config && this.config.keyId)
				});
				this.$.targetDrw.$.keySelector.render();
				this.$.targetDrw.$.keySelector.setProvider(provider);
			}
		}
	},
	/**
	 * @private
	 */
	updateDrawer: function() {
		this.$.targetDrw.setOpen(this.$.targetChkBx.checked);
		this.setEnabled(this.$.targetChkBx.checked);
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "FittableRows",
	published: {
		targetId: "",
		keys: undefined,
		activeKeyId: undefined,
		provider: undefined
	},
	components: [
		{ classes:"ares-row ares-drawer", components: [
			{tag: "label", classes : "ares-bullet-label", content: "Signing Key: "},
			{name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey", components: [
				{kind: "onyx.PickerButton", content: "Choose..."},
				{kind: "onyx.Picker", name: "keys"}
			]},
			// android, ios & blackberry: key password
			{kind: "onyx.InputDecorator", components: [
				{content: "Key:"},
				{name: "keyPasswd", kind: "onyx.Input", type: "password", placeholder: "Password..."}
			]},
			// android-only: keystore password
			{kind: "onyx.InputDecorator", name: "keystorePasswdFrm", showing: false, components: [
				{content: "Keystore:"},
				{name: "keystorePasswd", kind: "onyx.Input", type: "password", placeholder: "Password..."}
			]},
			{kind: "onyx.Button", content: "Save", ontap: "savePassword"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	keysChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.keys);

		// Sanity
		this.keys = this.keys || [];

		// Make sure 'None' (id == -1) is always available
		if (enyo.filter(this.keys, function(key) {
			return key.id === undefined;
		})[0] === undefined) {
			this.keys.push({id: undefined, title: "None"});
		}

		// Fill
		enyo.forEach(this.keys, function(key) {
			this.$.keys.createComponent({
				name: key.id,
				content: key.title,
				active: (key.id === this.activeKeyId)
			});
		}, this);
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function(old) {
		var key = this.getKey(this.activeKeyId);
		if (this.debug) this.log("id:", this.targetId, old, "->", this.activeKeyId, "key:", key);
		if (key) {
			// One of the configured keys
			if (this.targetId === 'ios' || this.targetId === 'blackberry') {
				// property named '.password' is defined by Phonegap
				this.$.keyPasswd.setValue(key.password || "");
			} else if (this.targetId === 'android') {
				// properties named '.key_pw'and 'keystore_pw' are defined by Phonegap
				this.$.keyPasswd.setValue(key.key_pw || "");
				this.$.keystorePasswd.setValue(key.keystore_pw || "");
				this.$.keystorePasswdFrm.show();
			}
		}
	},
	/**
	 * @protected
	 */
	getKey: function(keyId) {
		if (keyId) {
			return enyo.filter(this.keys, function(key) {
				return key.id === keyId;
			}, this)[0];
		} else {
			return undefined;
		}
	},
	/**
	 * @private
	 */
	selectKey: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function(key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.log("selected key:", key);
			}
		}, this);
	},
	/**
	 * Return a signing key object from the displayed (showing === true) widgets
	 * @private
	 */
	getShowingKey: function() {
		var key = this.getKey(this.activeKeyId);
		if (!key) {
			return undefined;
		} else if (this.targetId === 'ios' || this.targetId === 'blackberry') {
			// property name '.password' is defined by Phonegap
			key.password = this.$.keyPasswd.getValue();
		} else if (this.targetId === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by Phonegap
			key.key_pw = this.$.keyPasswd.getValue();
			key.keystore_pw = this.$.keystorePasswd.getValue();
		}
		return key;
	},
	/**
	 * @private
	 */
	savePassword: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var key = this.getShowingKey();
		if (this.debug) this.log("targetId:", this.targetId, "key:", key);
		this.provider.setKey(this.targetId, key);
	}
});

