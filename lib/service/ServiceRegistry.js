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
	serviceProfileKey: "hermesProfiles",
	listServices: function(inType) {
		this.fetchServicesFromStorage();
	},
	resetProfile: function() {
		var services = ServiceRegistry.defaultServices;
		try {
			new enyo.Ajax({url: window.location.origin + '/res/config', handleAs: 'json'})
				.response(this, function(inSender, config) {
					services.push({name: "Local Files (localhost node)", icon: "server", moniker: "Local Files", url: "https://localhost:"+config.port, useJsonp: false});
					this.saveServicesToStorage(services);
				}).go();
		} catch(e) {
			this.log("*** Unable to get local files server port");
			this.saveServicesToStorage(services);
		}
	},
	fetchServicesFromStorage: function() {
		try {
			var services = enyo.json.parse(this.$.localStorage.get(this.serviceProfileKey));
			this.doServicesReceived(services);
		} catch(x) {
			this.resetProfile();
		}
	},
	saveServicesToStorage: function(inServices) {
		this.$.localStorage.put(this.serviceProfileKey, enyo.json.stringify(inServices));
		// signal all ServiceRegistry components that the shared store has changed
		this.dispatchServicesChange(inServices);
	},
	dispatchServicesChange: function(inServices) {
		// signal all ServiceRegistry components that the shared store has changed
		enyo.Signals.send("onServicesChange", inServices);
		//enyo.dispatch({type: "servicesChange", services: inServices});
	},
	servicesChange: function(inSender, inPayload) {
		// notify our user if the services store has changed
		this.doServicesChange(inPayload);
	},
	statics: {
		defaultServices: [
			{name: "Dropbox (enyojs.com)", icon: "server", type: "dropbox", url: "http://184.169.139.5:8080", useJsonp: false}
		]
	}
});
