enyo.kind({
	name: "ServiceRegistry",
	kind: enyo.Component,
	events: {
		onServicesReceived: "",
		onServicesChange: ""
	},
	components: [
		{kind: "LocalStorage"},
		{kind: "Signals", onServicesChange: "servicesChange"}
	],
	serviceProfileKey: "com.palm.ares.server.conf.services",
	confDateKey: "com.palm.ares.server.conf.mtime",
	published: {
		services: {},
		mtime: 0
	},
	listServices: function(inType) {
		this.fetchServicesFromStorage();
	},
	resetProfile: function() {
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE
		var url = origin + '/conf';
		try {
			new enyo.Ajax({url: url, handleAs: 'json'})
				.response(this, function(inSender, conf) {
					this.log("conf=" + JSON.stringify(conf));
					if (conf.services && conf.services[0] && conf.mtime > 0) {
						this.services = conf.services.filter(function(service){
							return service.active;
						});
						this.mtime = conf.mtime;
						this.saveServicesToStorage();
					}
				}).go();
		} catch(e) {
			this.log("*** Unable to list storage services available on the server");
		}
	},
	fetchServicesFromStorage: function() {
		try {
			this.mtime = enyo.json.parse(this.$.localStorage.get(this.confDateKey));
			this.services = enyo.json.parse(this.$.localStorage.get(this.serviceProfileKey));
			this.doServicesChange(this.services);
		} catch(x) {
			this.resetProfile();
		}
	},
	saveServicesToStorage: function() {
		this.$.localStorage.put(this.serviceProfileKey, enyo.json.stringify(this.services));
		this.$.localStorage.put(this.confDateKey, enyo.json.stringify(this.mtime));
		// signal all ServiceRegistry components that the shared store has changed
		this.doServicesReceived(this.services);
	},
	servicesChange: function(inSender, inPayload) {
		// notify our user if the services store has changed
		this.doServicesChange(inPayload);
	}
});
