enyo.kind({
	name: "ServiceRegistry",
	debug: false,
	kind: enyo.Component,
	events: {
		onServicesChange: ""
	},
	components: [
		{name: "errorPopup", kind: "Ares.ErrorPopup"},
		{kind: "LocalStorage"}
	],
	published: {
		services: []
	},
	create: function() {
		this.inherited(arguments);
		if (!ServiceRegistry.instance) {
			ServiceRegistry.instance = this;
			this.reloadServices();
		}
	},
	listServices: function(inType) {
		if (this.services.length === 0) {
			this.reloadServices();
		} else {
			this.notifyServicesChange();
		}
	},
	serviceFailure: function(serviceType, serviceId) {
		this.error("type="+ serviceType + ", id=" + serviceId);
		this.reloadServices();
	},
	reloadServices: function() {
		if (this.debug) this.log("Refreshing the list of available services");
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE
		var url = origin + '/res/services';
		this.services = [];

		/* built-in services */

		// http://www.html5rocks.com/en/tutorials/file/filesystem/
		if (null /*window.requestFileSystem*/) {
			this.services.push({
				type: "filesystem",
				provider: "browser",
				name: "Browser Local Storage",
				icon: "server",
				moniker: "Browser Local Storage"
			});
		}

		/* Hermes Services (reload from the IDE server) */
		if (origin.match('^http')) {
			var req = new enyo.Ajax({url: url, handleAs: 'json'})
				.response(this, function(inSender, inValue) {
					var confs;
					if (inValue) {
						if (inValue.services && inValue.services[0]) {
							// dis-regard inactive service providers
							confs = inValue.services.filter(function(conf){
								return conf.active;
							});
							// instanciate active service providers
							enyo.forEach(confs, function(conf){
								var service = {
									conf: conf
								};
								if (conf.type === "filesystem" && conf.provider === "hermes") {
									// hermes type of services use
									// a common front-end
									service.impl = new HermesFileSystem();
									service.impl.notifyFailure = enyo.bind(this, this.serviceFailure, conf.type, conf.id);
									service.impl.setConfig(service.conf);
								} else if (conf.type === "build" && conf.provider === "hermes" && conf.id === "phonegap") {
									service.impl = new PhonegapBuild();
									service.impl.setConfig(service.conf);
								}
								this.services.push(service);
							}, this);
							this.completeServices(this.notifyServicesChange);
						}
					} else {
						this._handleReloadError("Empty response from Ares IDE Server");
					}
					if (this.debug) this.log(this.services);
				})
				.error(this, function(err){
					this._handleReloadError(err);
				})
				.go();
		}
		
	},
	/**
	 * Complete service configuration using localStorage
	 *
	 * Complement services loaded from the server with per-service
	 * data in the browser localStorage (for example the 'auth'
	 * property).
	 * @param {Function} next a CommonJS callback
	 * @private
	 */
	completeServices: function(next) {
		this.log(this.services);
		enyo.forEach(this.services, function(service) {
			this.$.localStorage.get([this.SERVICES_STORAGE_KEY, service.conf.id].join('.'), function(str) {
				if (this.debug) this.log("localStorage configuration for serviceId[" +
					 service.conf.id + "]: " + str);
				var obj;
				try {
					obj = JSON.parse(str);
				} catch(e) {
					obj = {};
				}
				enyo.mixin(service.conf, obj);
			}, this);
		}, this);
		enyo.bind(this, next)();
	},
	/**
	 * @private
	 */
	SERVICES_STORAGE_KEY: "com.enyojs.ares.services",
	/**
	 * Set the given value in the given serviceId configuration &
	 * save it in the localStorage, if applicable.
	 * @param {String} inServiceId
	 * @param {Object} inConfig
	 */
	setConfig: function (inServiceId, inConfig) {
		var service = this.resolveServiceId(inServiceId);
		if (!service) return;	// should we rather fail here?
		if (inConfig.auth && inConfig.auth !== service.conf.auth) {
			service.conf.auth = inConfig.auth;
			this.$.localStorage.set([this.SERVICES_STORAGE_KEY, service.conf.id].join('.'), JSON.stringify(service.conf)); // should not really care of the completion callback
		}
	},
	/**
	 * @param {String} serviceId
	 * @return {Object} service associated with the given serviceId
	 * @public
	 */
	resolveServiceId: function(serviceId) {
		return this.services.filter(function(service){
			return (serviceId === service.conf.id);
		}, this)[0];
	},
	/**
	 * Give services whose type matches the given one
	 * @param {String} type one of ['filesystem', 'build']
	 * @return {Array} services matching the required type
	 */
	getServicesByType: function(type) {
		var matches = this.services.filter(function(service){
			return (type === service.conf.type);
		}, this);
		var services = [];
		matches.forEach(function(match){
			services.push(match.impl);
		});
		return services;
	},
	/**
	 * @param {Object} service associated with the given serviceId
	 * @return {String} serviceId
	 * @public
	 */
	getServiceId: function(service) {
		for(var idx = 0; idx < this.services.length; idx++) {
			if (service === this.services[idx]) {
				return service.conf.id; 
			}
		}
		return undefined;
	},
	//* @private
	_handleReloadError: function(err) {
		this.$.errorPopup.setErrorMsg("Ares IDE Server returned an error");
		this.$.errorPopup.show();
		this.error("Error: "+JSON.stringify(err));
	},
	/**
	 * Notify every possible users of a change in the list of providers
	 * 
	 * For example, there might be many instances of the
	 * {ProvidersList} control (widget) in the application.
	 * 
	 * @private
	 */
	notifyServicesChange: function() {
		this.log("TX: onServicesChange");
		enyo.Signals.send("onServicesChange", {serviceRegistry: this});
	},
	statics: {
		instance: null
	}
});
