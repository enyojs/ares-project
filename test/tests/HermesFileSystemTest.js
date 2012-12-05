enyo.kind({
	name: "HermesFileSystemTest",
	kind: "Ares.TestSuite",
	debug: false,
	folderId: "%2FAresTests",
	dirToCreate: "source",
	nodeDir: "%2FAresTests%2Fsource",
	fileToCreate: "App.js",
	nodeFile: "%2FAresTests%2Fsource%2FApp.js",
	registry: null,
	services: null,
	home: null,

	create: function () {
		this.inherited(arguments);
		//this.log("create()");
		this.services = HermesFileSystemTest.services;
		this.home = HermesFileSystemTest.home;
	},
	/**
	* get Services from registry
	*/
	testGetServicesFromRegistry: function() {
		this.log("Begin called in testGetServicesFromRegitry.");
		this.registry = ServiceRegistry.instance;
		this.registry._reloadServices(enyo.bind(this, "cbReloadServices"));

	},
	cbReloadServices: function(inError) {
		this.log("Begin called in cbReloadServices.");
		if (inError) {
			this.finish("No services loaded!");
		} else {
			this.services = this.registry.services;
			HermesFileSystemTest.services = this.services;
			if (this.debug) {
				this.log("HermesFileSystemTest.services: ");
				console.dir(HermesFileSystemTest.services);
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
		this.log("Begin called in testGetHomeFromServices.");
		var h = this.services.filter(function(s) {
			if (this.debug) {
				this.log("service.conf.id: "+s.conf.id);
			}
			return s.config.id === "home";
		});
		if (this.debug) {
			this.log("home service: ");
			console.dir(h);
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
	testPropfindAndCreateFolder: function() {
		this.log("Begin called in testPropfindAndCreateFolder.");
		/**
		*	PROPFIND verb used to listFiles of a folderId
		*/
		var service = this.home[0];
		var req = service.impl.propfind(this.folderId, 1);
		req.response(this, function(inSender, inResponse) {
			var self = this;
			var r = inResponse.children.filter(function(node){
				return node.name === this.dirToCreate;
			});
			if (r.length !== 0) {
				this.finish("folder already exists.");
			} else {
				/**
				* MKCOL verb 
				*/
				// want to create @HOME@/AresTests/source directory
				var req2 = service.impl.createFolder(this.folderId, this.dirToCreate);
				req2.response(function(inSender, inResponse) {
					if (this.debug) {
						this.log(inResponse);						
					}
					self.finish();
				});
				req2.error(this, function(inSender, inError) {
					this.log(inError);
					self.finish("create folder error: "+inError);
				});
			}
		});
		req.error(this, function(inSender, inError) {
			if (this.debug) {
				this.log(inError);				
			}
			this.finish("propfind create folder error: "+inError);
		});
	},

	testPropfindAndCreateFile: function() {
		console.log("Begin called in testPropfindAndCreateFile.");
		/**
		*	PROPFIND verb used to listFiles of a folderId
		*/
		var service = this.home[0];
		var req = service.impl.propfind(this.nodeDir, 1);
		req.response(this, function(inSender, inResponse) {
			var self = this;
			if (this.debug) {
				this.log("profind/create file inResponse.children: "+JSON.stringify(inResponse));
			}
			var r = inResponse.children.filter(function(node){
				return node.name === this.dirToCreate;
			});
			if (r.length !== 0) {
				this.finish("file already exists.");
			} else {
				var content = {
					title: "created by the test suite"
				};
				/**
				* PUT Verb
				*/
				// want to create @HOME@/AresTests/source/App.js file
				var req2 = service.impl.createFile(this.nodeDir, this.fileToCreate, content);
				req2.response(self, function(inSender, inResponse) {
					if (this.debug) {
						this.log("create File inResponse: "+JSON.stringify(inResponse));						
					}
					self.finish();
				});
				req2.error(this, function(inSender, inError) {
					if (this.debug) {
						this.log(inError);
					}
					self.finish("create file error: "+inError);
				});
			}
		});
		req.error(this, function(inSender, inError) {
			if (this.debug) {
				this.log(inError);
			}
			this.finish("propfind create file error: "+inError);
		});
	},
	testDeleteFile: function() {
		console.log("Begin called in testDeleteFile.");
		var service = this.home[0];
		/**
		* DELETE verb
		*/
		// want to delete @HOME@/AresTests/source/App.js file
		// nodeFile: "%2FAresTests%2Fsource%2FApp.js"
		var req2 = service.impl.remove(this.nodeFile);
		req2.response(this, function(inSender, inResponse) {
			if (this.debug) {
				this.log("delete File inResponse: "+JSON.stringify(inResponse));						
			}
			this.finish();
		});
		req2.error(this, function(inSender, inError) {
			if (this.debug) {
				this.log(inError);
			}
			this.finish("delete File error: "+inError);
		});
	},
	testDeleteFolder: function() {
		console.log("Begin called in testDeleteFolder.");
		var service = this.home[0];
		/**
		* DELETE verb
		*/
		// want to delete @HOME@/AresTests/source directory
		// nodeDir: "%2FAresTests%2Fsource"
		var req = service.impl.remove(this.nodeDir);
		req.response(this, function(inSender, inResponse) {
		if (this.debug) {
				this.log("delete Folder inResponse: "+JSON.stringify(inResponse));						
		}		this.finish();
		});
		req.error(self, function(inSender, inError) {
			if (this.debug) {
				this.log(inError);
			}
			this.finish("delete Folder error: "+inError);
		});
	},
	statics: {
		services: null,
		home: null
	}
});