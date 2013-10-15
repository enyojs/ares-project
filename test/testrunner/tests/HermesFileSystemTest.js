/* global HermesFileSystemTest, ServiceRegistry, ares */

enyo.kind({
	name: "HermesFileSystemTest",
	kind: "Ares.TestSuite",
	noDefer: true,
	debug: false,

	dirToCreate: "TestRunner",
	fileToCreate: "App.js",

	registry: null,
	services: null,
	home: null,

	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.trace("create()");
		this.services = HermesFileSystemTest.services;
		this.home = HermesFileSystemTest.home;
	},
	/**
	* get Services from Registry
	*/
	testGetServicesFromRegistry: function() {
		this.resetTimeout(10000);
		this.registry = ServiceRegistry.instance;
		this.registry._reloadServices(enyo.bind(this, "cbReloadServices"));

	},
	cbReloadServices: function(inError) {
		enyo.log("Begin called in testGetServicesFromRegitry/cbReloadServices.");
		if (inError) {
			this.finish("No services loaded!");
		} else {
			this.services = this.registry.services;
			HermesFileSystemTest.services = this.services;
			this.trace("HermesFileSystemTest.services: ", HermesFileSystemTest.services);
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
		var self = this;
		var h = this.services.filter(function(s) {
			self.trace("service.config.id: ", s.config.id);
			return s.config.id === "home";
		});
		this.trace("home service: ", h);
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
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* MKCOL - want to create test/root/TestRunner directory
			* if test/root/TestRunner exists first delete it
			*/
			var req2 = service.impl.createFolder(inResponse.id, this.dirToCreate);
			req2.response(function(inSender, inResponse) {
				self.trace("Got the inResponse for req2: ", inResponse);
				self.finish();
			});
			req2.error(this, function(inSender, inError) {
				self.trace(inError);
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
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", -1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);

			enyo.forEach(inResponse.children, function(item) {
				if (item.isDir) {
					enyo.forEach(item.children, function(file) {
						if (( ! file.isDir) && file.path == inFilePath) {
							var req2 = service.impl.getFile(file.id);
							req2.response(this, function(inSender, inResponse) {
								this.trace("Got the inResponse for req2: ", inResponse);
								var fileSize = inResponse.content.length;
								this.trace("file size: ", fileSize, " bytes");
								if (fileSize === inExpectedSize) {
									this.finish();
								} else {
									this.finish("Bad size: expected: " + inExpectedSize + " got: " + fileSize);
								}
							});
							req2.error(this, function(inSender, inError) {
								enyo.log(inError);
								this.finish("get " + inFilePath + " failed with error: " +inError);
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
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND from the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);
			var self = this;
			var content = {
				title: "created by the test suite"
			};
			/**
			* PUT Verb - want to create test/root/TestRunner/App.js file
			*/
			if (inResponse.children[3].id) {
				var req2 = service.impl.createFile(inResponse.children[3].id, this.fileToCreate, enyo.json.stringify(content));
				req2.response(self, function(inSender, inResponse) {
					self.trace("Got the inResponse for req2: ", inResponse);
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
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND from the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);
			/**
			* DELETE - want to delete test/root/TestRunner/App.js file
			*/
			/**
			 * * new PROPFIND on test/root/TestRunner
			*/
			var req2 = service.impl.propfind(inResponse.children[3].id, 1);
			var self = this;
			req2.response(self, function(inSender, inResponse) {
				self.trace("Got the inResponse for req3: ", enyo.json.stringify(inResponse));
				var self2 = self;
				if (inResponse.children[0].name === this.fileToCreate) {
					var req3 = service.impl.remove(inResponse.children[0].id);
					req3.response(self2, function(inSender, inResponse) {
						self2.trace("Got the inResponse for req3:", enyo.json.stringify(inResponse));
						self2.finish();
					});
					req3.error(self2, function(inSender, inError) {
						enyo.log(inError);
						self2.finish("cannot delete " + this.fileToCreate + "because file not found.");
					});
				} else {
					self2.finish("delete "+inResponse.children[0].name+ " file failed");
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
		this.resetTimeout(10000);
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* DELETE - want to delete test/root/TestRunner directory
			*/
			if ((inResponse.children[3].id) && (inResponse.children[3].name === this.dirToCreate)) {
				var req2 = service.impl.remove(inResponse.children[3].id);
				req2.response(self, function(inSender, inResponse) {
					self.trace("Got the inResponse for req2:", enyo.json.stringify(inResponse));						
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
		this.trace("Got the Service: ", service);
		/**
		* PROPFIND on the root id (test/root defined into ide-test.json)
		*/
		var req = service.impl.propfind("", 1);
		req.response(this, function(inSender, inResponse) {
			this.trace("Got the inResponse for req: ", inResponse);
			var self = this;
			/**
			* MKCOL - want to create test/root/TestRunner directory
			*/
			var req2 = service.impl.createFolder(inResponse.id, this.dirToCreate);
			req2.response(function(inSender, inResponse) {
				self.trace("Got the inResponse for req2: ", inResponse);
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