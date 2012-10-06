enyo.kind({
	name: "HermesService",
	kind: "enyo.Object",
	published: {
		url: null
	},
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
		return !!this.url;
	},
	setConfig: function(inConfig) {
		this.log(inConfig);
		this.config = inConfig;
		if (inConfig.auth) {
			this.auth = inConfig.auth;
		}
		if (inConfig.url) {
			this.setUrl(inConfig.url);
		}
	},
	getConfig: function() {
		return this.config;
	},
	//* @private
	_requestMethod: {
		'GET': 'GET',
		'PROPFIND': 'GET',
		'PUT': 'POST',
		'MKCOL': 'POST',
		'COPY': 'POST',
		'MOVE': 'POST',
		'DELETE': 'POST'
	},
	//* @private
	_request: function(inMethod, inNodeId, inParams) {
		//this.log(inMethod, inNodeId, inParams);
		if (!this.url) {
			throw "Service URL not yet defined";
		}
		if (this.auth) {
			//this.log(this.auth);
			inParams = enyo.mixin(inParams, {
				token: this.auth.token,
				secret: this.auth.secret
			});
		}
		var url = [this.url, 'id', inNodeId].join("/") + '?_method=' + inMethod;
		var method = this._requestMethod[inMethod];
		if (this.debug) console.log(inMethod+"/"+method+": '"+url+"'");
		if (this.debug) console.dir(inParams);
		var req = new enyo.Ajax({
			url: url,
			method: method,
			handleAs: "json"
		});
		var self = this;
		req.response(function(inSender, inValue){
			if (this.debug) console.log("inValue=");
			if (this.debug) console.dir(inValue);
			if (inValue) {
				return inValue;
			} else {
				return self._handleRequestError(inSender, 0);
			}
		}).error(this, function(inSender, inValue) {
			self._handleRequestError(inSender, inValue);
		});
		return req.go(inParams);
	},
	//* @private
	_handleRequestError: function(inSender, inCode) {
		this.error("*** code="+inCode);
		if (inCode === 0 && this.notifyFailure) {
			this.notifyFailure();
		}
	},
	listFiles: function(inFolderId, depth) {
		return this._request("PROPFIND", inFolderId, {depth: depth || 1} /*inParams*/)
			.response(function(inSender, inValue) {
				return inValue.contents;
			});
	},
	getFile: function(inFileId) {
		return this._request("GET", inFileId, null /*inParams*/)
			.response(function(inSender, inValue) {
				if (inValue) {
					// base64decode
					return { content: atob(inValue.content) };
				} else {
					return null;
				}
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
	/**
	 * @return {enyo.Async} 
	 */
	createFolder: function(inFolderId, inName) {
		var newFolder = inFolderId + "/" + inName;
		return this._request("MKCOL", inFolderId, {name: inName} /*inParams*/)
			.response(function(inSender, inResponse) {
				// FIXME: id of created folder needs to be returned from service
				// FTP node server returns an object, includes 'id' field
				// DROPBOX node server returns an object, has no 'id' field
				//console.log("AresProvider.createFolder: inResponse = ", inResponse);
				if (this.debug) console.dir(inResponse);
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
