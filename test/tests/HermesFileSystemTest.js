enyo.kind({
	name: "HermesFileStemTest",
	kind: ares.TestSuite,
	//timeout: 20 * 1000,
	components: [
		{name: "serviceRegistry", kind: "ServiceRegistry"},
		{name: "hermesFileSystem", kind: "HermesFileSystem"}
	],
	debug: true,
	selectedService: "home",
	folderId: "%2FAresTests",
	nameToCreate: "source",
	nodeToRemove: "%2FAresTests%2Fsource",
	fileToCreate: "App.js",

	/**
	* reload Home service
	*/
	testGetHomeFromServices: function() {
		console.log("*****Ares Test***** Begin called in testGetHomeFromServices.");
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err) {
			var service;
			if (err) {
				self.finish("no services loaded!");
			} else {
				if (self.$.serviceRegistry.services) {
					service = self.$.serviceRegistry.services.filter(function(s) {
						if (self.debug) {
							enyo.log("*****Ares Test***** s.conf.id: "+s.conf.id);
						}
						return s.conf.id === self.selectedService;
					});

					if(service.length !== 1) {
						self.finish("No Home service found.");
					} else {
						self.finish();
					}
				}
			}
		});
	},
	/**
	* HermesFileSystem API
	*/
	testPropfindAndCreateFolder: function() {
		console.log("*****Ares Test***** Begin called in testPropfindAndCreateFolder.");
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err) {
			var service;
			if (err) {
				self.finish("no services loaded!");
			} else {
				if (self.$.serviceRegistry.services) {
					service = self.$.serviceRegistry.services.filter(function(s) {
						return s.conf.id === self.selectedService;
					});
					/**
					*	PROPFIND verb used to listFiles of a folderId
					*/
					var req = service[0].impl.propfind(self.folderId, 1);
					req.response(self, function(inSender, inResponse) {
						var prj = inResponse.children.filter(function(node){
							return node.name === self.nameToCreate;
						});
						if (prj.length !== 0) {
							self.finish("folder already exists.");
						} else {
							/**
							* MKCOL verb 
							*/
							var req2 = service[0].impl.createFolder(self.folderId, self.nameToCreate);
							req2.response(function(inSender, inResponse) {
								enyo.log(inResponse);
								self.finish();
							});
						}
					});
					req.error(self, function(inSender, inError) {
							enyo.log(inError);
							self.finish("propfind create folder error: "+inError);
					});
				}
			}
		});
	},

	testPropfindAndCreateFile: function() {
		console.log("*****Ares Test***** Begin called in testPropfindAndCreateFile.");
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err) {
			var service;
			if (err) {
				self.finish("no services loaded!");
			} else {
				if (self.$.serviceRegistry.services) {
					service = self.$.serviceRegistry.services.filter(function(s) {
						return s.conf.id === self.selectedService;
					});
					/**
					*	PROPFIND verb used to listFiles of a folderId
					*/
					var req = service[0].impl.propfind(self.folderId, 1);
					req.response(self, function(inSender, inResponse) {
						var prj = inResponse.children.filter(function(node){
							return node.name === self.nameToCreate;
						});
						if (prj.length !== 0) {
							var content = {
								title: "created by the test suite"
							};
							/**
							* PUT Verb
							*/
							var req2 = service[0].impl.createFile(self.nodeToRemove, self.fileToCreate, content);
							req2.response(self, function(inSender, inResponse) {
								enyo.log(inResponse);
								self.finish();
							});
							req2.error(self, function(inSender, inError) {
								enyo.log(inError);
								self.finish("create File error: "+inError);
							});
						}
					});					
					req.error(self, function(inSender, inError) {
							enyo.log(inError);
							self.finish("propfind create file error: "+inError);
					});
				}
			}
		});
	},
	testDeleteFile: function() {
		console.log("*****Ares Test***** Begin called in testDeleteFile.");
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err) {
			var service;
			if (err) {
				self.finish("no services loaded!");
			} else {
				if (self.$.serviceRegistry.services) {
					service = self.$.serviceRegistry.services.filter(function(s) {
						return s.conf.id === self.selectedService;
					});
					/**
					*	PROPFIND verb used to listFiles of a folderId
					*/
					var req = service[0].impl.propfind(self.nodeToRemove, 1);
					req.response(self, function(inSender, inResponse) {
						var prj = inResponse.children.filter(function(node){
							return node.name === self.fileToCreate;
						});
						if (prj.length !== 0) {
							/**
							* DELETE verb
							*/
							var req2 = service[0].impl.remove(prj[0].id);;
							req2.response(self, function(inSender, inResponse) {
								enyo.log(inResponse);
								self.finish();
							});
							req2.error(self, function(inSender, inError) {
								enyo.log(inError);
								self.finish("create File error: "+inError);
							});
						}
					});					
					req.error(self, function(inSender, inError) {
							enyo.log(inError);
							self.finish("propfind create file error: "+inError);
					});
				}
			}
		});
	},
	testDeleteFolder: function() {
		console.log("*****Ares Test***** Begin called in testDeleteFolder.");
		var self = this;
		this.$.serviceRegistry._reloadServices(function(err) {
			var service;
			if (err) {
				self.finish("no services loaded!");
			} else {
				if (self.$.serviceRegistry.services) {
					service = self.$.serviceRegistry.services.filter(function(s) {
						return s.conf.id === self.selectedService;
					});
					/**
					*	PROPFIND verb used to listFiles of a folderId
					*/
					var req = service[0].impl.propfind(self.folderId, 1);
					req.response(self, function(inSender, inResponse) {
						var prj = inResponse.children.filter(function(node){
							return node.name === self.nameToCreate;
						});
						if (prj.length !== 0) {
							/**
							* DELETE verb
							*/
							var req = service[0].impl.remove(prj[0].id);
							req.response(self, function(inSender, inResponse) {
								enyo.log(inResponse);
								self.finish();
							});
							req.error(self, function(inSender, inError) {
								enyo.log(inError);
								self.finish("delete Folder error: "+inError);
							});
						}
					});					
					req.error(self, function(inSender, inError) {
							enyo.log(inError);
							self.finish("propfind delete folder error: "+inError);
					});
				}
			}
		});
	}
});