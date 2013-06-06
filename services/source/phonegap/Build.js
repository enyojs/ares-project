enyo.kind({
	name: "Phonegap.Build",
	kind: "enyo.Component",
	events: {
		onLoginFailed: "",
		onShowWaitPopup: ""
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
	 * Set Phonegap.Build base parameters.
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
		if (this.debug) this.log("=> config:", this.config);

		if (this.config.origin && this.config.pathname) {
			this.url = this.config.origin + this.config.pathname;
			if (this.debug) this.log("url:", this.url);
		}
	},
	/**
	 * @return {Object} the configuration this service was configured by
	 */
	getConfig: function() {
		return this.config;
	},
	/**
	 * @return the human-friendly name of this service
	 */
	getName: function() {
		return this.config.name || this.config.id;
	},
	/**
	 * Name of the kind to show in the {AresProperties} UI
	 * @return the Enyo kind to use to set service-specific Ares-wide properties
	 * @public
	 */
	//getAresPropertiesKind: function() {},

	/**
	 * Name of the kind to show in the {ProjectProperties} UI
	 * @return the Enyo kind to use to set service-specific project properties
	 * @public
	 */
	getProjectPropertiesKind: function() {
		return "Phonegap.ProjectProperties";
	},
	/**
	 * @return true when configured, authenticated & authorized
	 */
	isOk: function() {
		return !!(this.config &&
			  this.config.auth &&
			  this.config.auth.token &&
			  this.config.auth.keys);
	},
	/**
	 * Shared enyo.Ajax error handler
	 * @private
	 */
	_handleServiceError: function(msg, next, inSender, inError) {
		var response = inSender.xhrResponse, contentType, details;
		if (response) {
			contentType = response.headers['content-type'];
			if (contentType && contentType.match('^text/plain')) {
				details = response.body;
			}
		}
		next(new Error(msg + inError.toString()), details);
	},
	/**
	 * Authenticate current user & retreive the associated token
	 * 
	 * If successful, #username, #password & the token are save to
	 * the browser client localStorage.
	 * 
	 * @param {Object} auth contains the properties #username and #password
	 * @param {Function} next is a CommonJS callback
	 * @public
	 */
	authenticate: function(inAuth, next) {
		if (this.debug) this.log();
		this.config.auth = {
			username: inAuth.username,
			password: inAuth.password
		};
		this._getToken(next);
	},
	/**
	 * Authorize & then retrieve information about the currently registered user
	 * 
	 * This includes registered applications & signing keys.
	 * @public
	 * @param {Function} next
	 * @param next {Error} err
	 * @param next {Object} userData user account data as returned by PhoneGap Build
	 */
	authorize: function(next) {
		var self = this;
		if (this.debug) this.log();
		this._getUserData(function(err, userData) {
			if (err) {
				self._getToken(function(err) {
					if (err) {
						self.doLoginFailed({id: self.config.id});
						next(err);
					} else {
						self._getUserData(next);
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
			if (this.debug) this.log("skipping token obtention");
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
			if (this.debug) this.log("Got phonegap token:", this.config.auth.token);
			// store token
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
			next();
		});
		req.error(this, function(inSender, inError) {
			// invalidate token
			this.config.auth.token = null;
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
		var keys = this.config.auth.keys || {};
		enyo.forEach(enyo.keys(user.keys), function(target) {
			if (target !== 'link') {
				var newKeys,
				    oldKeys = keys[target],
				    inKeys = user.keys[target].all;
				newKeys = enyo.map(inKeys, function(inKey) {
					var oldKey, newKey;
					newKey = {
						id: inKey.id,
						title: inKey.title
					};
					oldKey = enyo.filter(oldKeys, function(oldKey) {
						return oldKey && (oldKey.id === inKey.id);
					})[0];
					return enyo.mixin(newKey, oldKey);
				});
				keys[target] = newKeys;
			}
		});

		// FIXME do not log 'auth'
		if (this.debug) this.log("keys:", keys);
		this.config.auth.keys = keys;

		ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
	},
	/**
	 * Get the key for the given target & id, or the list of keys for the given target
	 * 
	 * @param {String} target the build target, one of ['ios', 'android', ...etc] as defined by PhoneGap
	 * @param {String} id the signing key id, as defined by PhoneGap
	 * 
	 * @return If the key id is not provided, this method returns
	 * an {Array} of keys available for the given platform.  If
	 * the given key id does not represent an existing key, this
	 * method returns undefined.
	 * 
	 * @public
	 */
	getKey: function(target, id) {
		var keys = this.config.auth.keys && this.config.auth.keys[target], res;
		if (id) {
			res = enyo.filter(keys, function(key) {
				return (key.id === id);
			}, this)[0];
		} else {
			res = keys;
		}
		if (this.debug) this.log("target:", target, "id:", id, "=> keys:", res);
		return res;
	},
	/**
	 * Set the given signing key for the given platform
	 * 
	 * Unlike the key {Object} stored on PhoneGap build (which
	 * only has an #id and #title property), the given key is
	 * expected to contain the necessary credentails properties
	 * for the current platform (#password for 'ios' and
	 * 'blackberry', #key_pw and #keystore_pw for 'android').
	 * 
	 * This method automatically saves the full signing keys in
	 * the browser client localStorage.
	 * 
	 * @param {String} target the PhoneGap build target
	 * @param {Object} key the signing key with credential properties
	 * @return {undefined}
	 */
	setKey: function(target, inKey) {
		var keys, key;

		if (( ! inKey) || typeof inKey.id !== 'number' || typeof inKey.title !== 'string') {
			this.warn("Will not store an invalid signing key:", inKey);
			return;
		}

		// Sanity
		this.config.auth.keys = this.config.auth.keys || {};
		this.config.auth.keys[target] = this.config.auth.keys[target] || [];

		// Look for existing values
		keys = this.config.auth.keys && this.config.auth.keys[target];
		key =  enyo.filter(keys, function(key) {
			return (key.id === inKey.id);
		}, this)[0];
		if (key) {
			enyo.mixin(key, inKey);
		} else {
			keys.push(inKey);
		}
		if (this.debug) this.log("target:", target, "keys:", keys /*XXX*/);
		this.config.auth.keys[target] = keys;

		// Save a new authentication values for PhoneGap 
		ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
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
	 * @param {Ares.Model.Project} project
	 * @param {Function} next is a CommonJS callback
	 * @public
	 */
	build: function(project, next) {
		if (this.debug) this.log("Starting phonegap build: " + this.url + '/build');
		async.waterfall([
			enyo.bind(this, this.authorize),
			enyo.bind(this, this._updateConfigXml, project),
			enyo.bind(this, this._getFiles, project),
			enyo.bind(this, this._submitBuildRequest, project),
			enyo.bind(this, this._prepareStore, project),
			enyo.bind(this, this._store, project)
		], next);
	},
	/**
	 * Collect & check information about current project, update config.xml
	 * @private
	 */
	_updateConfigXml: function(project, userData, next) {
		if (!project instanceof Ares.Model.Project) {
			next(new Error("Invalid parameters"));
			return;
		}
		var config = project.getConfig().getData();
		if (this.debug) this.log("starting... project:", project);

		if(!config || !config.build || !config.build.phonegap) {
			next(new Error("Project not configured for Phonegap Build"));
			return;
		}
		if (this.debug) this.log("PhoneGap App Id:", config.build.phonegap.appId);

		var req = project.getService().createFile(project.getFolderId(), "config.xml", this._generateConfigXml(config));
		req.response(this, function _savedConfigXml(inSender, inData) {
			if (this.debug) this.log("Phonegap.Build#_updateConfigXml()", "updated config.xml:", inData);
			var ctype = req.xhrResponse.headers['x-content-type'];
			next();
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to fetch application source code", next));
	},
	/**
	 * Get the list of files of the project for further upload
	 * @param {Object} project
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getFiles: function(project, next) {
		if (this.debug) this.log("...");
		var req, fileList = [];
		this.doShowWaitPopup({msg: $L("Fetching application source code")});
		req = project.getService().exportAs(project.getFolderId(), -1 /*infinity*/);
		req.response(this, function _gotFiles(inSender, inData) {
			if (this.debug) this.log("Phonegap.Build#_getFiles()", "Got the files data");
			var ctype = req.xhrResponse.headers['x-content-type'];
			next(null, {content: inData, ctype: ctype});
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to fetch application source code", next));
	},
	/**
	 * @private
	 * @param {Object} project
	 * @param {FormData} formData
	 * @param {Function} next is a CommonJS callback
	 */
	_submitBuildRequest: function(project, data, next) {
		var config = ares.clone(project.getConfig().getData());
		if (this.debug) this.log("config: ", config);
		var keys = {};
		var platforms = [];

		// mandatory parameters
		var query = {
			//provided by the cookie
			//token: this.config.auth.token,
			title: config.title
		};

		// Already-created apps have an appId (to be reused)
		if (config.build.phonegap.appId) {
			if (this.debug) this.log("appId:", config.build.phonegap.appId);
			query.appId = config.build.phonegap.appId;
		}

		// Signing keys, if applicable to the target platform
		// & if chosen by the app developper.
		enyo.forEach(enyo.keys(config.build.phonegap.targets), function(target) {
			var pgTarget = config.build.phonegap.targets[target];
			if (pgTarget) {
				if (this.debug) this.log("platform:", target);
				platforms.push(target);
				if (typeof pgTarget === 'object') {
					var keyId = pgTarget.keyId;
					if (keyId) {
						keys[target] = enyo.clone(this.getKey(target, keyId));
						//delete keys[target].title;
						//if (this.debug) this.log("platform:", target, "keys:", keys);
					}
				}
			}
		}, this);
		if (enyo.keys(keys).length > 0) {
			if (this.debug) this.log("keys:", keys);
			query.keys = JSON.stringify(keys);
		}

		// Target platforms -- defined by the Web API, but not implemented yet
		if (platforms.length > 0) {
			query.platforms = JSON.stringify(platforms);
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
			postBody: data.content,
			contentType: data.ctype
		});
		req.response(this, function(inSender, inData) {
			if (this.debug) enyo.log("Phonegap.Build#_submitBuildRequest(): response:", inData);
			if (inData) {
				config.build.phonegap.appId = inData.id;
				var configKind = project.getConfig();
				configKind.setData(config);
				configKind.save();
			}
			next(null, inData);
		});
		req.error(this, function(inSender, inError) {
			var response = inSender.xhrResponse, contentType,
			    message = "Unable to build application";
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					message = response.body;
				}
			}
			next(new Error(message + " (" + inError + ")"));
		});
		req.go(query);
	},

	/**
	 * Prepare the folder where to store the built package
	 * @private
	 */
	_prepareStore: function(project, inData, next) {
		var folderKey = "build." + this.getName() + ".target.folderId",
		    folderPath = "target/" + this.getName();
		this.doShowWaitPopup({msg: $L("Storing webOS application package")});
		var folderId = project.getObject(folderKey);
		if (folderId) {
			next(null, folderId, inData);
		} else {
			var req = project.getService().createFolder(project.getFolderId(), folderPath);
			req.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("response received ", inResponse);
				folderId = inResponse.id;
				project.setObject(folderKey, folderId);
				next(null, folderId, inData);
			});
			req.error(this, this._handleServiceError.bind(this, "Unable to prepare package storage", next));
		}
	},

	/**
	 * @private
	 */
	_store: function(project, folderId, appData, next) {
		var appKey = "build." + this.getName() + ".app";
		if (this.debug) this.log("appData: ", appData);
		project.setObject(appKey, appData);
		// TODO: the project Model object does not
		// persist from one Ares run to another,
		// because it also contains transiant data.
		// This is to be fixed as part of the
		// ENYO-2217 user-story.
		next();
	},
	/**
	 * Generate PhoneGap's config.xml on the fly
	 * @param {Object} config PhoneGap Build config, as a Javascript object
	 * @return {String} or undefined if PhoneGap build is disabled for this project
	 * @private
	 * FIXME: define a JSON schema
	 */
	_generateConfigXml: function(config) {
		var phonegap = config.build.phonegap;
		if (!phonegap) {
			this.log("PhoneGap build disabled: will not generate the XML");
			return undefined;
		}

		// See http://flesler.blogspot.fr/2008/03/xmlwriter-for-javascript.html

		var str, xw = new XMLWriter('UTF-8');
		xw.indentation = 4;
		xw.writeStartDocument();
		xw.writeComment('***                              WARNING                            ***');
		xw.writeComment('***            This is an automatically generated document.         ***');
		xw.writeComment('*** Do not edit it: your changes would be automatically overwritten ***');

		xw.writeStartElement( 'widget' );

		xw.writeAttributeString('xmlns','http://www.w3.org/ns/widgets');
		xw.writeAttributeString('xmlns:gap','http://phonegap.com/ns/1.0');

		xw.writeAttributeString('id', config.id);
		xw.writeAttributeString('version',config.version);

		// we use 'title' (one-line description) here because
		// 'name' is made to be used by package names
		xw.writeElementString('name', config.title);

		// we have no multi-line 'description' of the
		// application, so use our one-line description
		xw.writeElementString('description', config.title);

		xw.writeStartElement( 'icon' );
		// If the project does not define an icon, use Enyo's
		// one
		xw.writeAttributeString('src', phonegap.icon.src || 'icon.png');
		xw.writeAttributeString('role', phonegap.icon.role || 'default');
		xw.writeEndElement();	// icon

		xw.writeStartElement( 'author' );
		xw.writeAttributeString('href', config.author.href);
		xw.writeString(config.author.name);
		xw.writeEndElement();	// author

		// skip completelly the 'platforms' tags if we target
		// all of them
		if (phonegap.targets && (enyo.keys(phonegap.targets).length > 0)) {
			xw.writeStartElement('platforms', 'gap');
			for (var platformName in phonegap.targets) {
				var platform = phonegap.targets[platformName];
				xw.writeStartElement('platform', 'gap');
				xw.writeAttributeString('name', platformName);
				for (var propName in platform) {
					xw.writeAttributeString(propName, platform[propName]);
				}
				xw.writeEndElement(); // gap:platform
			}
			xw.writeEndElement();	// gap:platforms
		}

		// plugins
		if (typeof phonegap.plugins === 'object') {
			for (var pluginName in phonegap.plugins) {
				xw.writeStartElement('plugin', 'gap');
				xw.writeAttributeString('name', pluginName);
				var plugin = phonegap.plugins[pluginName];
				if (typeof plugin === 'object') {
					for (var attr in plugin) {
						xw.writeAttributeString(attr, plugin[attr]);
					}
				}
				xw.writeEndElement(); // gap:plugin
			}
		}

		// UI should be helpful to define the features so that
		// the URL's are correct... I am not sure whether it
		// is possible to have them enforced by a JSON schema,
		// unless we hard-code a discrete list of URL's...
		enyo.forEach(phonegap.features, function(feature) {
			xw.writeStartElement('feature');
			xw.writeAttributeString('name', feature.name);
			xw.writeEndElement(); // feature
		}, this);

		// ...same for preferences
		for (var prefName in phonegap.preferences) {
			xw.writeStartElement('preference');
			xw.writeAttributeString('name', prefName);
			xw.writeAttributeString('value', phonegap.preferences[prefName]);
			xw.writeEndElement(); // preference
		}

		xw.writeEndElement();	// widget

		//xw.writeEndDocument(); called by flush()
		str = xw.flush();
		xw.close();
		if (this.debug) this.log("xml:", str);
		return str;
	},
	/**
	 * @public
	 */
	getDefaultProjectBuilderConfig: function() {
		var config = Phonegap.Build.DEFAULT_CONFIG;
		return config;
	},
	statics: {
		DEFAULT_CONFIG: {
			enabled: false,
			icon: {
				src: "icon.png",
				role: "default"
			},
			preferences: {
				"phonegap-version": "2.5.0"
			},
			plugins: {
				"ChildBrowser": {
					version: "2.5.0"
				}
			}
		}
	}
});
