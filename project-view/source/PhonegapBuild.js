enyo.kind({
	name: "PhonegapBuild",
	kind: "enyo.Component",
	startPhonegapBuild: function(project) {
		var formData = new FormData();

		this.log("Start phonegap build: ", project);

		var service = project.service.impl;		// TODO TBC
		var req = service.listFiles(project.folderId, -1);
		var fileList = [];
		req.response(this, function(inEvent, inData) {
			enyo.log("RESPONSE: ", inData);
			this.buildFileList(inData, fileList);
			var prefixLen = this.extractPrefixLen(inData);
			this.buildFormData(service, formData, fileList, 0, prefixLen);
		});
		req.error(this, function(inEvent, inData) {
			enyo.log("ERROR: ", inData);
		});

	},
	buildFileList: function(inData, fileList) {
		for(var item in inData) {
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
			this.log("DONE");

			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'http://127.0.0.1:9029/build', true);		// TODO TBC
			xhr.onload = function(e) {
				enyo.log("form data onload: ", xhr);
			};

			xhr.send(formData);
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
	}
});


