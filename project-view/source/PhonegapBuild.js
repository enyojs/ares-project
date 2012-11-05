enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	startPhonegapBuild: function(project) {
		var service, req, fileList = [],
			formData = new FormData();

		this.log("Start phonegap build: ", project);

		service = project.service.impl;		// TODO TBC
		req = service.listFiles(project.folderId, -1);
		req.response(this, function(inEvent, inData) {
			enyo.log("Got the list of files", inData);
			this.buildFileList(inData, fileList);
			var prefixLen = this.extractPrefixLen(inData);
			this.buildFormData(service, formData, fileList, 0, prefixLen);
		});
		req.error(this, function(inEvent, inData) {
			enyo.log("ERROR: ", inData);	// TODO YDM TBC
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
	buildFormData: function(service, formData, fileList, index, prefixLen) {
		if (index >= fileList.length) {
			this.log("FormData: ", formData);

			// Ask nodejs to minify and zip the project
			var req = new enyo.Ajax({
				url: 'http://127.0.0.1:9029/build',		// TODO YDM TBC Fix hardcoded URL
				method: 'POST',
				postBody: formData,
				handleAs: 'text'						// No transformation
			});
			req.response(this, function(inEvent, inData) {
				enyo.log("Got the minified zip");
				this.getToken(inData);
			});
			req.error(this, function(inEvent, inData) {
				enyo.log("ERROR: ", inData);
			});
			req.go();
		} else {
			var id = fileList[index].id;
			this.log("Fetching " + fileList[index].path.substr(prefixLen));
			var request = service.getFile(id);
			request.response(this, function(inEvent, inData) {
				var blob = new Blob([inData.content || ""], {type: "application/octet-stream"});
				formData.append('file', blob, fileList[index].path.substr(prefixLen));

				this.buildFormData(service, formData, fileList, index + 1, prefixLen);
			});
			request.error(this, function(inEvent, inData) {
				this.log("ERROR: " + inData);
			});
		}
	},
	getToken: function() {
		// TODO: Only works when chrome is launched with --disable-web-security

		// Get a phonegap token
		var req = new enyo.Ajax({
			url: 'https://build.phonegap.com/token',		// TODO YDM TBC Fix hardcoded URL
			method: 'POST',
			username: "xxx",		// TODO Should be taken from local storage
			password: "xxx"			// TODO Should be taken from local storage
		});
		req.response(this, function(inEvent, inData) {
			enyo.log("Got phonegap token: ", inData);
		});
		req.error(this, function(inEvent, inData) {
			this.log("ERROR: " + inData);
		});
		req.go();
	},
	tobecontinued: function() {
				var req, formData = new FormData();

		var blob = new Blob([zipData], {type: "application/octet-stream"});
		formData.append('file', blob, "app.zip");

		// Add the required phonegap "data"
		var data = {"title":"Hello ENYO","package":"com.enyos.hello","version":"0.1.0",create_method:"file"};	// TODO YDM TBC Hardcoded value
		blob = new Blob([JSON.stringify(data)]);
		formData.append('data', blob);

		// TODO: Only works when chrome is launched with --disable-web-security

		req = new enyo.Ajax({
			url: 'https://build.phonegap.com/api/v1/apps',		// TODO YDM TBC Fix hardcoded URL
			method: 'POST',
			postBody: formData,
			handleAs: 'text',						// No transformation
			username: "xxx",		// TODO Should be taken from local storage
			password: "yyy"			// TODO Should be taken from local storage
		});
		req.response(this, function(inEvent, inData) {
			enyo.log("Got phonegap token: ", inData);
		});
		req.error(this, function(inEvent, inData) {
			this.log("ERROR: " + inData);
		});
		req.go();
	}
});
