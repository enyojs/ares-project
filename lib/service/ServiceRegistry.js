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
		try {
			new enyo.Ajax({url: window.location.origin + '/res/services', handleAs: 'json'})
				.response(this, function(inSender, services) {
					this.saveServicesToStorage(services.filter(function(service){
						return service.active;
					}));
				}).go();
		} catch(e) {
			this.log("*** Unable to list workspace projects");
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
	}
});
