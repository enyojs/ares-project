enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	events: {
		onBuildStarted: ""
	},
	debug: false,
	/**
	 * @private
	 */
	create: function() {
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
		enyo.mixin(this.config, inConfig);
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
		if(this.config.auth && this.config.auth.token) {
			this.getFileList(project, next);
			return;
		}

		// Pass credential information to get a phonegapbuild token
		var data = "username=" + encodeURIComponent(this.config.auth.username) +
			    "&password=" + encodeURIComponent(this.config.auth.password);
		
		// Get a phonegapbuild token for the Hermes build service
		var req = new enyo.Ajax({
			url: this.url + '/token',
			method: 'POST',
			postBody: data,
			handleAs: "json"
		});
		req.response(this, function(inSender, inData) {
			this.config.auth.token = inData.token;
			if (this.debug) this.log("Got phonegap token: " + this.token);
			
			// Now get the list of all the files of the project
			this.getFileList(project, next);
		});
		req.error(this, function(inSender, inError) {
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['Content-Type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
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
		var config = project.config.getData();
		if (this.debug) this.log("...");
		// Add token information in the FormData
		formData.append('token', this.config.auth.token);
		formData.append('title', config.title);
		if (config.build.phonegap.appId) {
			if (this.debug) this.log("appId: " + config.build.phonegap.appId);
			formData.append('appId', config.build.phonegap.appId);
		}

		// un-comment to NOT submit the ZIP to
		// build.phonegap.com & rather return the given JSON.
		// Use a non-JSON string to cause an error on the
		// server side before submission.
		//formData.append('testJsonResponse', "make_an_error" /*JSON.stringify({id: config.build.phonegap.appId})*/ );

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
			var response = inSender.xhrResponse, contentType, details;
			if (response) {
				contentType = response.headers['content-type'];
				if (contentType && contentType.match('^text/plain')) {
					details = response.body;
				}
			}
			next(new Error("Unable to build application:" + inError), details);
		});
		req.go();
	}
});
