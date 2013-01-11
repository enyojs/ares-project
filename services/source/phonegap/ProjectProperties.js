/**
 * UI: PhoneGap pane in the ProjectProperties popup
 * @name Phonegap.ProjectProperties
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
		{content: "Targets:", components: [
			{kind: "onyx.Button", content: "Refresh...", ontap: "refresh"}
		]},
		{name: "targetsRows", kind: "FittableRows", classes: 'ares_projectView_switches'}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
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

		this.refresh();
	},
	getConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.targets, function(target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getConfig();
		}, this);

		if (this.debug) this.log("config:", this.config);
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		this.getProvider().authorize(enyo.bind(this, this.updateKeys));
	},
	/**
	 * @protected
	 */
	getProvider: function() {
		this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
		return this.provider;
	},
	/**
	 * @protected
	 */
	updateKeys: function(err) {
		if (this.debug) this.log("err:", err);
		if (err) {
		} else {
			enyo.forEach(this.targets, function(target) {
				var keys = this.getProvider().getKey(target.id);
				this.$.targetsRows.$[target.id].updateKeys(keys);
			}, this);
		}
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
		keys: {},
		config: {}
	},
	components: [
		{kind: "FittableColumns", components: [
			{kind: "onyx.InputDecorator", components: [
				{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
				{name: "targetLbl", content: ""},
				{name: "targetDrw", orient: "h", kind: "onyx.Drawer", open: false, components: [
					
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
		if (this.debug) this.log("id:", this.targetId, "config:", config);
		this.config = config;
		this.setEnabled(!!this.config);
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			 this.$.targetDrw.$.keySelector.setConfig(this.config.key);
		}
	},
	getConfig: function() {
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			this.config.key = this.$.targetDrw.$.keySelector.getConfig();
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
	updateKeys: function(keys) {
		if (this.debug) this.log("id:", this.targetId, "keys:", keys);

		if (keys &&
		    (this.targetId === 'android' ||
		     this.targetId === 'ios' ||
		     this.targetId === 'blackberry')) {
			if (this.$.targetDrw.$.keySelector) {
				this.$.targetDrw.$.keySelector.destroy();
			}
			this.$.targetDrw.createComponent({
				name: "keySelector",
				kind: "PhoneGap.ProjectProperties.KeySelector",
				targetId: this.targetId,
				keys: keys,
				activeKeyId: (this.config.key && this.config.key.id)
			});
			this.$.targetDrw.$.keySelector.render();
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
	name: "PhoneGap.ProjectProperties.KeySelector",
	debug: true,
	kind: "FittableColumns", 
	published: {
		targetId: "",
		keys: undefined,
		activeKeyId: "none"
	},
	events: {
		onManageKeys: ""
	},
	components: [
		{content: "Signing Key: "},
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
		{kind: "onyx.InputDecorator", showing: false, components: [
			{content: "Keystore:"},
			{name: "keystorePasswd", kind: "onyx.Input", type: "password", placeholder: "Password..."}
		]},
		{kind: "onyx.Button", content: "Manage...", ontap: "manage"}
	],
	create: function() {
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	setConfig: function(config) {
		if (!config) {
			this.setActiveKeyId('none');
		} else {
			this.setActiveKeyId(config.id);
		}
	},
	getConfig: function() {
		if (this.activeKeyId === 'none') {
			return undefined;
		} else {
			return this.keys[this.activeKeyId];
		}
	},
	/**
	 * @private
	 */
	keysChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.keys);
		this.keys = this.keys || {};
		this.keys.none = {id: "none", name: "None"};
		for (var id in this.keys) {
			this.$.keys.createComponent({
				name: id,
				content: this.keys[id].name,
				active: (id == this.activeKeyId)
			});
		}
		this.$.keys.render();
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.activeKeyId);
		if (this.targetId === 'ios' || this.targetId === 'blackberry') {
			// property name '.password' is defined by PhoneGap
			this.$.keyPasswd.setValue(this.keys[this.activeKeyId].password || "");
			this.$.keystorePasswd.hide();
		} else if (this.targetId === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by PhoneGap
			this.$.keyPasswd.setValue(this.keys[this.activeKeyId].key_pw || "");
			this.$.keystorePasswd.setValue(this.keys[this.activeKeyId].keystore_pw || "");
			this.$.keystorePasswd.show();
		}
	},
	/**
	 * @private
	 */
	selectKey: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		for (var id in this.keys) {
			if(this.keys[id].name === inValue.content) {
				this.setActiveKeyId(id);
				this.log("selected key:", this.keys[id]);
			}
		}
	},
	/**
	 * @private
	 */
	manage: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		this.doManageKeys({phonegap: {target: this.targetId}});
	}
});

