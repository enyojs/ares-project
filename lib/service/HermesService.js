enyo.kind({
	name: "HermesService",
	kind: "Component",
	published: {
		//url: "http://itch.selfip.net:9000/hermes"
		//url: "/enyojs/ares/ares2v2/php/localFiles/files.php/"
		//url: "http://localhost:3000"
		url: "http://184.169.139.5:8080"
	},
	events: {
		onLogin: "",
		onFailure: ""
	},
	create: function() {
		this.inherited(arguments);
	},
	makeUrl: function(inMethod, inId) {
		return [this.url, inMethod, inId].join("/")
	},
	request: function(inMethod, inPathId, inParams, inHttp, inHandleAs) {
		//this.log(inMethod, inPathId);
		if (this.auth) {
			//this.log(this.auth);
			inParams = enyo.mixin(inParams, {
				token: this.auth.token,
				secret: this.auth.secret
			});
		}
		var path = inPathId;
		//var path = this.preparePath(inPathId);
		return new enyo.Ajax({
			url: this.makeUrl(inMethod, path),
			method: inHttp || "GET",
			handleAs: inHandleAs || "json"
		}).go(inParams);
	},
	//
	listFiles: function(inFolderId) {
		return this.request("list", inFolderId)
			.response(function(inSender, inValue) {
				return inValue.contents;
			})
			;
	},
	fetchFileUrl: function(inFileId) {
		var path = this.preparePath(inFileId);
		return this.makeUrl("get", path);
	},
	getFile: function(inFileId) {
		return this.request("get", inFileId, null, null, "text");
	},
	putFile: function(inFileId, inContent) {
		return this.request("put", inFileId, {content: inContent || ""}, "POST");
	},
	createFile: function(inFolderId, inName, inContent) {
		return this.request("createfile", inFolderId + "/" + inName, {content: inContent || ""}, "POST")
			.response(function() {
				return inFolderId;
			})
			;
	},
	createFolder: function(inFolderId, inName) {
		var newFolder = inFolderId + "/" + inName;
		return this.request("createfolder", newFolder)
			.response(function(inSender, inResponse) {
				// FIXME: id of created folder needs to be returned from service
				// FTP node server returns an object, includes 'id' field
				// DROPBOX node server returns an object, has no 'id' field
				//console.log("AresProvider.createFolder: inResponse = ", inResponse);
				return inResponse.id || inResponse.path || newFolder;
			})
			;
	},
	deleteFile: function(inFileId) {
		return this.request("deletefile", inFileId);
	},
	deleteFolder: function(inFolderId) {
		return this.request("deletefolder", inFolderId);
	},
	renameFile: function(inFileId, inNewName) {
		return this.request("renameFile", inFileId, {name: inNewName}, "GET");
	},
	renameFolder: function(inFileId, inNewName) {
		return this.request("renameFolder", inFileId, {name: inNewName}, "GET");
	}
});
