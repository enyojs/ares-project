/**
 * WebSandboxService
 * 
 * @see http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
enyo.kind({
	name: "WebSandboxService",
	kind: "enyo.Object",
	debug: false,
	events: {
		onFailure: ""
	},
	create: function() {
		this.inherited(arguments);
		this.fs = chrome.fileSystem;
		this.log(this.fs);
	},
	isOk: function() {
		return true;
	},
	setConfig: function(inConfig) {
		this.debug && this.log(inConfig);
		this.config = inConfig;
	},
	getConfig: function() {
		return this.config;
	},
	listFiles: function(inFolderId, depth) {
		return this.request(function(inFolderId, depth){
			return {listFiles: arguments};
		});
	},
	getFile: function(inFileId) {
		return this.request(function(inFileId){
			return {getFile: arguments};
		});
	},
	putFile: function(inFileId, inContent) {
		return this.request(function(inFileId, inContent){
			return {putFile: arguments};
		});
	},
	createFile: function(inFolderId, inName, inContent) {
		return this.request(function(inFolderId, inName, inContent){
			return {createFile: arguments};
		});
	},
	createFolder: function(inFolderId, inName) {
		return this.request(function(inNodeId, inName){
			return {createFolder: arguments};
		});
	},
	remove: function(inNodeId) {
		return this.request(function(inNodeId, inNewName){
			return {remove: arguments};
		});
	},
	rename: function(inNodeId, inNewName) {
		return this.request(function(inNodeId, inNewName){
			return {rename: arguments};
		});
	},
	copy: function(inNodeId, inNewName) {
		return this.request(function(inNodeId, inNewName){
			return {copy: arguments};
		});
	},
	//* @private
	request: function(inAction) {
		var req = new enyo.Async();
		req.go = function() {
			inAction(arguments);
			return this;
		};
		return req.go();
	},
	//* @private
	errorHandler: function(e) {
		var msg = "";
		switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = "QUOTA_EXCEEDED_ERR";
			break;
		case FileError.NOT_FOUND_ERR:
			msg = "NOT_FOUND_ERR";
			break;
		case FileError.SECURITY_ERR:
			msg = "SECURITY_ERR";
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = "INVALID_MODIFICATION_ERR";
			break;
		case FileError.INVALID_STATE_ERR:
			msg = "INVALID_STATE_ERR";
			break;
		default:
			msg = "Unknown Error";
			break;
		};
		this.error("Error: " + msg);
	}
});
