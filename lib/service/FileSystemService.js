enyo.kind({
	name: "FileSystemService",
	kind: "Component",
	events: {
		onLogin: "",
		onFailure: ""
	},
	create: function() {
		this.inherited(arguments);
		this.impl = null;
	},
	connect: function(inFsService) {
		this.impl = inFsService && inFsService.impl;
	},
	isOk: function() {
		return this.impl && this.impl.isOk();
	},
	/**
	 * Configure the instance
	 * @param {Object} conf 
	 * @return {undefined}
	 */
	setConfig: function(config) {
		this.impl.setConfig(config);
	},
	/**
	 * @return {Object} the instance configuration, as set by FileSystemService.setConfig.
	 */
	getConfig: function() {
		return this.impl.getConfig();
	},
	/**
	 * @return {enyo.Async}
	 */
	listFiles: function(inFolderId, inDepth) {
		return this.impl.listFiles(inFolderId, inDepth);
	},
	/**
	 * @return {enyo.Async} 
	 */
	getFile: function(inFileId) {
		return this.impl.getFile(inFileId);
	},
	/**
	 * @return {enyo.Async} 
	 */
	putFile: function(inFileId, inContent) {
		return this.impl.putFile(inFileId, inContent);
	},
	/**
	 * @return {enyo.Async} 
	 */
	createFile: function(inFolderId, inName, inContent) {
		return this.impl.createFile(inFolderId, inName, inContent);
	},
	/**
	 * @return {enyo.Async} 
	 */
	createFolder: function(inFolderId, inName) {
		return this.impl.createFolder(inFolderId, inName);
	},
	/**
	 * @return {enyo.Async} 
	 */
	remove: function(inNodeId) {
		return this.impl.remove(inNodeId);
	},
	/**
	 * @return {enyo.Async} 
	 */
	rename: function(inNodeId, inNewName) {
		return this.impl.rename(inNodeId, inNewName);
	},
	/**
	 * @return {enyo.Async} 
	 */
	copy: function(inNodeId, inNewName) {
		return this.impl.copy(inNodeId, inNewName);
	}
});
