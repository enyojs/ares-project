enyo.kind({
	name: "HermesService",
	kind: "enyo.Object",
	debug: false,
	events: {
		onLogin: "",
		onFailure: ""
	},
	create: function() {
		this.inherited(arguments);
		this.auth = undefined;
	},
	isOk: function() {
		return !!this.config.origin;
	},
	setConfig: function(inConfig) {
		this.log(inConfig);
		this.config = inConfig;
		if (inConfig.auth) {
			this.auth = inConfig.auth;
		}
	},
	getConfig: function() {
		return this.config;
	},
	//* @private
	_requestDic: {
		'GET':		{verb: 'GET', handleAs: undefined},
		'PROPFIND':	{verb: 'GET', handleAs: "json"},
		'PUT':		{verb: 'POST', handleAs: "json"},
		'MKCOL':	{verb: 'POST', handleAs: "json"},
		'COPY':		{verb: 'POST', handleAs: "json"},
		'MOVE':		{verb: 'POST', handleAs: "json"},
		'DELETE':	{verb: 'POST', handleAs: "json"}
	},
	//* @private
	_request: function(inMethod, inNodeId, inParams) {
		if (this.debug) this.log(inMethod, inNodeId, inParams);
		if (!this.config.origin) {
			throw "Service URL not yet defined";
		}
		if (this.auth) {
			if (this.debug) this.log(this.auth);
			inParams = enyo.mixin(inParams, {
				token: this.auth.token,
				secret: this.auth.secret
			});
		}
		var url = this.config.origin + this.config.pathname + '/id/' + inNodeId + '?_method=' + inMethod;
		var method = this._requestDic[inMethod].verb;
		if (this.debug) console.log(inMethod+"/"+method+": '"+url+"'");
		if (this.debug) console.dir(inParams);
		var req = new enyo.Ajax({
			url: url,
			method: method,
			handleAs: this._requestDic[inMethod].handleAs
		});
		var self = this;
		req.response(function(inSender, inValue){
			if (this.debug) this.log("inValue=", inValue);
			if (this.xhr.status === 0 && !inValue) {
				// work-around ENYO-970
				this.fail();
				return null;
			} else {
				return inValue;
			}
		}).error(this, function(inSender, inValue) {
			this.error("*** status="+req.xhr.status);
			if (req.xhr.status === 0 && this.notifyFailure) {
				this.notifyFailure();
			}
		});
		return req.go(inParams);
	},
	listFiles: function(inFolderId, depth) {
		return this._request("PROPFIND", inFolderId, {depth: depth || 1} /*inParams*/)
			.response(function(inSender, inValue) {
				if (this.debug) this.log(inValue);
				return inValue.children;
			});
	},
	getFile: function(inFileId) {
		return this._request("GET", inFileId, null /*inParams*/)
			.response(function(inSender, inValue) {
				return { content: inValue };
			});
	},
	putFile: function(inFileId, inContent) {
		return this._request("PUT", inFileId, {
			// base64encode
			content: btoa(inContent)
		} /*inParams*/);
	},
	createFile: function(inFolderId, inName, inContent) {
		return this._request("PUT", inFolderId, { name: inName, content:  btoa(inContent || '') } /*inParams*/)
			.response(function() {
				return inFolderId;
			});
	},
	createFolder: function(inFolderId, inName) {
		var newFolder = inFolderId + "/" + inName;
		return this._request("MKCOL", inFolderId, {name: inName} /*inParams*/)
			.response(function(inSender, inResponse) {
				// FIXME: id of created folder needs to be returned from service
				// FTP node server returns an object, includes 'id' field
				// DROPBOX node server returns an object, has no 'id' field
				//console.log("AresProvider.createFolder: inResponse = ", inResponse);
				if (this.debug) this.log(inResponse);
				return inResponse.id || inResponse.path || newFolder;
			});
	},
	remove: function(inNodeId) {
		return this._request("DELETE", inNodeId, null /*inParams*/);
	},
	rename: function(inNodeId, inNewName) {
		return this._request("MOVE", inNodeId, {name: inNewName} /*inParams*/);
	},
	copy: function(inNodeId, inNewName) {
		return this._request("COPY", inNodeId, {name: inNewName}  /*inParams*/);
	}
});
