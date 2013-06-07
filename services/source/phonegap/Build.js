enyo.kind({
	name: "Phonegap.Build",
	kind: "enyo.Component",
	events: {
		onLoginFailed: "",
		onShowWaitPopup: ""
	},
	published: {
		application: ""
	},
	components: [
		{kind: "Phonegap.BuildStatusUI",
		 name: "buildStatusPopup"
		}
	],
	debug: true,
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
	 * This function send an Ajax request to node.js in order to get all the
	 * details about the project built in Phongap platform.
	 * 
	 * @param  {[type]}   project contain informations about the Ares project
	 * @param  {Function} next    is a CommonJS callback
	 * @private
	 */
	_getBuildStatus: function(project, next){
		
		var config = project.getConfig().getData();
		var appId = config.build.phonegap.appId;
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
	 * This function do the same thing as the function _getBuildStatus except
	 * the fact that it's binded in the "buildStatus" function.
	 * @Me this function should be refactored. 
	 * 
	 * @param  {JSON}   project [description]
	 * @param  {Function} next    CommonJs callback
	 * @protected 
	 */
	_getBuildStatusPopup: function(project, next){
		
		var config = project.getConfig().getData();
		var appId = config.build.phonegap.appId;
		var url = this.url + '/api/v1/apps/' + appId;
		
		//Creation of the Ajax request
		var req = new enyo.Ajax({
			url: url
		});

		//in case of sucess send the obtained JSON object to the next function
		//in the Async.waterfall.
		req.response(this, function(inSender, inData) {
			//this.log("the sender: ", inSender);
		
		  // activate the pop up to view the results
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
	 * show the pop-up containing informations about the previous  build of the 
	 * selected project from the project list view.
	 * 
	 * @param  {JSON}   project contain a description about the current selected
	 *                          project
	 * @param  {Function} next    is a CommonJs callback
	 * @private
	 */
	_showBuildStatus: function(project, next){
	 	
	 	self = this;
	 	async.series([
    		function(callback){
        		var inUserData = next.user;
	 			self.$.buildStatusPopup.showPopup(project, inUserData);
        		callback(null, 'one');
   			 },
    		function(callback){
        		next();
        		callback(null, 'two');
   			 }
		]);
	 	
	 },
	/**
	 * Store relevant user account data
	 * 
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
			enyo.bind(this, this._getProjectData, project),
			enyo.bind(this, this._getFilesData, project),
			enyo.bind(this, this._submitBuildRequest, project),
			enyo.bind(this, this._prepareStore, project),
			enyo.bind(this, this._store, project),
		], next);
	},
	/**
	 * Communicate with Phonegap build in order to get the curent status of the
	 * built project. This status are showen in a Pop-up defined in the file
	 * BuildStatusUI.js
	 * 
	 * @param  {JSON}   project contain a description about the current selected
	 *                          project
	 * @param  {Function} next    is a CommonJS Callback
	 * @public
	 */
	buildStatus: function(project, next) {
		if (this.debug) this.log("Getting build status:  " + this.url + '/build');
		async.waterfall([
			enyo.bind(this, this.authorize),
			enyo.bind(this, this._getProjectData, project),
			enyo.bind(this, this._getBuildStatusPopup, project),			
			enyo.bind(this, this._showBuildStatus, project)
		], next);
	},
	/**
	 * Collect & check information about current project
	 * @private
	 */
	_getProjectData: function(project, userData, next) {
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
		if (this.debug) this.log("appId:", config.build.phonegap.appId);
		next(null);
	},
	/**
	 * Get the list of files of the project for further upload
	 * @param {Object} project
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	_getFilesData: function(project, next) {
		if (this.debug) this.log("...");
		var req, fileList = [];
		this.doShowWaitPopup({msg: $L("Fetching application source code")});
		req = project.getService().exportAs(project.getFolderId(), -1 /*infinity*/);
		req.response(this, function(inSender, inData) {
			if (this.debug) this.log("Phonegap.Build#_getFilesData()", "Got the files data");
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
			//xxxx
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
	 * Send an Ajax request to Node.js in order to initiate the download of an
	 * application in a specific mobile platform.
	 * 
	 * @param  {JSON}   project contain a description about the current selected
	 *                          project
	 * @param  {[type]}   inURL   is a url suffixe that contains: AppID, the
	 *                            targeted build platform, an the title of the
	 *                            application.
	 * @param  {Function} next    is a CommunJS callback.
	 * @private
	 */
	_sendDownloadRequest: function(project, inURL, next){
		
		var config = project.getConfig().getData();
		var url =this.url+ '/api/v1/apps/' + inURL;
		if (this.debug){
			this.log("download URL is : ", url);
		}
		
		//Definition of the Ajax request 
		var req = new enyo.Ajax({
			url: url,
			handleAs: 'text'
		});		

		//Handling a successfull response
		req.response(this, function(inSender, inData) {
			if (this.debug) this.log("response: received " + inData.length + " bytes typeof: " + (typeof inData));
			var ctype = req.xhrResponse.headers['content-type'];
			if (this.debug) this.log("response: received ctype: " + ctype);
			next(null, {content: inData, ctype: ctype});			
		});

		//Handling a failure response
		req.error(this, function(inSender, inError) {
			// invalidate token
			this.config.auth.token = null;
			ServiceRegistry.instance.setConfig(this.config.id, 
				{auth: this.config.auth});
			
			// report the error
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
			}			
		});

		//Execution of the Ajax request
		req.go({token: this.config.auth.token}); 
		// FIXME: remove the token as soon as the cookie works...
	},	
	/**
	 * Prepare the folder where to store the built package
	 * @param  {JSON}   project contain a description about the current selected
	 *                          project
	 * @param  {[type]}   inData  [description]
	 * @param  {Function} next    [description]
	 * @private
	 */
	_prepareStore: function(project, inData, next) {
		var folderKey = "build." + this.getName() + ".target.folderId",
		    folderPath = "target/" + this.getName();

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
	 * Create a file in the target repository of the project form a multipart/form
	 * data.
	 * 
	 * * @param  {JSON}   project contain a description about the current selected
	 *                            project
	 * @param  {String}   folderId id used in Hermes File system to identify the 
	 *                             target folder where the downloaded applications
	 *                             will be stored.
	 * @param  {JSON}   inData   contains detailed information about the build of
	 *                           the project.
	 * @param  {Function} next     a CommonJs callback.
	 * @private            
	 */
	_storePkg: function(project, folderId, inData, next) {
		if(this.debug){		
			this.log("**data content.ctype: ", inData.ctype);	
		}	

		var req = project.getService().createFiles(folderId, 
			{content: inData.content, ctype: inData.ctype});

		req.response(this, function(inSender, inData) {
			if (this.debug) this.log("response received ", inData);
			var config = project.getService().config;
			var pkgUrl = config.origin + config.pathname + '/file' + inData[0].path; // TODO: YDM: shortcut to be refined
			project.setObject("build.phonegap.target.pkgUrl", pkgUrl);
			next();
		});
		req.error(this, this._handleServiceError.bind(this, "Unable to store pkg", next));
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
	 * @param  {JSON}   project contain a description about the current selected
	 *                          project
	 * @param  {[type]}   folderId id of the target folder where to store the
	 *                             packaged file.
	 * @param  {[type]}   appData  multipart data form containing the application
	 *                             to store
	 * @param  {Function} next     a CommonJs callback
	 
	 * @private
	 */
	_store: function(project, folderId, appData, next) {
	
		enyo.Signals.send("onUpdateAppData", {appData: appData});
		
		var appKey = "build." + this.getName() + ".app";
		if(this.debug){
		 this.log("Entering _store function"+
			"project: ", project, 
			" folderId: ", folderId,
			",appData:  ", appData);
		}

		project.setObject(appKey, appData);
		//saving the context of this kind.		
		var self = this;
		
		//Mobile platforms supported by Phonegap build service.
		var platforms = ["android", "ios", "winphone", "blackberry", "symbian", "webos"];

		/* 
		* Parallel tasks are lauched to check the build status in each platform.
		* A status can be : complete, pending or error.
		* 	- completed: a request is made to node.js to 
		*	 			download the application.
		*	- pending: another request is sent to phonegap to check for an
		*	           updated status.
		*	- error: an error message is displayed.		
		*/	
		async.forEach(platforms,
		    function(platform, next) {
		    	self.log("Send request for the platform: ", platform);
		        async.whilst(
		        	function() {
		        		//Truthfull condition to send a new check status request
		        		//to Phongap build. 
   		    			return appData.status[platform] === "pending";
		        	},
	   		    	function (next) {
	   		    		async.waterfall([
	   		    			function (next) {
	   		    				//Timeout before sending a new check status request
	   		        			setTimeout(next, 3000);
	   		    			},
	   		    			function (next) {
	   		    				if(this.debug){
	   		    					self.log("sending another get Status check request");
	   		    				}
	   		    				self._getBuildStatus(project, next);
	   		    			},
	   		    			function(inData, next) {
	   		    				//get the result from the previous status check request
	   		    				appData = inData.user;
	   		    				if(this.debug){
	   		    				self.log("the new appData for "+platform+
	   		    					     " is : ", appData);
	   		    				}
	   		    				next();
	   		    			}
	   		    		], next);
	   		    	},
	   		    	//This function is run when the whilst condition in no longer
	   		    	//satisfied
	   		    	function(err) {
	   		    		//in the case of exception.
	   		    		if (err) {
	   		    			next(err);
	   		    			if(this.debug){
	   		    				self.error("error occured in the request:"+
	   		    				     " when checking for the Application status");
	   		    			}
	   		    		} else {
	   		    			//if the status is complete then a download request
	   		    			//is sent to Node.js server.
	   		    			if (appData.status[platform] === "complete"){
	   		    				async.waterfall([
	   		    					function(next){
	   		    						//make the download request.
	   		    						appID = appData.id;
	   		    						title = appData.title;
	   		    						if (appData.version != null){
	   		    						   version = appData.version;
	   		    						} else{
	   		    							version = "SNAPSHOT_1";
	   		    						}
	   		    						
	   		    						    						
	   		    						var url_suffixe = appID +
	   		    								  '/' + platform +
	   		    								  '/' + title + 
	   		    								  '/' + version;
	   		    						if(self.debug){
		   		    						self.log("Application "+ platform
		   		    					     +" ready for download");
	   		    						}
	   		    						self._sendDownloadRequest(project, 
	   		    							url_suffixe, next);
	   		    					},
	   		    					//inData is a multipart/form containing the
	   		    					//built application
	   		    					function(inData, next){
	   		    						self._storePkg(project, folderId, 
	   		    						inData, next);
	   		    						
	   		    					}
	   		    				], next);
	   		    			}
	   		    			else if (appData.status[platform] === "error") {
	   		    				if(self.debug){
	   		    					//Display the cause of the failure of the build
	   		    					//this information is contained in the JSON
	   		    					//object reterned by the check status request
	   		    					self.log("Error: ", appData.error[platform]);
	   		    				}
	   		    			}		   		    			    			
	   		    		}
	   		    	}
	   		    );		       
		    }, 
		next);
	}	
});


