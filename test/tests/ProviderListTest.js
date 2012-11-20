enyo.kind({
	name: "ProviderListTest",
	kind: enyo.TestSuite,
	components: [
		{name: "serviceRegistry", kind: "ServiceRegistry"},	
		{name: "providerList", kind: "ProviderList"}
	],
	debug: false,
	/**
	 * test if there is at least one service stored into the ProviderList
	 */
	testGetCountInProviderList: function() {
		console.log("*****Ares Test***** Begin called in testGetCountInProviderList.")
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err){
			var c;
			if (err) {
				fail;
			} else {
				if (self.$.serviceRegistry.services.length === 0) {
					self.$.serviceRegistry.listServices;
				}
				self.$.providerList.$.list.count = self.$.serviceRegistry.services.length;
				c = self.$.providerList.$.list.count;
				if (self.debug) {	
					console.log("*****Ares Test***** Number of services listed into providerList: "+c);
				}
				self.finish(c ? "" : "no service listed in the providerList");
			}
		});
	}
});
