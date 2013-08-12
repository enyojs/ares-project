/* global ares */ 
enyo.kind({
	name: "HermesFileSystem",
	kind: "enyo.Component",
	debug: false,
	events: {
		onLoginFailed: ""
	},
	create: function() {
		ares.setupTraceLogger(this);
		this.trace("");
		this.inherited(arguments);
		this.config = {};
	},
	isOk: function() {
		return !!this.config.origin;
	},
	setConfig: function(inConfig) {
		this.trace("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		this.trace("=> config:", this.config);
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
		this.trace(inMethod, inNodeId, inParams);
		if (!this.config.origin) {
			throw "Service URL not yet defined";
		}
		var url = this.config.origin + this.config.pathname + '/id/' + (inNodeId ? inNodeId : "" );
		var method = this._requestDic[inMethod].verb;
		this.trace(inMethod, "/", method, ": '", url, "'");
		this.trace("params=", inParams);
		var options = {
			url: url,
			method: method,
			handleAs: this._requestDic[inMethod].handleAs,
			postBody: inParams && inParams.postBody,
			contentType: inParams && inParams.contentType,
			headers: {
				'x-http-method-override': inMethod
			}
		};

		if (inMethod === 'GET') {
			options.mimeType = 'text/plain; charset=x-user-defined';
		}

		var req = new enyo.Ajax(options);
		if (inParams && inParams.postBody) {
			delete inParams.postBody;
		}
		req.response(this, function(inSender, inValue){
			this.trace("inValue=", inValue);
			var node = req.xhrResponse.headers['x-ares-node'];
			this.trace("x-ares-node:", node);
			return inValue;
		}).error(this, function(inSender, inResponse) {
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
			this.trace("authenticate(): count:", count);
			if (count--) {
				this.trace("authenticate(): authorization:", inAuth.headers.authorization);
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
			this.trace("authorize():");
			new enyo.Ajax({
				url: this.config.origin + this.config.pathname + '/',
				method: 'GET'
			})
			.response(this, _authSuccess)
			.error(this, _authenticate)
			.go();
		}
		function _authSuccess(inXhr, inValue) {
			this.trace("authSuccess(): inValue:", inValue);
			next(null, inValue);
		}
		function _authFailure(inXhr, inError) {
			this.trace("authFailure(): inError:", inError, ", body:", (inXhr.xhrResponse ? inXhr.xhrResponse.body : undefined));
			this.doLoginFailed({id: this.config.id});
			next(new Error(inError));
		}
	},
	propfind: function(inNodeId, inDepth) {
		return this._request("PROPFIND", inNodeId, {depth: inDepth} /*inParams*/)
			.response(this, function(inSender, inValue) {
				this.trace(inValue);
				return inValue;
			});
	},
	listFiles: function(inFolderId, depth) {
		return this.propfind(inFolderId, depth)
			.response(this, function(inSender, inValue) {
				return inValue.children;
			});
	},
	getFile: function(inFileId) {
		return this._request("GET", inFileId, null /*inParams*/)
			.response(this, function(inSender, inValue) {
				return { content: inValue };
			});
	},
	putFile: function(inFileId, inContent) {
		var formData = new enyo.FormData() ;
		var file = new enyo.Blob([inContent || ''], {type: "application/octet-stream"});
		this.trace("file:", file);
		// ['/path','.'] resolves to '/path', so using '.'
		// keeps the file name encoded in inFileId
		formData.append('file', file, '.' /*filename*/);
		if (enyo.platform.firefox) {
			// FormData#append() lacks the third parameter
			// 'filename', so emulate it using a list of
			// 'filename'fields of the same size os the
			// number of files.  This only works if the
			// other end of the tip is implemented on
			// server-side.
			// http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
			formData.append('filename', "." );
		}
		return this._request("PUT", inFileId, {postBody: formData} /*inParams*/);
	},
	createFile: function(inFolderId, inName, inContent) {
		var formData = new enyo.FormData() ;
		var file = new enyo.Blob([inContent || ''], {type: "application/octet-stream"});
		this.trace("file:", file, "filename:", inName);
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
		return this._request("MKCOL", inFolderId, {name: inName} /*inParams*/)
			.response(this, function(inSender, inResponse) {
				this.trace(inResponse);
				return inResponse;
			});
	},
	remove: function(inNodeId) {
		return this._request("DELETE", inNodeId, null /*inParams*/);
	},
	/**
	 * Only one of folderId or name can be defined.  In case both are defined
	 * name takes precedence.
	 * @param {Object} inParams
	 * @property inParams {String} folderId
	 * @property inParams {String} name
	 */
	rename: function(inNodeId, inParams) {
		if (typeof inParams === 'object') {
			return this._request("MOVE", inNodeId, inParams);
		} else {
			// backward compatible method signature
			return this._request("MOVE", inNodeId, {name: inParams}  /*inParams*/);
		}
	},
	/**
	 * Only one of folderId or name can be defined.  In case both are defined
	 * name takes precedence.
	 * @param {Object} inParams
	 * @property inParams {String} folderId
	 * @property inParams {String} name
	 */
	copy: function(inNodeId, inParams) {
		if (typeof inParams === 'object') {
			return this._request("COPY", inNodeId, inParams);
		} else {
			// backward compatible method signature
			return this._request("COPY", inNodeId, {name: inParams}  /*inParams*/);
		}
	},
	exportAs: function(inNodeId, inDepth) {
		return this._request("GET", inNodeId, {depth: inDepth, format: "base64"} /*inParams*/)
			.response(this, function(inSender, inValue) {
				this.trace(inValue);
				return inValue;
			});
	}
});
