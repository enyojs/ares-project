/**
 * This kind holds the consistency between the project.json and the
 * in-memory representation of the project configuration.
 * 
 * After creation of the kind, use #init(service, folderId) to
 * set the location of the project.  Those values can no longer be
 * changed.
 * 
 * - Use #setData and #getData to change the in-memory configuration Javascript object.
 *   data is an object containing the *whole* configuration.
 * - Then use #save to send the whole configuration to remote storage
 *  
 * As it is, this kind performs zero checks on the content of the file.
 */
enyo.kind({
	name: "ProjectConfig",
	kind: "enyo.Object",
	published: {
		data: {}
	},
	service: null,		// filesystem service
	folderId: null,
	fileId: null,
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * Initializer: load data from project.json file
	 * @param {Object} inLocation gives information to access project.json
	 *  (expects { service: <object>, folderId: <string>)} )
	 * @param {Object} next is a CommonJS callback
	 */
	init: function(inLocation, next) {
		this.data = null;
		this.service = inLocation.service;
		this.folderId = inLocation.folderId;
		var req = this.service.propfind(this.folderId, 1);
		req.response(this, function(inSender, inResponse) {
			var prj = inResponse.children.filter(function(node){
				return node.name === "project.json";
			});
			if (prj.length === 0) {
				// does not exist: create & save it immediatelly
				this.setData(ProjectConfig.checkConfig());
				// Use the folder name by default for the project name
				this.data.name = inResponse.name;
				this.save(next);
			} else {
				// already exists: load it
				this.fileId = prj[0].id;
				this.load(next);
			}
		});
		req.error(this, function(inSender, inError){
			enyo.error("ProjectConfig.init:", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * Force reloading the configuration from the storage
	 * @param {Function} next CommonJS callback
	 */
	load: function(next) {
		var data,
		    req = this.service.getFile(this.fileId);
		req.response(this, function(inRequest, inResponse) {
			if (this.debug) this.log("ProjectConfig.load: file=", inResponse);
			if (typeof inResponse.content === 'string') {
				try {
					data = JSON.parse(inResponse.content);
				} catch(e) {
					enyo.error("ProjectConfig.load:", e);
					inRequest.fail(e);
				}
			} else {
				data = inResponse.content;
			}
			this.data = ProjectConfig.checkConfig(data);
			if (this.debug) this.log("ProjectConfig.load config=", this.data);
			if (next instanceof Function) next();
		});
		req.error(this, function(inSender, inError) {
			this.error("ProjectConfig.load:", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * Save the current configuration to storage
	 * @param {Function} next CommonJS callback
	 */
	save: function(next) {
		var req;
		if (this.debug) this.log("data=", this.data);
		if (this.fileId) {
			req = this.service.putFile(this.fileId, JSON.stringify(this.data));
		} else {
			req = this.service.createFile(this.folderId, "project.json", JSON.stringify(this.data));
		}
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("ProjectConfig.save: inResponse=", inResponse);
			this.fileId = inResponse.id;
			if (next instanceof Function) next();
		}); 
		req.error(this, function(inSender, inError) {
			enyo.error("ProjectConfig.save: error=", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * @todo remove this function: the config.xml should only exist in the memory of the browser client
	 */
	saveXml: function(xmlString, next) {
		var req = this.service.createFile(this.folderId, "config.xml", xmlString);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("ProjectConfig.saveXml: response=", inResponse);
			this.fileId = inResponse.id;
			if (next instanceof Function) next();
		}); 
		req.error(this, function(inSender, inError) {
			this.error("***", inError);
			if (next instanceof Function) next(inError);
		});
	},
	statics: {
		checkConfig: function(inConfig) {
			var config = ProjectConfig.clone(ProjectConfig.DEFAULT_PROJECT_CONFIG);
			ProjectConfig.extend(config, inConfig);
			return config;
		},
		/**
		 * Deep-clone given object
		 * @param {Object} obj object to clone
		 * @private
		 */
		clone: function(obj) {
			return this.extend(undefined, obj);
		},
		/**
		 * Extend destination object using source object (deep)
		 * @param {Object} dst destination object
		 * @param {Object} src source object
		 * @private
		 */
		extend: function(dst, src) {
			if (dst === undefined) {
				if (!src) {
					return src;
				}
				dst = (src instanceof Array) ? [] : {};
			}
			for (var i in src) {
				if (typeof src[i] == "object") {
					dst[i] = this.extend(dst[i], src[i]);
				} else {
					dst[i] = src[i];
				}
			}
			return dst;
		},
		DEFAULT_PROJECT_CONFIG: {
			id: "com.examples.apps.MyApp",
			name: "BUG IF YOU SEE THIS",
			version: "0.0.1",
			title: "Example: My Application",
			description: "Description of My Application",
			build: {
				phonegap: {
					enabled: true
				}
			}
		}
	}
});
