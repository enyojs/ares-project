enyo.kind({
	name: "ServiceRegistryTest",
	kind: enyo.TestSuite,
	components: [
		{name: "serviceRegistry", kind: "ServiceRegistry"}
	],
	debug: false,
	service: "home",
	/**
	* test if service id:"home" is regitrered into the ServiceRegistry
 	*/
	testGetHomeService: function(service) {
		var self = this;
		console.log("*****Ares Test***** Begin called in testGetHomeService.");
		this.$.serviceRegistry._reloadServices(function(err){
			var s;
			if (err) {
				fail;
			} else {
				s = self.$.serviceRegistry.resolveServiceId(self.service);
				if (self.debug) {
					console.log("*****Ares Test***** HomeService:");
					console.dir(JSON.stringify(s));					
				}
				self.finish(self.$.serviceRegistry.getServiceId(s) ? "" : "no '" + self.service + "' service registered");
			}
		});
	}
});
