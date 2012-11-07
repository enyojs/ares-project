enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	events: {
		onError: "",
		onBuildStarted: ""
	},
	/**
	 * startPhonegapBuild initiates the phonegap build
	 * of the project passed as a parameter
	 *
	 * The following actions will be performed:
	 * - Get a phongapbuild token
	 * - Get the file list of the project
	 * - Download all the project files
	 * - Build a multipart/form-data with all the project data
	 * - Send it to nodejs which will submit the build request
	 * - Save the appid
	 * @param  project
	 * @param  credentials
	 */
	startPhonegapBuild: function(project, credentials) {
		this.debug && this.log("Start phonegap build: ", project);
		var formData = new FormData();

		// Add credential information in the FormData to get a phonegapbuild token
		formData.append('username', credentials.username);
		formData.append('password', credentials.password);

		// Get a phonegapbuild token
		var req = new enyo.Ajax({
			url: 'http://127.0.0.1:9029/token',		// TODO xxxx
			method: 'POST',
			postBody: formData
		});
		req.response(this, function(inEvent, inData) {
			this.token = inData.token;
			this.debug && enyo.log("Got phonegap token: " + this.token);
			// Now get the list of all the files of the project
			this.getFileList(project);
		});
		req.error(this, function(inEvent, inData) {
			this.log("ERROR while getting token: " + inData);
			this.doError({msg: "Unable to get phonegapbuild token"});
		});
		req.go();
	},
	/**
	 * Get the list of files of the project for further upload
	 * @param  project
	 */
	getFileList: function(project) {
		var service, req, fileList = [],
			formData = new FormData();

		service = project.service.impl;		// TODO TBC find a smarter/cleaner way
		req = service.listFiles(project.folderId, -1);
		req.response(this, function(inEvent, inData) {
			this.debug && enyo.log("Got the list of files", inData);
			// Extract the list into an array
			this.buildFileList(inData, fileList);
			var prefixLen = this.extractPrefixLen(inData);
			// Start downloading files and building the FormData
			this.downloadFiles(service, formData, fileList, 0, prefixLen);
		});
		req.error(this, function(inEvent, inData) {
			this.log("ERROR while getting file list: " + inData);
			this.doError({msg: "Unable to get project file list"});
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
			this.debug && this.log("Dir : ", inData.path);
			for(var item in inData.children) {
				this.listAllFiles(inData.children[item], fileList);
			}
		} else {
			this.debug && this.log("File: ", inData.path);
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
	 * @param  service
	 * @param  formData
	 * @param  fileList
	 * @param  index
	 * @param  prefixLen
	 */
	downloadFiles: function(service, formData, fileList, index, prefixLen) {
		// Still some files to download. Get one.
		var id = fileList[index].id;
		var name = fileList[index].path.substr(prefixLen);
		this.debug && this.log("Fetching " + name + " " + index + "/" + fileList.length);
		var request = service.getFile(id);
		request.response(this, function(inEvent, inData) {
			// Got a file content: add it to the multipart/form-data
			var blob = new Blob([inData.content || ""], {type: "application/octet-stream"});
			formData.append('file', blob, name);

			if (++index >= fileList.length) {
				// No more file to download: submit the build request
				this.submitBuildRequest(formData);
			} else {
				// Get the next file (will submit the build if no more file to get)
				this.downloadFiles(service, formData, fileList, index, prefixLen);
			}
		});
		request.error(this, function(inEvent, inData) {
			this.log("ERROR while downloading files: " + inData);
			this.doError({msg: "Unable to download project files"});
		});
	},
	submitBuildRequest: function(formData) {
		// Add token information in the FormData
		formData.append('token', this.token);
		formData.append('title', "Hello ENYO");
		if (this.appid) {
			formData.append('appid', this.appid);
		}

		// Ask nodejs to minify and zip the project
		var req = new enyo.Ajax({
			url: 'http://127.0.0.1:9029/build',		// TODO YDM TBC Fix hardcoded URL
			method: 'POST',
			postBody: formData,
			handleAs: 'text'						// No transformation
		});
		req.response(this, function(inEvent, inData) {
			this.storeAppid(inData);
		});
		req.error(this, function(inEvent, inData) {
			this.log("ERROR while submitting build request: " + inData);
			this.doError({msg: "Unable to submit build request"});
		});
		req.go();
	},
	storeAppid: function(inData) {
		enyo.log("Build result: " + inData);
		this.appid = inData.id;
		this.doBuildStarted();
	}
});
