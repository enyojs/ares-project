

enyo.kind({
	name: "HermesFileSystemTest",
	kind: "Ares.TestSuite",
	debug: true,

	dirToCreate: "TestRunner",
	fileToCreate: "App.js",

	registry: null,
	services: null,
	home: null,

	create: function () {
		this.inherited(arguments);
		//enyo.log("create()");
		this.services = HermesFileSystemTest.services;
		this.home = HermesFileSystemTest.home;
	},
	/**
	* get Services from Registry
	*/
	testGetServicesFromRegistry: function() {
		enyo.log("Begin called in testGetServicesFromRegitry.");
		this.registry = ServiceRegistry.instance;
		this.registry._reloadServices(enyo.bind(this, "cbReloadServices"));

	},
	cbReloadServices: function(inError) {
		enyo.log("Begin called in cbReloadServices.");
		if (inError) {
			this.finish("No services loaded!");
		} else {
			this.services = this.registry.services;
			HermesFileSystemTest.services = this.services;
			if (this.debug) {
				this.log("HermesFileSystemTest.services: ", HermesFileSystemTest.services);
			}
			if(this.services.length > 0) {
				this.finish();
			} else {
				this.finish("No Home service found.");
			}
		}
	},
	/**
	* get Home service from services
	*/
	testGetHomeFromServices: function() {
		enyo.log("Begin called in testGetHomeFromServices.");
		var h = this.services.filter(function(s) {
			if (this.debug) {
				enyo.log("service.conf.id: "+s.conf.id);
			}
			return s.config.id === "home";
		});
		if (this.debug) {
			this.log("home service: ", h);
		}
		this.home = h;
		HermesFileSystemTest.home = this.home;
		if(h.length > 0) {
			this.finish();
		} else {
			this.finish("No Home service found.");
		}
	},
	/**
	* HermesFileSystem API
	*/
	testPropfindOrCreateFolder: function() {
		enyo.log("Begin called in testPropfindOrCreateFolder.");
		var service = this.home[0];
		if (this.debug) enyo.log("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* MKCOL - want to create test/root/TestRunner directory
			* if test/root/TestRunner exists first delete it
			*/
				var req2 = service.impl.createFolder(inResponse.id, this.dirToCreate);
				req2.response(function(inSender, inResponse) {
					if (self.debug) enyo.log("Got the inResponse for req2: ", inResponse);
					self.finish();
				});
				req2.error(this, function(inSender, inError) {
					enyo.log(inError);
					self.finish("create "+this.dirToCreate+ " folder failed with error: " +inError);
				});
			});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);
			this.finish("propfind on root id failed: "+inError);
		});
	},
	testGetDebugHtml: function() {
		this.__testGetFile('/HelloWorld/debug.html', 344);
	},
	testGetIconPng: function() {
		this.__testGetFile('/HelloWorld/icon.png', 7115);
	},
	__testGetFile: function(inFilePath, inExpectedSize) {
		this.log("Begin called in __testGetFile: " + inFilePath);
		var service = this.home[0];
		if (this.debug) this.log("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", -1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);

			enyo.forEach(inResponse.children, function(item) {
				if (item.isDir) {
					enyo.forEach(item.children, function(file) {
						if (( ! file.isDir) && file.path == inFilePath) {
							var req2 = service.impl.getFile(file.id);
							req2.response(this, function(inSender, inResponse) {
								if (this.debug) enyo.log("Got the inResponse for req2: ", inResponse);
								var fileSize = inResponse.content.length;
								if (this.debug) enyo.log("file size: " + fileSize + " bytes");
								if (fileSize === inExpectedSize) {
									this.finish();
								} else {
									this.finish("Bad size: expected: " + inExpectedSize + " got: " + fileSize);
								}
							});
							req2.error(this, function(inSender, inError) {
								enyo.log(inError);
								this.finish("get " + filePath + " failed with error: " +inError);
							});
						}
					}, this);
				}
			}, this);
		});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);
			this.finish("propfind on root id failed: "+inError);
		});
	},
	testPropfindAndCreateFile: function() {
		enyo.log("Begin called in testPropfindAndCreateFile.");
		var service = this.home[0];
		if (this.debug) enyo.log("Got the Service: ", service);
		/**
		* PROPFIND from the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);
			var self = this;
			var content = {
				title: "created by the test suite"
			};
			/**
			* PUT Verb - want to create test/root/TestRunner/App.js file
			*/
			if (inResponse.children[3].id) {
				var req2 = service.impl.createFile(inResponse.children[3].id, this.fileToCreate, JSON.stringify(content));
				req2.response(self, function(inSender, inResponse) {
					if (self.debug) enyo.log("Got the inResponse for req2: ", inResponse);
					self.finish();
				});
				req2.error(this, function(inSender, inError) {
					enyo.log(inError);
					self.finish("create file error: "+inError);
				});
			} else {
				self.finish("folder "+inResponse.children[3].name+ " not found");
			}
		});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);
			this.finish("propfind for create file error: "+inError);
		});
	},
	testDeleteFile: function() {
		enyo.log("Begin called in testDeleteFile.");
		var service = this.home[0];
		if (this.debug) enyo.log("Got the Service: ", service);
		/**
		* PROPFIND from the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);
			/**
			* DELETE - want to delete test/root/TestRunner/App.js file
			*/
			    /**
			    * new PROPFIND on test/root/TestRunner
			    */
			    var req2 = service.impl.propfind(inResponse.children[3].id, 1);
			    var self = this;
			    req2.response(self, function(inSender, inResponse) {
			    	if (self.debug) enyo.log("Got the inResponse for req3: "+JSON.stringify(inResponse));
			    	if (inResponse.children[0].name === this.fileToCreate) {
			    		var self2 = self;
						var req3 = service.impl.remove(inResponse.children[0].id);
						req3.response(self2, function(inSender, inResponse) {
							if (self2.debug) enyo.log("Got the inResponse for req3: "+JSON.stringify(inResponse));
							self2.finish();
						});
						req3.error(self2, function(inSender, inError) {
							enyo.log(inError);
							self2.finish("cannot delete " +fileToCreate+ "because file not found.");
						});
					} else {
						self2.finish("delete File error: "+inError);
					}
				});
				req2.error(this, function(inSender, inError) {
					enyo.log(inError);
					self.finish("delete File error: "+inError);
				});

		});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);
			this.finish("root id propfind for delete file filed with error: "+inError);
		});
		
	},
	testDeleteFolder: function() {
		enyo.log("Begin called in testDeleteFolder.");
		var service = this.home[0];
		if (this.debug) enyo.log("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* DELETE - want to delete test/root/TestRunner directory
			*/
			if ((inResponse.children[3].id) && (inResponse.children[3].name === this.dirToCreate)) {
				var req2 = service.impl.remove(inResponse.children[3].id);
				req2.response(self, function(inSender, inResponse) {
					if (self.debug) enyo.log("Got the inResponse for req2: "+JSON.stringify(inResponse));						
					self.finish();
				});
				req2.error(self, function(inSender, inError) {
					enyo.log(inError);
					self.finish("delete "+inResponse.children[3].name+ " folder failed with error: " +inError);
				});
			} else {
				self.finish("delete "+inResponse.children[3].name+ " folder failed");
			}
		});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);				
			this.finish("propfind on root id failed: "+inError);
		});
	},
	/**
	* re-create the test/root/TestRunner directory 
	* needed for other test suite
	*/
	testSourceFolderRevival: function() {
		enyo.log("Begin called in testSourceFolderRevival.");
		var service = this.home[0];
		if (this.debug) enyo.log("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* MKCOL - want to create test/root/TestRunner directory
			*/
			var req2 = service.impl.createFolder(inResponse.id, this.dirToCreate);
			req2.response(function(inSender, inResponse) {
				if (self.debug) enyo.log("Got the inResponse for req2: ", inResponse);
				self.finish();
			});
			req2.error(this, function(inSender, inError) {
				enyo.log(inError);
				self.finish("create "+this.dirToCreate+ " folder failed with error: " +inError);
			});
		});
		req.error(this, function(inSender, inError) {
			enyo.log(inError);				
			this.finish("propfind on root id failed: "+inError);
		});
	},

	statics: {
		services: null,
		home: null
	}
});