enyo.kind({
	name: "ServiceRegistry",
	debug: false,
	kind: enyo.Component,
	events: {
		onServicesChange: ""
	},
	components: [
		{name: "errorPopup", kind: "Ares.ErrorPopup"}
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
		var self = this;
		this._reloadServices(function(err) {
			if (err) {
					self._handleReloadError(err);
			} else {
					self.notifyServicesChange();
			}
		});
	},
	/**
	 * @private
	 */
	_reloadServices: function(next) {
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
					var configs, self = this;
					if (inValue) {
						if (inValue.services && inValue.services[0]) {
							// dis-regard inactive service providers
							configs = inValue.services.filter(function(config){
								return config.active;
							});
							enyo.forEach(configs, function(config){
								this.services.push({
									config: config
								});
							}, this);
							this.complete(next);
						}
					} else {
						next(new Error("Empty response from Ares IDE Server"));
					}
					if (this.debug) this.log(this.services);
				})
				.error(this, function(err){
					next(err);
				})
				.go();
		}
		
	},
	/**
	 * Complete services configuration using localStorage
	 *
	 * Complement services loaded from the server with per-service
	 * data in the browser localStorage (for example the 'auth'
	 * property).  The completion vallbaclk is invoked once every
	 * configured services are completed.
	 * 
	 * @param {Function} next a CommonJS callback
	 * @private
	 */
	complete: function(next) {
		var self = this,
		    tasks = enyo.map(this.services, function(service){
			return function(cb) {
				var key = [self.SERVICES_STORAGE_KEY, service.config.id].join('.');
				if (self.debug) self.log("localStorage[" + key + "]...");
				Ares.LocalStorage.get(key, function(str) {
					if (self.debug) self.log("localStorage[" + key + "] = ", str);
					var obj;
					try {
						obj = JSON.parse(str);
					} catch(e) {
						obj = {};
					}
					ares.extend(service.config, obj);
					self.instanciate(service, cb);
				});
			};
		});
		async.parallel(tasks, next);
	},
	instanciate: function(service, next) {
		if (this.debug) this.log("id:", service.config.id, "config:", service.config);
		try {
			if (service.config.type === "filesystem" && service.config.provider === "hermes") {
				// hermes type of services use
				// a common front-end
				service.impl = new HermesFileSystem();
				service.impl.notifyFailure = enyo.bind(this, this.serviceFailure, service.config.type, service.config.id);
				this.configureService(service, next);
			} else if (service.config.type === "build" && service.config.provider === "hermes" && service.config.id === "phonegap") {
				service.impl = new Phonegap.Build();
				this.configureService(service, next);
			} else if (service.config.type === "other" && service.config.provider === "hermes" && service.config.id === "prj-toolkit") {
				service.impl = new ProjectToolkit();
				this.configureService(service, next);
			} else if (service.config.type === "plugin") {
				if (this.debug) this.log("Loading browser side code: " + service.config.plugin.browsercode);
				enyo.load(service.config.plugin.browsercode, function() {
					if (this.debug) this.log("LOADED browser side code: " + service.config.plugin.browsercode);
				}.bind(this));
				next();		// configuration will be applied later on
			} else {
				if (this.debug) this.log("Ignoring service: " + service.config.id);
				next();
			}
		} catch(err) {
			this.error(err);
			next(err);
		}
	},
	configureService: function(service, next) {
		if (this.debug) this.log("id:", service.config.id, "config:", service.config);
		try {
			if (service.impl) {
				if (this.debug) this.log("id:", service.config.id, "created");
				// If the service does not define an
				// 'authorize()' entry point (which optionally
				// returns user acccount information), stub it
				// using a Common-JS pass-through.
				if (service.impl && !service.impl.authorize) {
					if (this.debug) this.log("Adding " + service.config.id + "#authorize() stub");
					service.impl.authorize = enyo.bind(service.impl, function(next) {
						if (this.debug) this.log('authorize(): stubbed');
						next(null, {});
					});
				}

				// Make sure both the service configuration
				// Object & the resulting implementation
				// Object know the serviceId.
				service.impl.id = service.config.id;

				service.impl.setConfig(service.config);
				if (this.debug) this.log("id:", service.config.id, "configured");
			} else {
				if (this.debug) this.log("Ignoring service: " + service.config.id);
			}
			next();
		} catch(err) {
			this.error(err);
			next(err);
		}
	},
	/**
	 * @private
	 */
	SERVICES_STORAGE_KEY: "com.enyojs.ares.services",
	/**
	 * Set the given value in the given serviceId configuration
	 * 
	 * Update the living instances & save the modified
	 * configuration in the localStorage, if applicable.
	 *
	 * Today, only auth part of the given config object is saved
	 * to localStorage.
	 * @param {String} inServiceId
	 * @param {Object} inConfig
	 * @param {Function} inCallback a CommonJS callback
	 */
	setConfig: function (inServiceId, inConfig, inCallback) {
		if (this.debug) this.log("serviceId:", inServiceId, "config:", inConfig);
		var service = this.resolveServiceId(inServiceId);
		if (!service) return;	// should we rather fail here?
		ares.extend(service.config, inConfig);
		service.setConfig(service.config);

		var key = [this.SERVICES_STORAGE_KEY, service.config.id].join('.');
		Ares.LocalStorage.set(key, JSON.stringify({auth: service.config.auth}), inCallback);
	},
	/**
	 * @param {String} serviceId
	 * @return {Object} service associated with the given serviceId
	 * @public
	 * @deprecated
	 * @see ServiceRegistry#filter
	 */
	resolveServiceId: function(serviceId) {
		var services = this.filter({properties: ['id'], id: serviceId});
		return services && services[0];
	},
	/**
	 * Give services whose type matches the given one
	 *
	 * If type is not provided or falsy, this method returns every
	 * registered & active services.
	 *
	 * @param {String} type one of ['filesystem', 'build', undefined]
	 * @return {Array} services matching the required type
	 * @public
	 * @deprecated
	 * @see ServiceRegistry#filter
	 */
	getServicesByType: function(type) {
		return this.filter({properties: ['type'], type: type});
	},
	/**
	 * Get {Array} or service matching the given criteria
	 * @param {Object} criteria
	 * @return {Array} services matching the required criteria
	 * @public
	 */
	filter: function(criteria, withNoImpl) {
		withNoImpl = withNoImpl || false;
		//if (this.debug) this.log("criteria:", criteria, ", services:", this.services);
		var matches = enyo.filter(this.services, function(service){
			var match = true;
			if (criteria &&
			    criteria.properties &&
			    criteria.properties.length &&
			    criteria.properties[0]) {
				enyo.forEach(criteria.properties, function(prop) {
					if (criteria[prop]) {
						// filter on criteria property value
						match = match && (service.config[prop] === criteria[prop]);
					} else {
						// filter on criteria property presence
						match = match && (service.config[prop] !== undefined);
					}
				}, this);
			}
			//if (this.debug) this.log("match:", match, "<= service:", service.config);
			return match;
		}, this);
		var services = [];
		//if (this.debug) this.log("matches:", matches);
		enyo.forEach(matches, function(match){
			if (match.impl)  {
				services.push(match.impl);
			} else if (withNoImpl === true) {
				services.push(match);
			}
		}, this);
		if (this.debug) this.log("withNoImpl:", withNoImpl, "criteria:", criteria , " => services:", services);
		return services;
	},
	/**
	 * Calls the given callback for each instanciated service
	 * 
	 * The service implementation instance is the first & only
	 * parameter of the callback.
	 * 
	 * @param {Function} fn the callback
	 * @return nothing
	 */
	forEach: function(fn) {
		enyo.forEach(this.services, function(service) {
			if (service.impl) {
				fn(service.impl);
			}
		}, this);
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
		if (this.debug) this.log("sending signal...");
		enyo.Signals.send("onServicesChange", {serviceRegistry: this});
	},
	pluginReady: function(id, impl) {
		if (this.debug) this.log("New plugin ready: " + id);
		var services = this.filter({properties: ['id'], id: id}, true);
		var error = true;
		if (services.length === 1) {
			var service = services[0];
			if (service.config.type === 'plugin' && ( ! service.impl)) {
				error = false;
				service.impl = impl;
				impl.setConfig(service.config);
				if (this.debug) this.log("New plugin registered: " + id);
			}
		}

		if (error) {
			if (this.debug) this.log("Unexpected plugin ready request for: " + id);
		}
	},
	statics: {
		instance: null
	}
});
