/* global ServiceRegistry, async, HermesFileSystem, Phonegap, GenZip, ares */
/**
 * Manages registered Hermes services
 * 
 * @class ServiceRegistry
 * @augments enyo.Component
 */
enyo.kind({
	name: "ServiceRegistry",
	debug: false,
	kind: "enyo.Component",
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
		ares.setupTraceLogger(this);
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
		this.trace("Refreshing the list of available services");
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
			new enyo.Ajax({url: url, handleAs: 'json'})
				.response(this, function(inSender, inValue) {
					var configs;
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
					this.trace(this.services);
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
	 * property).  The completion callback is invoked once every
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
				self.trace("localStorage[", key, "]...");
				Ares.LocalStorage.get(key, function(str) {
					self.trace("localStorage[", key, "] = ", str);
					var obj;
					try {
						obj = enyo.json.parse(str);
					} catch(e) {
						obj = {};
					}
					ares.extend(service.config, obj);

					// Add an helper function to check interfaces implemented by a service
					ares.extend(service, {
						implementsType: function(expected) {
							return enyo.filter(this.config.type, function(type) {
								return type === expected;
							}).length > 0;
						}
					});
					self.instanciate(service, cb);
				});
			};
		});
		async.series(tasks, next);
	},
	instanciate: function(service, next) {
		this.trace("id:", service.config.id, "config:", service.config);
		var self = this;
		try {
			if (service.config.pluginClient) {
				this.trace("Loading browser side code: ", service.config.pluginClient);
				enyo.load(service.config.pluginClient, function loaded() {
					self.trace("ServiceRegistry#instanciate(): Loaded browser side code: ", service.config.pluginClient);
					next();	// configuration will be applied later on
				});
			} else if (service.config.provider === 'hermes' && service.implementsType("filesystem")) {
				// hermes type of services use
				// a common front-end
				service.impl = new HermesFileSystem();
				service.impl.notifyFailure = enyo.bind(this, this.serviceFailure, service.config.type, service.config.id);
				service.impl.setOwner(this);
				this.configureService(service, next);
			} else if (service.implementsType("build") && service.config.id === "phonegap") {
				service.impl = new Phonegap.Build();
				service.impl.setOwner(this);
				this.configureService(service, next);
			} else if (service.implementsType("generate") && service.config.id === "genZip") {
				service.impl = new GenZip();
				service.impl.setOwner(this);
				this.configureService(service, next);
			} else {
				this.log("Ignoring service: " + service.config.id);
				next();
			}
		} catch(err) {
			this.error(err);
			next(err);
		}
	},
	configureService: function(service, next) {
		this.trace("id:", service.config.id, "config:", service.config);
		try {
			if (service.impl) {
				this.trace("id:", service.config.id, "created");
				// If the service does not define an
				// 'authorize()' entry point (which optionally
				// returns user acccount information), stub it
				// using a Common-JS pass-through.
				if (service.impl && !service.impl.authorize) {
					this.trace("Adding ", service.config.id, "#authorize() stub");
					service.impl.authorize = enyo.bind(service.impl, function(next) {
						this.trace('authorize(): stubbed');
						next(null, {});
					});
				}

				// Make sure both the service configuration
				// Object & the resulting implementation
				// Object know the serviceId.
				service.impl.id = service.config.id;

				try {
					service.impl.setConfig(service.config);
				} catch(pluginError) {
					var msg = "Unexpected error in setConfig() of service '" + service.config.id + "'";
					this.error(msg, pluginError);
					pluginError.msg = msg;
					throw pluginError;
				}
				this.trace("id:", service.config.id, "configured");
			} else {
				this.trace("Ignoring service: ", service.config.id);
			}
			next();
		} catch(err) {
			this.error("Unable to configure service '" + service.config.id + "':", err.stack);
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
		this.trace("serviceId:", inServiceId, "config:", inConfig);
		var service = this.resolveServiceId(inServiceId);
		if (!service) {
			return;	// should we rather fail here?
		}
		ares.extend(service.config, inConfig);
		service.setConfig(service.config);

		var key = [this.SERVICES_STORAGE_KEY, service.config.id].join('.');
		Ares.LocalStorage.set(key, enyo.json.stringify({auth: service.config.auth}), inCallback);
	},
	/**
	 * @param {String} serviceId
	 * @return {Object} service associated with the given serviceId
	 * @public
	 * @deprecated
	 * @see ServiceRegistry#filter
	 */
	resolveServiceId: function(serviceId) {
		var services = this.filter(function(service) {
			return service.config.id === serviceId;
		});
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
		return this.filter(function(service) {
			return service &&
				typeof service.implementsType === 'function' &&
				service.implementsType(type);
		});
	},
	/**
	 * Get {Array} or service matching the given criteria
	 * @param {Object} criteria
	 * @return {Array} services matching the required criteria
	 * @public
	 */
	filter: function(inFilterFunc, withNoImpl) {
		try {
			if (typeof inFilterFunc !== 'function') {
				throw new Error("Parameter 'inFilterFunc' must be a function");
			}
			withNoImpl = withNoImpl || false;
			var matches = enyo.filter(this.services, inFilterFunc, this);
			var services = [];
			this.trace("matches:", matches);
			enyo.forEach(matches, function(match){
				if (match.impl)  {
					services.push(match.impl);
				} else if (withNoImpl === true) {
					services.push(match);
				}
			}, this);
			this.trace("withNoImpl:", withNoImpl, " => services:", services);
			return services;
		} catch(error) {
			this.error("Unexpected error", error);
			return [];
		}
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
		this.error(err);
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
		this.trace("sending signal...");
		enyo.Signals.send("onServicesChange", {serviceRegistry: this});
	},
	/**
	 * Called by loaded plugins to complete registration in Ares
	 * @param {String} serviceId
	 * @param {Object} kindInformation the parameter for enyo.createComponent
	 * @param {Function} next commonJS callback
	 */
	pluginReady: function(serviceId, kindInformation, next) {
		this.trace("New plugin ready: ", serviceId);
		next = next || function(err) {
			if (err) {
				enyo.error(err);
			}
		};
		var services = this.filter(function(service) {
			return service.config.id === serviceId;
		}, true);
		if (services.length === 1) {
			var service = services[0];
			if (service.config.pluginClient &&  (! service.impl)) {
				try {
					service.impl = ServiceRegistry.instance.createComponent(kindInformation);
					service.impl.setOwner(this);
					this.configureService(service, next);
					this.trace("New plugin registered: ", serviceId);
					// FIXME: refactor notifyServicesChange() to carry only one service (like plugins).
					enyo.Signals.send("onPluginRegist", {pluginService: service.impl});
					this.notifyServicesChange();
				} catch(err) {
					this.error("Unexpected error while creating '" + kindInformation.kind + "' for service '" + serviceId + "': ", err.stack);
					next(err);
				}
			}
		}
	},
	statics: {
		instance: null
	}
});
