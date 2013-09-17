/*global enyo, ares, async, Ares, Phonegap, XMLWriter, ServiceRegistry, next */
/**
 * Kind to manage the life cycle of building a mobile application using 
 * the service Phonegap build.
 */
enyo.kind({
	name: "Phonegap.Build",
	kind: "enyo.Component",
	events: {
		onLoginFailed: "",
		onShowWaitPopup: ""
	},
	published: {
		timeoutDuration: 3000	
	},	
	
	debug: false,
	/**
	 * @private
	 */
	create: function() {
		ares.setupTraceLogger(this);
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
		
		this.trace("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		this.trace("=> config:", this.config);

		if (this.config.origin && this.config.pathname) {
			this.url = this.config.origin + this.config.pathname;
			this.trace("url:", this.url);
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
	 * Default configuration used when a new project is created.
	 * The Project configuration is transformed into a config.xml
	 * file at each build.  It is later expected to be modified by
	 * the UI kind returned by
	 * {PhoneGap.Build#getProjectPropertiesKind}.
	 * 
	 * @public
	 */
	getDefaultProjectConfig: function() {
		return ares.clone(Phonegap.Build.DEFAULT_PROJECT_CONFIG);
	},

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
	_handleServiceError: function(message, next, inSender, inError) {
		var response = inSender.xhrResponse, contentType, html, text;
		if (response) {
			contentType = response.headers['content-type'];
			if (contentType) {
				if (contentType.match('^text/plain')) {
					text = response.body;
				}
				if (contentType.match('^text/html')) {
					html = response.body;
				}
			}
		}
		if (inError && inError.statusCode === 401) {
			// invalidate token
			this.config.auth.token = null;
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
		}
		var err = new Error(message + " (" + inError.toString() + ")");
		err.html = html;
		err.text = text;
		err.status = response.status;		
		next(err);
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
		this.trace();
		this.config.auth = {
			username: inAuth.username,
			password: inAuth.password
		};
		this._getToken(next);
	},
	/**
	 * Get the project instance that contain the data of "project.json" file of
	 * a project. Also check if the the project is configured for Phonegap service.
	 * @param  {Object} project contain informations about the Ares project.
	 * @private
	 */
	getConfigInstance: function(project){
		if (!project instanceof Ares.Model.Project) {
					next(new Error("Invalid parameters"));
					return;
			}
				
		var config = project.getConfig().getData();		

		if(!config || !config.providers || !config.providers.phonegap) {
			next(new Error("Project not configured for Phonegap Build"));
			return;
		}

		return config;
	},

	/**
	 * Get the parameter AppId of the configuration object instance.
	 * @param  {Object} project contain informations about the Ares project.
	 * @return {String}         The AppId of the current project's application.
	 * @private
	 */
	getConfigAppId: function(project){		
		var config = this.getConfigInstance(project);
		return config.providers.phonegap.appId;
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
		this.trace();
		this.getUserData(function(err, userData) {
			if (err) {
				self._getToken(function(err) {
					if (err) {
						next(err);
					} else {
						self.getUserData(next);
					}
				});
			} else {				
				next(null, userData);				
			}
		});
	},
	
	/**
	 * Check if the AppId indicated in the file "project.json" exist 
	 * in the Phonegap account before launching the submit build action.
	 * @param  {Object}   project  project contain informations about the Ares project.
	 * @param  {Object}   userData contains detailed informations about the owner of Phonegap Build account.
	 * @param  {Function} next     is a CommonJS callback
	 * @private
	 */
	checkAppId: function (project, userData, next) {	
		
		var projectAppId = this.getConfigAppId(project);
		var appIdExist = false;

		// immediately go on if appId is blank
		if (projectAppId.toString().length === 0) {
			next(null, userData);
			return;
		}

		enyo.forEach(userData.user.apps.all, 
			function(appId){
				// depending on the origin (project.json, Entry in
				// projectConfig UI, XML from phonegap), AppId can be
				// a string or an integer. So '==' is used instead of
				// '==='
				if (projectAppId == appId.id) {
					appIdExist = true;				
				}
			}, this);
		
		if (appIdExist){
			next(null, userData);
		} else {
			var config = this.getConfigInstance(project);
			config.providers.phonegap.appId = "";
			ServiceRegistry.instance.setConfig(config);
			var errorMsg = "The AppId \'"+ projectAppId +"\' does not exist in the Phonegap Build account " + userData.user.email + ". Please choose a correct AppId";
			next(errorMsg);
		}
	},



	/**
	 * Get a developer token from user's credentials
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getToken: function(next) {
		this.trace();
		if(this.config.auth && this.config.auth.token) {
			this.trace("skipping token obtention");
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
			this.trace("Got phonegap token:", this.config.auth.token);
			// store token
			ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
			next();
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to obtain PhoneGap security token", next));
		req.go();
	},

	/**
	 * Get a developer account information
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	getUserData: function(next) {
		this.trace();
		var req = new enyo.Ajax({
			url: this.url + '/api/v1/me'
		});
		req.response(this, function(inSender, inData) {
			this.trace("inData: ", inData);
			this._storeUserData(inData.user);
			next(null, inData);
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to get PhoneGap user data", next));
		req.go();
	},	

	/**
	 * This function send an Ajax request to Node.js in order to get all the
	 * details about the project built in Phongap platform.
	 * 
	 * @param  {Object}   project contain informations about the Ares project
	 * @param  {Object}  inData  contains detailed informations about the built
	 *                           application on Phonegap
	 * @param  {Function} next    is a CommonJS callback
	 * @private
	 */
	_getBuildStatus: function(project, inData, next){
		var config = project.getConfig().getData();
		var appId = config.providers.phonegap.appId;
		var url = this.url + '/api/v1/apps/' + appId;
		
		//Creation of the Ajax request
		var req = new enyo.Ajax({
			url: url
		});

		//in case of sucess send the obtained JSON object to the next function
		//in the Async.waterfall.
		req.response(this, function(inSender, inData) {
			// activate the pop up to view the results
			next(null, inData);
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to get application build status", next));
		req.go(); 
	},


	
	/**
	 * Show the pop-up containing informations about the previous  build of the 
	 * selected project from the project list view.
	 * 
	 * @param  {Object}   project contain a description about the current selected
	 *                          project
	 * @param  {Object}  appData  contains detailed informations about the built
	 *                           application on Phonegap                          
	 * @param  {Function} next    is a CommonJs callback
	 * @private
	 */
	_showBuildStatus: function(project, appData, next){
		this.$.buildStatusPopup.showPopup(project, appData.user);
		next();
     },
	
	/**
	 * Store relevant user account data 
	 * @param {Object} user the PhoneGap account user data
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
		this.trace("keys:", keys);
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
		this.trace("target:", target, "id:", id, "=> keys:", res);
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
		this.trace("target:", target, "keys:", keys /*XXX*/);
		this.config.auth.keys[target] = keys;

		// Save a new authentication values for PhoneGap 
		ServiceRegistry.instance.setConfig(this.config.id, {auth: this.config.auth});
	},

	/**
	 * Initiates the phonegap build of the given project
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
		this.trace("Starting phonegap build: ", this.url, '/build');
		async.waterfall([
			enyo.bind(this, this.authorize),
			enyo.bind(this, this.checkAppId, project),
			enyo.bind(this, this._updateConfigXml, project),
			enyo.bind(this, this._getFiles, project),
			enyo.bind(this, this._submitBuildRequest, project),
			enyo.bind(this, this._prepareStore, project),
			enyo.bind(this, this._store, project)
		], next);
	},

	/**
	 * Communicate with Phonegap build in order to get the curent status of the
	 * built project for all targeted platforms. This status are showen in a 
	 * Pop-up defined in the file BuildStatusUI.js
	 * 
	 * @param  {Object}   project contain a description about the current selected
	 *                            project
	 * @param  {Function} next    is a CommonJS Callback
	 * @public
	 */
	buildStatus: function(project, next) {
		this.trace("Getting build status:  ", this.url, '/build');
		async.waterfall([
			enyo.bind(this, this.authorize),
			enyo.bind(this, this._getBuildStatus, project),			
			enyo.bind(this, this._showBuildStatus, project)
		], next);
	},

	/**
	 * Collect & check information about current project, update config.xml
	 * @param {Object} project
	 * @param {Object} userData is passed by checkAppId() in waterfall
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_updateConfigXml: function(project, userData, next) {
		var config = this.getConfigInstance(project);
		if (config.providers.phonegap.autoGenerateXML) {
			var configXml = this._generateConfigXml(config);
			if (!configXml) {
				this.error("unable to generate config.xml from:", config);	
				next();
			} else {
				var req, fs = project.getService();
				req = fs.createFile(project.getFolderId(), "config.xml", configXml, { overwrite: true });
				req.response(this, function _savedConfigXml(inSender, inData) {
					this.trace("Phonegap.Build#_updateConfigXml()", "wrote config.xml:", inData);	
					next();
				});
				req.error(this, this._handleServiceError.bind(this, "Unable to write config.xml", next));
			}
		} else {
			this.trace("skipping config.xml generation");	
			next();
		}

	},

	/**
	 * Get the list of files of the project for further upload
	 * @param {Object} project
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getFiles: function(project, next) {
		this.trace("...");
		var req = [];
		this.doShowWaitPopup({msg: $L("Fetching application source code")});
		req = project.getService().exportAs(project.getFolderId(), -1 /*infinity*/);
		req.response(this, function _gotFiles(inSender, inData) {
			this.trace("Phonegap.Build#_getFiles()", "Got the files data");
			var ctype = req.xhrResponse.headers['x-content-type'];
			next(null, {content: inData, ctype: ctype});
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to fetch application source code", next));
	},

	/**
	 * 
	 * @param {Object} project
	 * @param {FormData} formData
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_submitBuildRequest: function(project, data, next) {
		var config = ares.clone(project.getConfig().getData());
		this.trace("config: ", config);

		var minification = config.providers.phonegap.minification;

		var keys = {};
		var platforms = [];
		// mandatory parameters
		var query = {
			//provided by the cookie
			//token: this.config.auth.token,
			title: config.title,
			debug: !minification
		};

		// Already-created apps have an appId (to be reused)
		if (config.providers.phonegap.appId) {
			this.trace("appId:", config.providers.phonegap.appId);
			query.appId = config.providers.phonegap.appId;
		}

		// Signing keys, if applicable to the target platform
		// & if chosen by the app developper.
		if (typeof config.providers.phonegap.targets === 'object') {
			enyo.forEach(enyo.keys(config.providers.phonegap.targets), function(target) {
				var pgTarget = config.providers.phonegap.targets[target];
				if (pgTarget) {
					this.trace("platform:", target);
					platforms.push(target);
					if (typeof pgTarget === 'object') {
						var keyId = pgTarget.keyId;
						if (keyId) {
							keys[target] = enyo.clone(this.getKey(target, keyId));
							//delete keys[target].title;
							//this.trace("platform:", target, "keys:", keys);
						}
					}
				}
			}, this);
		}
		if (typeof keys ==='object' && enyo.keys(keys).length > 0) {
			this.trace("keys:", keys);
			query.keys = enyo.json.stringify(keys);
		}

		// Target platforms -- defined by the Web API, but not implemented yet
		if (platforms.length > 0) {
			query.platforms = enyo.json.stringify(platforms);
		} else {
			next(new Error('No build platform selected'));
			return;
		}

		// Ask Hermes PhoneGap Build service to minify and zip the project
		var req = new enyo.Ajax({
			url: this.url + '/op/build',
			method: 'POST',
			postBody: data.content,
			contentType: data.ctype
		});
		req.response(this, function(inSender, inData) {
			this.trace("Phonegap.Build#_submitBuildRequest(): response:", inData);
			if (inData) {
				config.providers.phonegap.appId = inData.id;
				var configKind = project.getConfig();
				configKind.setData(config);
				configKind.save();
			}
			next(null, inData);
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to build application", next));
		req.go(query);
	},

	/**
	 * Prepare the folder where to store the built package
	 * @param  {Object}   project contain a description about the current selected
	 *                          project
	 * @param  {Object}  inData  contains detailed informations about the built
	 *                           application on Phonegap
	 * @param  {Function} next    a CommonJS callback
	 * @private
	 */
	_prepareStore: function(project, inData, next) {
		var folderKey = "build." + this.config.id + ".target.folderId",
		    folderPath = "target/" + this.config.id;
		 this.doShowWaitPopup({msg: $L("Storing Phonegap application package")});

		var folderId = project.getObject(folderKey);
		if (folderId) {
			next(null, folderId, inData);
		} else {
			var req = project.getService().createFolder(project.getFolderId(), folderPath);
			req.response(this, function(inSender, inResponse) {
				this.trace("response:", inResponse);
				folderId = inResponse.id;
				project.setObject(folderKey, folderId);
				next(null, folderId, inData);
			});
			req.error(this, this._handleServiceError.bind(this, "Unable to prepare package storage", next));
		}
	},

	/**
	 * Store the built application file in the directory "<projectName>\target\Phonegap build".
	 *
	 * 
	 * @param  {Object}   project contain a description about the current selected
	 *                            project
	 * @param  {String}   folderId id used in Hermes File system to identify the 
	 *                             target folder where the downloaded applications
	 *                             will be stored.
	 * @param  {Object}   inData   contains detailed informations about the build of
	 *                           the project.
	 * @param  {Function} next     a CommonJs callback.
	 * @private            
	 */
	_storePkg: function(project, folderId, inData, next) {
		this.trace("data content.ctype: ", inData.ctype);	

		var req, fs = project.getService();
		req = fs.createFiles(folderId, {content: inData.content, ctype: inData.ctype}, { overwrite: true });

		req.response(this, function(inSender, inData) {
			this.trace("response:", inData);
			var config = project.getService().config;
			var pkgUrl = config.origin + config.pathname + '/file' + inData[0].path; // TODO: YDM: shortcut to be refined
			project.setObject("build.phonegap.target.pkgUrl", pkgUrl);
			next();
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to store application package", next));
	},	

	/**
	 * After checking that the building of the project is finished in Phongap platform, this 
	 * function send an ajax request to the Node.js in order to launch
	 * the download of the packaged application. 
	 * Node.js succeed in the downloading of this application, 
	 * an Ajax response is sent back in order to save the
	 * file (contained in a multipart data form)in the folder 
	 * "Target/Phonegap build" of the curent built project.
	 * 
	 * @param  {Object}   project contain a description of the current selected
	 *                          project
	 * @param  {Object}   folderId unique identifier of the project in Ares
	 * @param  {Object}   appData  multipart data form containing the application
	 *                             to store
	 * @param  {Function} next     a CommonJs callback
	 
	 * @private
	 */
	_store: function(project, folderId, appData, next) {
		var appKey = "build." + this.config.id + ".app";
		this.trace("Entering _store function project: ", project, "folderId:", folderId, "appData:", appData);
		project.setObject(appKey, appData);
		this._getAllPackagedApplications(project, appData, folderId, next);
	},
	
	/**
	 * 
	 * @param  {Object}   project  contain a description of the current selected
	 *                             project
	 * @param  {Object}   appData  meta-data on the build of the actuel
	 *                             project
	 * @param  {String}   folderId unique identifier of the project in Ares
	 * @param  {Function} next     a CommonJS callback
	 * @private
	 */
	_getAllPackagedApplications: function(project, appData, folderId, next){
		var platforms = [];
		var builder = this;
		var that = this ;

		//Setting the targeted platforms for the build from the those
		//presented in the object appData.
		enyo.forEach(enyo.keys(appData.status),
			function(platform){
				platforms.push(platform);
			}, this);

		/* 
		 * Parallel tasks are launched to check the build status in each platform.
		 * A status can be : complete, pending or error.
		 *	- completed: a request is made to node.js to 
		 *				download the application.
		 *	- pending: another request is sent to phonegap to check for an
		 *	           updated status.
		 *	- error: an error message is displayed.		
		 */		
		async.forEach(platforms,
		    function(platform, next) {
			that.trace("Send request for the platform: ", platform);
			
			_getApplicationForPlatform(platform, next);
	       },next);
	
		/**
		 * Check continuously the build status of the build in a targeted mobile
		 * platform on Phongap  build service and launch the appropriate action 
		 * when the returned status of the build is
		 * "complete" or "error". 
		 * @param  {Object}   project  contain a description of the current 
		 *                             selected project
		 * @param  {String}   platform targeted platfrom for the build
		 * @param  {Object}   appData  meta-data on the build of the actuel
		 *                             project
		 * @param  {Object}   folderId unique identifier of the project in Ares
		 * @param  {Function} next     a CommonJS callback
		 * @private
		 */
		function _getApplicationForPlatform(platform, next){
			async.whilst(
				function() {
					// Synchronous condition to keep waiting. 
					return appData.status[platform] === "pending";
				},
				// ...condition satisfied
				_waitForApp,
				// ...condition no longer satisfied
				_downloadApp
			);

			/**
			 * Nested function that check the build status of the application 
			 * and update the appData each 3 sec
			 * @param  {Function} next a CommonJS callback
			 * @private
			 */
			function _waitForApp (next){
				async.waterfall([
					function (next) {
						//Timeout before sending a new check status request
						setTimeout(next, builder.timeoutDuration);
					},
					function (next) {
						if(appData.status[platform] === "pending"){
							builder._getBuildStatus(project, appData, next);
						} else{
							next(null, null);
						}
						
					},
					function(inData, next) {
						//get the result from the previous status check request
						if (inData !== null){
							appData = inData.user;
						}					
						next();
					}
				], next);				
			}
			/**
			 * Launch the appropirate action when an exception occurs or when 
			 * the status is no longer in the pending state.
			 * @param  {Object} err 
			 * @private
			 */
			function _downloadApp(err){
				if (err) {
					next(err);
				} else {
					if (appData.status[platform] === "complete"){
						_setApplicationToDownload(next);
					} else {
						next();
					}
				}
			}

			/**
			 * Create the URL to send the build request to Node.js
			 * This URL contain the data to create the packaged file name.
			 *  
			 * @param  {Object}   project  contain a description of the current 
			 *                             selected project
			 * @param  {String}   folderId unique identifier of the project in Ares
			 * @param  {String}   platform targeted platfrom for the build
			 * @param  {Object}   appData  meta-data on the build of the actuel
			 *                             project
			 * @param  {Function} next     a CommonJS callback
			 * @private
			 */
			 function _setApplicationToDownload(next){
				var config = ares.clone(project.getConfig().getData()),
				    packageName = config.id,
				    appId, title, version;

				async.waterfall([
					function(next){
						//make the download request.
						appId = appData.id;
						title = packageName;
						version = appData.version || "SNAPSHOT";
						
						var urlSuffix = appId + '/' + platform + '/' + title + '/' + version;
						if(builder.debug){
							builder.log("Application "+ platform + " ready for download");
						}
						_sendDownloadRequest.bind(builder)(urlSuffix, next);
					},
					//inData is a multipart/form containing the
					//built application
					function(inData, next){
						builder._storePkg(project, folderId, inData, next);
					}
				], next);
			}

			/**
			 * Send an Ajax request to Node.js in order to initiate the download 
			 * of an application in a specific mobile platform.
			 * 
			 * @param  {Object}   project contain a description about the 
			 *                            current selected project
			 * @param  {Object}   urlSuffix   is a url suffixe that contains:
			 *                                the appId, the targeted build 
			 *                                platform, the title of the 
			 *                                application and its version.
			 * @param  {Function} next    is a CommunJS callback.
			 * @private
			 */
			function _sendDownloadRequest(urlSuffix, next){
				var url = this.url + '/api/v1/apps/' + urlSuffix;
				this.trace("download URL is : ", url);
				
				var req = new enyo.Ajax({
					url: url,
					handleAs: 'text'
				});		
				req.response(this, function(inSender, inData) {
					this.trace("response: received ", inData.length, " bytes typeof: ", (typeof inData));
					var ctype = req.xhrResponse.headers['content-type'];
					this.trace("response: received ctype: ", ctype);
					next(null, {content: inData, ctype: ctype});			
				});
				req.error(this, this._handleServiceError.bind(this, "Unable to download application package", next));
				req.go(); 
			}	
		}
	},

	/**
	 * Generate PhoneGap's config.xml on the fly
	 * 
	 * @param {Object} config PhoneGap Build config, as a Javascript object
	 * @return {String} or undefined if PhoneGap build is disabled for this project
	 * @private
	 * FIXME: define a JSON schema
	 */
	_generateConfigXml: function(config) {
		var self = this;
		
		
		var phonegap = config.providers.phonegap;
		if (!phonegap) {
			this.trace("PhoneGap build disabled: will not generate the XML");
			return undefined;
		}

		var createIconXMLRow = function(inTarget) {
			xw.writeStartElement( 'icon' );
			// If the project does not define an icon, use Enyo's
			// one
			xw.writeAttributeString('src', phonegap.icon[inTarget].src || 'icon.png');
			
			xw.writeAttributeString('role', phonegap.icon[inTarget].role || 'default');
			if(inTarget != 'sharedConfiguration'){
				xw.writeAttributeString('gap:platform', inTarget);
			}

			if (inTarget === 'android'){
				xw.writeAttributeString('gap:density', phonegap.icon[inTarget].density || "mdpi");
			} else {
				xw.writeAttributeString('width', phonegap.icon[inTarget].width || 32);
				xw.writeAttributeString('height', phonegap.icon[inTarget].height || 32);
			}

			xw.writeEndElement();
		};

		var createSplashScreenXMLRow = function(inTarget) {
			xw.writeStartElement( 'gap:splash' );
			// If the project does not define an icon, use Enyo's
			// one
			xw.writeAttributeString('src', phonegap.splashScreen[inTarget].src || 'icon.png');
			if(inTarget != 'sharedConfiguration'){
				xw.writeAttributeString('gap:platform', inTarget);
			}
			if (inTarget === 'android'){
					xw.writeAttributeString('gap:density', phonegap.splashScreen.android.density || 'mdpi');
				} else {
					xw.writeAttributeString('width', phonegap.splashScreen[inTarget].width || 60);
					xw.writeAttributeString('height', phonegap.splashScreen[inTarget].height || 60);
				}

			xw.writeEndElement();
		};

		/**
		 * Create an XML row in the file config.xml, this row describe a depence to 
		 * a hosted plugin, and may also contain sub-elements that contain a name and a value
		 * of a parameter for the plugin.
		 * 
		 * @param  {Object} pluginList contains the plugins object defined in "project.json".
		 * 
		 */
		var createPluginXMLRow = function (plugin) {
			xw.writeStartElement('gap:plugin');
				xw.writeAttributeString('name', plugin.name);
				xw.writeAttributeString('version', plugin.version);
				enyo.forEach(plugin.parameters && enyo.keys(plugin.parameters), function(parameter) {
					xw.writeStartElement("param");
						xw.writeAttributeString('name', plugin.parameters[parameter].name);
						xw.writeAttributeString('value', plugin.parameters[parameter].value);
					xw.writeEndElement();
				}, this);	
					

				xw.writeEndElement();
		};



		// See http://flesler.blogspot.fr/2008/03/xmlwriter-for-javascript.html

		var str, xw = new XMLWriter('UTF-8');
		xw.indentation = 4;
		xw.writeStartDocument();


		xw.writeStartElement( 'widget' );

		xw.writeAttributeString('xmlns','http://www.w3.org/ns/widgets');
		xw.writeAttributeString('xmlns:gap','http://phonegap.com/ns/1.0');

		xw.writeAttributeString('id', config.id);
		xw.writeAttributeString('version',config.version);

		xw.writeComment('***                              WARNING                            ***');
		xw.writeComment('***            This is an automatically generated document.         ***');
		xw.writeComment('*** Do not edit it: your changes would be automatically overwritten ***');

		// we use 'title' (one-line description) here because
		// 'name' is made to be used by package names
		xw.writeElementString('name', config.title);

		// we have no multi-line 'description' of the
		// application, so use our one-line description
		xw.writeElementString('description', config.title);

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
				if (platform !== false) {
					xw.writeStartElement('platform', 'gap');
					xw.writeAttributeString('name', platformName);
					for (var propName in platform) {
						xw.writeAttributeString(propName, platform[propName]);
					}
					xw.writeEndElement(); // gap:platform
				}
			}
			xw.writeEndElement();	// gap:platforms
		}

		xw.writeComment("Features");

		var featureUrl = "http://api.phonegap.com/1.0/";
		
		// Check if all the permissions are disabled.
		// If it's the case this function return true
		var checkNoPermissions = function () {
			var noPermissions = true;
			
			for (var key in phonegap.features){
				if (phonegap.features[key]){
					noPermissions = false;
				}
			}			
			return noPermissions;
		};		

		// If all the permissions are disabled, the tag generated is 
		// <preference name="permissions" value="none" />
		// Else the tag <feature name= <featureUrl> >is generated
		if(checkNoPermissions.call(this)) {
			xw.writeStartElement('preference');
				xw.writeAttributeString('name', 'permissions');
				xw.writeAttributeString('value', 'none');
				xw.writeEndElement();
		} else {

			enyo.forEach(phonegap.features && enyo.keys(phonegap.features), function(feature) {
				if (phonegap.features[feature]){
					xw.writeStartElement('feature');
					xw.writeAttributeString('name', featureUrl + feature);
					xw.writeEndElement();
				}			
			}, this);
		}	

		xw.writeComment("Preferences");
		enyo.forEach(phonegap.preferences && enyo.keys(phonegap.preferences), function(preference) {
			
			xw.writeStartElement('preference');
			xw.writeAttributeString('name', preference);
			xw.writeAttributeString('value', phonegap.preferences[preference]);
			xw.writeEndElement(); // preference			
	
		}, this);

		xw.writeComment("Plugins");		
		enyo.forEach(phonegap.plugins && enyo.keys(phonegap.plugins), function(pluginName) {
			createPluginXMLRow.call(self, phonegap.plugins[pluginName]);		
		}, this);

		xw.writeComment("Define app icon for each platform");
		enyo.forEach(phonegap.icon && enyo.keys(phonegap.icon), function(target) {
			createIconXMLRow.call(self, target);
			
		}, this);

		xw.writeComment("Define app splash screen for each platform");
		enyo.forEach(phonegap.splashScreen && enyo.keys(phonegap.splashScreen), function(target) {
			createSplashScreenXMLRow.call(self, target);			
		}, this);

		xw.writeComment("Access external websites ressources");
		
		xw.writeStartElement('access');
		xw.writeAttributeString('origin', phonegap.access.origin);		
		xw.writeEndElement(); // access			
		
	

		xw.writeEndElement();	// widget

		//xw.writeEndDocument(); called by flush()
		str = xw.flush();
		xw.close();
		this.trace("xml:", str);
		return str;
	},

	statics: {
		DEFAULT_PROJECT_CONFIG: {
			enabled: false,
			autoGenerateXML: true,
			minification: true,
			features: {
				battery: false,
				camera: false,
				contact: false,
		        file: false,		        
		        geolocation: false,
		        media: false,
		        network: false,
		        notification: false,		                
		        device: false
			},
			preferences: {
				//shared prefrences
				"phonegap-version": Phonegap.UIConfiguration.commonDrawersContent[1].rows[0].defaultValue, 
				"orientation": Phonegap.UIConfiguration.commonDrawersContent[1].rows[1].defaultValue,
				"target-device": Phonegap.UIConfiguration.commonDrawersContent[1].rows[2].defaultValue, 
				"fullscreen": Phonegap.UIConfiguration.commonDrawersContent[1].rows[3].defaultValue,

				//Android preferences
				"android-installLocation": Phonegap.UIConfiguration.platformDrawersContent[0].rows[0].defaultValue, 
				"android-minSdkVersion": Phonegap.UIConfiguration.platformDrawersContent[0].rows[1].defaultValue, 
				"android-maxSdkVersion": Phonegap.UIConfiguration.platformDrawersContent[0].rows[2].defaultValue, 
				"splash-screen-duration": Phonegap.UIConfiguration.platformDrawersContent[0].rows[3].defaultValue, 
				"load-url-timeout": Phonegap.UIConfiguration.platformDrawersContent[0].rows[4].defaultValue, 

				//IOS preferences
				"webviewbounce": Phonegap.UIConfiguration.platformDrawersContent[1].rows[0].defaultValue, 
				"prerendered-icon": Phonegap.UIConfiguration.platformDrawersContent[1].rows[1].defaultValue, 
				"ios-statusbarstyle": Phonegap.UIConfiguration.platformDrawersContent[1].rows[2].defaultValue, 
				"detect-data-types": Phonegap.UIConfiguration.platformDrawersContent[1].rows[3].defaultValue, 
				"exit-on-suspend": Phonegap.UIConfiguration.platformDrawersContent[1].rows[4].defaultValue, 
				"show-splash-screen-spinner": Phonegap.UIConfiguration.platformDrawersContent[1].rows[5].defaultValue, 
				"auto-hide-splash-screen": Phonegap.UIConfiguration.platformDrawersContent[1].rows[6].defaultValue,

				//BlackBerry preferences
				"disable-cursor": Phonegap.UIConfiguration.platformDrawersContent[3].rows[0].defaultValue 
			},

			icon: {
				sharedConfiguration: {src: "", role: "default"},
				android: {src: "", density: "" },
				ios: {src: "", height: "", width: ""}, 
				winphone: {src: ""}, 
				blackberry: {src: ""},
				webos: {src: ""}  
			},

			splashScreen: {
				sharedConfiguration: {src: "", role: "default"},
				android: {src: "", density: "" },
				ios: {src: "", height: "", width: ""}, 
				winphone: {src: ""}, 
				blackberry: {src: ""},
				webos: {src: ""} 
			},
			plugins: {
			}, 
			access : {
				"origin": Phonegap.UIConfiguration.commonDrawersContent[1].rows[4].defaultValue
			}
		}
	}
});
