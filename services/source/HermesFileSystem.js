enyo.kind({
	name: "HermesFileSystem",
	kind: "enyo.Component",
	debug: false,
	events: {
		onLoginFailed: ""
	},
	create: function() {
		if (this.debug) this.log();
		this.inherited(arguments);
		this.config = {};
	},
	isOk: function() {
		return !!this.config.origin;
	},
	setConfig: function(inConfig) {
		var self = this;

		if (this.debug) this.log("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		if (this.debug) this.log("=> config:", this.config);
	},
	getConfig: function() {
		return this.config;
	},
	//* @private
	_requestDic: {
		'GET':		{verb: 'GET', handleAs: "text"},	// text means no processing/no transformations, provided the charset is not understandable by the browser.
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
		var url = this.config.origin + this.config.pathname + '/id/' + (inNodeId ? inNodeId : "" ) + '?_method=' + inMethod;
		var method = this._requestDic[inMethod].verb;
		if (this.debug) this.log(inMethod+"/"+method+": '"+url+"'");
		if (this.debug) this.log("params=", inParams);
		var options = {
			url: url,
			method: method,
			handleAs: this._requestDic[inMethod].handleAs,
			postBody: inParams && inParams.postBody,
			contentType: inParams && inParams.contentType
		};

		if (inMethod === 'GET') {
			options.mimeType = 'text/plain; charset=x-user-defined';
		}

		var req = new enyo.Ajax(options);
		if (inParams && inParams.postBody) {
			delete inParams.postBody;
		}
		req.response(function(inSender, inValue){
			if (this.debug) this.log("inValue=", inValue);
			if (this.xhr.status === 0 && !inValue) {
				// work-around ENYO-970
				this.fail();
				return null;
			} else {
				var node = this.xhrResponse.headers['x-ares-node'];
				if (this.debug) this.log("GET x-ares-node:", node);
				return inValue;
			}
		}).error(function(inSender, inResponse) {
			this.error("status="+ inResponse);
			if (inResponse === 0 && this.notifyFailure) {
				this.notifyFailure();
			}
			return inResponse ; // for the daisy chain
		});
		return req.go(inParams);
	},
	authorize: function(inAuth, next) {
		var count = 1;
		if (inAuth && inAuth.headers && inAuth.headers.authorization) {
			enyo.bind(this, _authorize)();
		}

		function _authenticate() {
			if (this.debug) this.log("authenticate(): count:", count);
			if (count--) {
				if (this.debug) this.log("authenticate(): authorization:", inAuth.headers.authorization);
				// POST the Authorization
				// header/token/credential in a web-form.
				new enyo.Ajax({
					url: this.config.origin + this.config.pathname + '/',
					method: 'POST',
					handleAs: 'text'
				})
				.response(this, _authorize)
				.error(this, _authFailure)
				.go({
					authorization: inAuth.headers.authorization
				});
			}
		}
		function _authorize() {
			// GET the Authorization.  This step expects
			// that the Authorization credentials are
			// passed as a Cookie set during the
			// _authenticate() step.
			if (this.debug) this.log("authorize():");
			new enyo.Ajax({
				url: this.config.origin + this.config.pathname + '/',
				method: 'GET'
			})
			.response(this, _authSuccess)
			.error(this, _authenticate)
			.go();
		}
		function _authSuccess(inXhr, inValue) {
			if (this.debug) this.log("authSuccess(): inValue:", inValue);
			next(null, inValue);
		}
		function _authFailure(inXhr, inError) {
			if (this.debug) this.log("authFailure(): inError:", inError, ", body:", (inXhr.xhrResponse ? inXhr.xhrResponse.body : undefined));
			self.doLoginFailed({id: this.config.id});
			next(new Error(inError));
		}
	},
	propfind: function(inNodeId, inDepth) {
		return this._request("PROPFIND", inNodeId, {depth: inDepth} /*inParams*/)
			.response(function(inSender, inValue) {
				if (this.debug) this.log(inValue);
				return inValue;
			});
	},
	listFiles: function(inFolderId, depth) {
		return this.propfind(inFolderId, depth)
			.response(function(inSender, inValue) {
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
		var formData = new enyo.FormData() ;
		var file = new enyo.Blob([inContent || ''], {type: "application/octet-stream"});
		if (this.debug) this.log("file:", file);
		// ['/path','.'] resolves to '/path', so using '.'
		// keeps the file name encoded in inFileId
		formData.append('file', file, '.' /*filename*/);
		return this._request("PUT", inFileId, {postBody: formData} /*inParams*/);
	},
	createFile: function(inFolderId, inName, inContent) {
		var formData = new enyo.FormData() ;
		var file = new enyo.Blob([inContent || ''], {type: "application/octet-stream"});
		if (this.debug) this.log("file:", file, "filename:", inName);
		formData.append('file', file, inName /*filename*/);
		if (enyo.platform.firefox) {
			// FormData#append() lacks the third parameter
			// 'filename', so emulate it using a list of
			// 'filename'fields of the same size os the
			// number of files.  This only works if the
			// other end of the tip is implemented on
			// server-side.
			// http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
			formData.append('filename', inName );
		}
		return this._request("PUT", inFolderId, {postBody: formData} /*inParams*/);
	},
	createFiles: function(inFolderId, inData) {
		return this._request("PUT", inFolderId, {postBody: inData.content, contentType: inData.ctype} /*inParams*/);
	},
	createFolder: function(inFolderId, inName) {
		var newFolder = inFolderId + "/" + inName;
		return this._request("MKCOL", inFolderId, {name: inName} /*inParams*/)
			.response(function(inSender, inResponse) {
				// FIXME: id of created folder needs to be returned from service
				// FTP node server returns an object, includes 'id' field
				// DROPBOX node server returns an object, has no 'id' field
				//this.log("AresProvider.createFolder: inResponse = ", inResponse);
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
