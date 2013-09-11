enyo.kind({
	name: "FileSystemService",
	kind: "Component",
	debug: false,
	events: {
		onLogin: "",
		onFailure: ""
	},
	published: {
		rootNode: null
	},
	/**
	 * @private
	 */
	impl: null,
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.impl = null;
	},
	rootNodeChanged: function(old) {
		this.trace("rootNode:", this.rootNode, "<-", old);
	},
	connect: function(inFsService, next) {
		this.impl = inFsService;
		var req = this.impl.propfind(undefined, 0);
		req.response(this, function(inRequest, inValue) {
			this.trace("FileSystemService#connect(): connected");
			this.setRootNode(inValue);
			if (next) {
				next();
			}
		});
		req.error(this, function(inRequest, inError) {
			if (this.debug) {
				this.error("FileSystemService#connect(): connection failed");
			}
			if (next) {
				next(new Error(inError));
			}
		});
	},
	isOk: function() {
		return this.impl && this.rootNode && this.impl.isOk();
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
	 * Describe the given node & its children
	 * @param {String} inNodeId the node
	 * @param {Integer} inDepth how many folder levels to walk before returning, or "-1" or "infinity" to walk forever.
	 * @return {enyo.Async} whose #response return an {ares.Filesystem.Node} and #error returns an error cause.
	 */
	propfind: function(inNodeId, inDepth) {
		return this.impl.propfind(inNodeId, inDepth);
	},
	/**
	 * @return {enyo.Async} whose #response gives the children of the given node {ares.Filesystem.Node#children}
	 * @see FileSystemService.js
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
	 * @param {Object} inOptions
	 * @property inOptions {Boolean} overwrite [true]
	 */
	createFile: function(inFolderId, inName, inContent, inOptions) {
		return this.impl.createFile(inFolderId, inName, inContent, inOptions);
	},
	/**
	 * @return {enyo.Async} 
	 * @param {Object} inOptions
	 * @property inOptions {Boolean} overwrite [true]
	 */
	createFiles: function(inFolderId, inData, inOptions) {
		return this.impl.createFiles(inFolderId, inData, inOptions);
	},
	/**
	 * @param {String} inFolderId parent folder Id
	 * @param {String} inName folder name to create
	 * @param {Object} inOptions options
	 * @property inOptions {Boolean} overwrite [true]
	 * @return {enyo.Async} 
	 */
	createFolder: function(inFolderId, inName, inOptions) {
		return this.impl.createFolder(inFolderId, inName, inOptions);
	},
	/**
	 * @return {enyo.Async} 
	 */
	remove: function(inNodeId) {
		return this.impl.remove(inNodeId);
	},
	/**
	 * @return {enyo.Async}
	 * @param {Object} inParams
	 * @property inParams {String} folderId
	 * @property inParams {String} name
	 * @property inParams {String} overwrite [true]
	 */
	rename: function(inNodeId, inParams) {
		if (typeof inParams !== 'object') {
			throw new Error("Invalid parameter type:" + typeof inParams + " (value:" + inParams.toString() + ")");
		}
		return this.impl.rename(inNodeId, inParams);
	},
	/**
	 * @return {enyo.Async} 
	 * @param {Object} inParams
	 * @property inParams {String} folderId
	 * @property inParams {String} name
	 * @property inParams {String} overwrite [true]
	 */
	copy: function(inNodeId, inParams) {
		if (typeof inParams !== 'object') {
			throw new Error("Invalid parameter type:" + typeof inParams + " (value:" + inParams.toString() + ")");
		}
		return this.impl.copy(inNodeId, inParams);
	}
});
