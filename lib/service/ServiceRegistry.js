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
		this.saveServicesToStorage(services);
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
			{name: "Local Files (PHP)", icon: "server",
				moniker: "Local Files", url: "../php/localFiles/files.php/"
			},
			{name: "Dropbox (localhost node)", icon: "server", type: "dropbox", url: "localhost:3000"}
		]
	}
});
