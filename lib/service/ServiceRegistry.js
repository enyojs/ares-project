enyo.kind({
	name: "ServiceRegistry",
	kind: enyo.Component,
	events: {
		onServicesChange: ""
	},
	components: [
		{name: "errorPopup", kind: "onyx.Popup", modal: true, centered: true, floating: true, components: [
			{tag: "h3", content: "Oh, no!"},
			{content: "Ares IDE Server returned an error"}
		]}
	],
	published: {
		services: []
	},
	create: function() {
		this.inherited(arguments);
		this.reloadServices();
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
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE
		var url = origin + '/res/services';
		var ws;
		this.services = [];
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
								if (conf.type === "hermes") {
									// hermes type of services use
									// a common front-end
									service.impl = new HermesService();
									service.impl.notifyFailure = this.serviceFailure.bind(this, conf.type, conf.id);
									service.impl.setConfig(service.conf);
								}
								this.services.push(service);
							}, this);
							this.notifyServicesChange();
						}
					} else {
						this._handleReloadError("Empty response from Ares IDE Server");
					}
				})
				.error(this, function(err){
					this._handleReloadError(err);
				})
				.go();
		}
		
		// http://www.html5rocks.com/en/tutorials/file/filesystem/
		if (window.requestFileSystem) {
			ws = new WebSandboxService();
			ws.impl.setConfig({size: 1024*1024});
			this.services.push({
				type: "html5fs",
				id: "html5fs",
				name: "Web Sandbox",
				icon: "local",
				moniker: "Browser Local Storage",
				impl: ws
			});
		}
	},
	/**
	 * @param {String} serviceId
	 * @return {Object} service associated with the given serviceId
	 * @public
	 */
	resolveServiceId: function(serviceId) {
		// TODO rather use Array.filter()
    		for(var idx = 0; idx < this.services.length; idx++) {
    			var service = this.services[idx];
    			if (serviceId === service.conf.id) {
    				return service; 
    			}
    		}
    		return undefined;
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
	}
});
