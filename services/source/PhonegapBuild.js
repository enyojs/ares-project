enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	events: {
		onLoginFailed: "",
		onBuildStarted: ""
	},
	debug: false,
	/**
	 * @private
	 */
	create: function() {
		if (this.debug) this.log();
		this.inherited(arguments);
		this.config = {};
	},
	/**
	 * Set PhonegapBuild base parameters.
	 * 
	 * This method is not expected to be called by anyone else but
	 * {ServiceRegistry}.
	 * @param {Object} inConfig
	 * @see ServiceRegistry.js
	 */
	setConfig: function(inConfig) {
		var self = this;

		if (this.debug) this.log("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		if (this.debug) this.log("config:", this.config);

		if (this.config.origin && this.config.pathname) {
			this.url = this.config.origin + this.config.pathname;
			if (this.debug) this.log("url:", this.url);
		}

		// chain authorization if & only if authentication
		// credentials are provided as part of the service
		// configuration.
		if (this.config.auth && enyo.keys(this.config.auth)) {
			this.authorize(function(inError, inValue) {
				self.log("setConfig(): error:", inError, ", value:", inValue);
				if (inError) {
					self.doLoginFailed({id: inConfig.id});
				}
			});
		}
	},
	/**
	 * @return {Object} the configuration this service was configured by
	 */
	getConfig: function() {
		return this.config;
	},
	/**
	 * Authorize & then retrieve information about the currently registered user
	 *
	 * This includes registered applications & signing keys.
	 * @public
	 */
	authorize: function(next) {
		var self = this;
		if (this.debug) this.log();
		this._getUserData(function(err, userData) {
			if (err) {
				self._getToken(function(err) {
					if (err) {
						next(err);
					} else {
						self. _getUserData(next);
					}
				});
			} else {
				next(null, userData);
			}
		});
	},
	/**
	 * Get a developer token from user's credentials
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getToken: function(next) {
		if (this.debug) this.log();
		if(this.config.auth && this.config.auth.token) {
			next();
			return;
		}

		// Pass credential information to get a phonegapbuild token
		var data = "username=" + encodeURIComponent(this.config.auth.username) +
			    "&password=" + encodeURIComponent(this.config.auth.password);
		
		// Get a phonegapbuild token for the Hermes build service
		var req = new enyo.Ajax({
			url: this.url + '/token',
			method: 'POST',
			postBody: data
		});
		req.response(this, function(inSender, inData) {
			this.config.auth.token = inData.token;
			if (this.debug) this.log("Got phonegap token: " + this.config.auth.token);
			// store token
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
			next();
		});
		req.error(this, function(inSender, inError) {
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
			}
			if (this.debug) this.error("Unable to get PhoneGap application token (" + inError + ")", "response:", response);
			next(new Error("Unable to get PhoneGap application token (" + inError + ")"), details);
		});
		req.go();
	},
	/**
	 * Get a developer account information
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getUserData: function(next) {
		if (this.debug) this.log();
		var req = new enyo.Ajax({
			url: this.url + '/api/v1/me'
		});
		req.response(this, function(inSender, inData) {
			if (this.debug) this.log("inData: ", inData);
			this._storeUserData(inData.user);
			next(null, inData);
		});
		req.error(this, function(inSender, inError) {
			// invalidate token
			this.config.auth.token = null;
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
			// report the error
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
			}
			next(new Error("Unable to get PhoneGap user data (" + inError + ")"), details);
		});
		req.go({token: this.config.auth.token}); // FIXME: remove the token as soon as the cookie works...
	},
	/**
	 * Store relevant user account data
	 * @param {Object} user the PhoneGap account user data
	 * @return {undefined}
	 * @private
	 */
	_storeUserData: function(user) {
		this.keys = {};
		enyo.forEach(enyo.keys(user.keys), function(target) {
			// reset known keys
			this.keys[target] = {};

			// reuse known key passwords
			this.config.auth.keys = this.config.auth.keys || {};
			this.config.auth.keys[target] = this.config.auth.keys[target] || {};

			var targetKeys = user.keys[target].all;
			if (target !== 'link') {
				this.keys[target] = {};
				enyo.forEach(targetKeys, function(targetKey) {
					 var key = {
						id: targetKey.id,
						name: targetKey.title
					};
					enyo.mixin(key, this.config.auth.keys[target][key.id]);
					this.keys[target][key.id] = key;
				}, this);
			}
		}, this);

		// XXX do not log 'auth'
		if (this.debug) this.log("keys:", this.keys);

		// auto-clean: remove key passwords for unknown target platforms
		enyo.forEach(enyo.keys(this.config.auth.keys), function(target) {
			if (typeof this.keys[target] !== 'object') {
				delete this.config.auth.keys[target];
			}
		}, this);

		// XXX do not log 'auth'
		if (this.debug) this.log("auth keys:", this.config.auth.keys);
	},
	/**
	 * Get the key for the given target & id, or the list of keys for the given target
	 *
	 * @param {String} target the build target, one of ['ios', 'android', ...etc] as defined by PhoneGap
	 * @param {String} id the signing key id, as defined by PhoneGap
	 *
	 * @return If the key id is not provided, this method returns
	 * a list {Object} of keys available for the given platform
	 * (that may be an empty {Object}).  If the given key id does
	 * not represent an existing key, this method returns
	 * undefined.
	 *
	 * @public
	 */
	getKey: function(target, id) {
		if (id) {
			return this.keys && this.keys[target] && this.keys[target][id];
		} else {
			return this.keys && this.keys[target];
		}
	},
	/**
	 * Set the given signing key authentication credential
	 *
	 * Nothing happens if the given key id does not exist for the given platform
	 * @param {String} target the PhoneGap build target
	 * @param {String} id the PhoneGap key ID
	 * @param {Object} auth the signing key credential object (here: an {Object} with a single 'password' {String} property)
	 * @return {undefined}
	 */
	setKey: function(target, id, auth) {
		var key;
		if (typeof this.keys[target][id] === 'object') {
			enyo.mixin(this.keys[target][id], auth);

			// Two first levels of the hierarchy are built by #_storeUserData()
			this.config.auth.keys[target][id] = this.config.auth.keys[target][id] || {};
			this.config.auth.keys[target][id].auth = auth;
			// Save the auth part in localStorage
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
		} else {
			this.warning("no such key id:", id, "for target:", target);
		}
		return this;
	},
	/**
	 * initiates the phonegap build of the given project
	 * @see HermesBuild.js
	 *
	 * The following actions will be performed:
	 * - Get a phonegapbuild account token
	 * - Get the file list of the project
	 * - Download all the project files
	 * - Build a multipart/form-data with all the project data
	 * - Send it to nodejs which will submit the build request
	 * - Save the appid
	 * 
	 * @param {Object} project has at least 3 properties: #name, #config and #filesystem
	 * @param {Function} next is a CommonJS callback
	 */
	build: function(project, next) {
		if (!next || !project || !project.name || !project.config || !project.filesystem) {
			throw new Error("Invalid parameters");
		}
		var config = project.config.getData();
		if (this.debug) this.log("starting... project:", project);

		if(!config || !config.build || !config.build.phonegap) {
			next(new Error("Project not configured for Phonegap Build"));
			return;
		}
		if (this.debug) this.log("appId: " + config.build.phonegap.appId);

		this.getFileList(project, next);
	},
	/**
	 * Get the list of files of the project for further upload
	 * @param {Object} project
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	getFileList: function(project, next) {
		if (this.debug) this.log("...");
		var req, fileList = [];
		req = project.filesystem.propfind(project.folderId, -1 /*infinity*/);
		req.response(this, function(inEvent, inData) {
			this.doBuildStarted({project: project});
			if (this.debug) enyo.log("Got the list of files", inData);
			// Extract the list into an array
			this.buildFileList(inData.children, fileList);
			var prefix = inData.path;
			var prefixLen = prefix.length + 1;
			this.prepareFileList(project, prefix, fileList, 0, prefixLen, next);
		});
		req.error(this, function(inEvent, inError) {
			next(new Error("Unable to get project file list: " + inError));
		});
	},
	buildFileList: function(inData, fileList) {
		var item;
		for(item in inData) {
			this.listAllFiles(inData[item], fileList);
		}
	},
	listAllFiles: function(inData, fileList) {
		if (inData.isDir) {
			for(var item in inData.children) {
				this.listAllFiles(inData.children[item], fileList);
			}
		} else {
			var obj = {path: inData.path, id: inData.id};
			fileList.push(obj);
		}
	},
	extractPrefixLen: function(inData) {
		var item = inData[0];
		return item.path.length - item.name.length;
	},
	prepareFileList: function(project, prefix, fileList, index, prefixLen, next) {
		// Start downloading files and building the FormData
		var formData = new enyo.FormData();
		var blob = new enyo.Blob([project.config.getPhoneGapConfigXml() || ""],
					 {type: "application/octet-stream"});
		formData.append('file', blob, 'config.xml');
		// hard-wire config.xml for now. may extend in the future (if needed)
		var drop = [prefix, "config.xml"].join('/');
		var newFileList = enyo.filter(fileList, function(file) {
			return file.path !== drop;
		}, this);
		if (this.debug) this.log("dropped: fileList.length:", fileList.length, "=> newFileList.length:", newFileList.length);

		this.downloadFiles(project, formData, newFileList, 0, prefixLen, next);
	},
	/**
	 * Download all the project files and add them into the multipart/form-data
	 * @param project
	 * @param {FormData} formData
	 * @param fileList
	 * @param index
	 * @param prefixLen
	 * @param {Function} next a CommonJS callback
	 */
	downloadFiles: function(project, formData, fileList, index, prefixLen, next) {
		// Still some files to download. Get one.
		var id = fileList[index].id;
		var name = fileList[index].path.substr(prefixLen);
		if (this.debug) this.log("Fetching " + name + " " + index + "/" + fileList.length);
		var request = project.filesystem.getFile(id);
		request.response(this, function(inEvent, inData) {
			// Got a file content: add it to the multipart/form-data
			var blob = new enyo.Blob([inData.content || ""], {type: "application/octet-stream"});
			// 'file' is the form field name, mutually agreed with the Hermes server
			formData.append('file', blob, name);

			if (++index >= fileList.length) {
				// No more file to download: submit the build request
				this.submitBuildRequest(project, formData, next);
			} else {
				// Get the next file (will submit the build if no more file to get)
				this.downloadFiles(project, formData, fileList, index, prefixLen, next);
			}
		});
		request.error(this, function(inEvent, inData) {
			this.log("ERROR while downloading files: " + inData);
			next(new Error("Unable to download project files"));
		});
	},
	/**
	 * @private
	 * @param {Object} project
	 * @param {FormData} formData
	 * @param {Function} next is a CommonJS callback
	 */
	submitBuildRequest: function(project, formData, next) {
		var config = ares.clone(project.config.getData());
		var keys = {};
		var platforms = [];
		if (this.debug) this.log("...");
		// Add token information in the FormData
		formData.append('token', this.config.auth.token);
		formData.append('title', config.title);
		if (config.build.phonegap.appId) {
			if (this.debug) this.log("appId: " + config.build.phonegap.appId);
			formData.append('appId', config.build.phonegap.appId);
		}
		enyo.forEach(enyo.keys(config.build.phonegap.targets), function(target) {
			var pgTarget = config.build.phonegap.targets[target];
			if (pgTarget) {
				if (this.debug) this.log("platform:", target);
				platforms.push(target);
				if (typeof pgTarget === 'object') {
					var keyId = pgTarget.key;
					if (keyId) {
						keys[target] = this.getKey(target, keyId);
						if (this.debug) this.log("platform:", target, "keys:", keys);
					}
				}
			}
		}, this);
		if (enyo.keys(keys).length > 0) {
			formData.append('keys', JSON.stringify(keys));
		}
		if (platforms.length > 0) {
			formData.append('platforms', JSON.stringify(platforms));
		} else {
			next(new Error('No build platform selected'));
			return;
		}

		// un-comment to NOT submit the ZIP to
		// build.phonegap.com & rather return the given JSON.
		// Use a non-JSON string to cause an error on the
		// server side before submission.
		//formData.append('testJsonResponse', "make_an_error" /*JSON.stringify({id: config.build.phonegap.appId})*/ );

		// Ask Hermes PhoneGap Build service to minify and zip the project
		var req = new enyo.Ajax({
			url: this.url + '/op/build',
			method: 'POST',
			postBody: formData
		});
		req.response(this, function(inSender, inData) {
			if (this.debug) enyo.log("Phonegapbuild.submitBuildRequest.response:", inData);
			config.build.phonegap.appId = inData.id;
			project.config.setData(config);
			project.config.save();
			next(null, inData);
		});
		req.error(this, function(inSender, inError) {
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
			}
			next(new Error("Unable to build application:" + inError), details);
		});
		req.go({token: this.config.auth.token}); // FIXME: remove the token as soon as the cookie works...
	}
});
