enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	events: {
		onBuildStarted: ""
	},
	debug: false,
	/**
	 * Set PhoneGap build base parameters.
	 * 
	 * If defined, the {auth} property is immediately saved in the
	 * localStorage.
	 * 
	 * @param {Object} inConfig
	 */
	setConfig: function(inConfig) {
		if (inConfig.origin && inConfig.pathname) {
			this.url = inConfig.origin + inConfig.pathname;
			if (this.debug) this.log("url", this.url);
		}
		if (inConfig.id) {
			this.id = inConfig.id;
			if (this.debug) this.log("id", this.id);
		}
		if (inConfig.auth && inConfig.auth !== this.auth) {
			this.auth = inConfig.auth;
			if (this.debug) this.log("auth"); // do not log() auth!
			ServiceRegistry.instance.setConfig(this.id, {auth: this.auth});
		}
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

		if(!config && !config.build && !config.build.phonegap) {
			next(new Error("Project not configured for Phonegap Build"));
			return;
		}
		if (this.debug) this.log("appId: " + config.build.phonegap.appId);

		this.getToken(project, next);
	},
	/**
	 * Get a developer token from user's credentials
	 * @param {Object} project
	 * @param {Function} next is a CommonJS callback
	 * @private
	 */
	getToken: function(project, next) {
		if (this.debug) this.log("...");
		if(this.auth && this.auth.token) {
			this.getFileList(project, next);
			return;
		}

		// Pass credential information to get a phonegapbuild token
		var data = "username=" + encodeURIComponent(this.auth.username) +
			    "&password=" + encodeURIComponent(this.auth.password);
		
		// Get a phonegapbuild token for the Hermes build service
		var req = new enyo.Ajax({
			url: this.url + '/token',
			method: 'POST',
			postBody: data,
			handleAs: "json"
		});
		req.response(this, function(inSender, inData) {
			this.auth.token = inData.token;
			if (this.debug) this.log("Got phonegap token: " + this.token);
			
			// Now get the list of all the files of the project
			this.getFileList(project, next);
		});
		req.error(this, function(inSender, inError) {
			var response = inSender.xhrResponse,
			    contentType = response.headers['Content-Type'],
			    details;
			if (contentType && contentType.match('^text/plain')) {
				details = response.body;
			}
			next(new Error("Unable to get PhoneGap application token:" + inError), details);
		});
		req.go();
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
		req = project.filesystem.listFiles(project.folderId, -1);
		req.response(this, function(inEvent, inData) {
			this.doBuildStarted({project: project});
			if (this.debug) enyo.log("Got the list of files", inData);
			// Extract the list into an array
			this.buildFileList(inData, fileList);
			var prefixLen = this.extractPrefixLen(inData);
			// Start downloading files and building the FormData
			var formData = new FormData();
			this.downloadFiles(project, formData, fileList, 0, prefixLen, next);
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
			var blob = new Blob([inData.content || ""], {type: "application/octet-stream"});
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
		var config = project.config.getData();
		if (this.debug) this.log("...");
		// Add token information in the FormData
		formData.append('token', this.auth.token);
		formData.append('title', config.title);
		if (config.build.phonegap.appId) {
			if (this.debug) this.log("appId: " + config.build.phonegap.appId);
			formData.append('appId', config.build.phonegap.appId);
		}

		// Ask Hermes PhoneGap Build service to minify and zip the project
		var req = new enyo.Ajax({
			url: this.url + '/build',
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
			var response = inSender.xhrResponse,
			    contentType = response.headers['Content-Type'],
			    details;
			if (contentType && contentType.match('^text/plain')) {
				details = response.body;
			}
			next(new Error("Unable to build application:" + inError), details);
		});
		req.go();
	}
});
