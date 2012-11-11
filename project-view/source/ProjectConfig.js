/**
 * This kind holds the consistency between the project.json and the
 * in-memory representation of the project configuration.
 * 
 * After creation of the kind, use #init(service, folderId) to
 * set the location of the project.  Those values can no longer be
 * changed.
 * 
 * - Use #setData and #getData to change the in-memory configuration Javascript object.
 * - Use #loadData and #saveData to flush the Javascript object on the disk, as JSON
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
	debug: true,
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * Initializer
	 * @param {Object} inConfig is the configuration data as to be found in the project.json
	 * @param {Object} next is a CommonJS callback
	 */
	init: function(inConfig, next) {
		this.service = inConfig.service;
		this.folderId = inConfig.folderId;
		var req = this.service.propfind(this.folderId);
		req.response(this, function(inSender, inResponse) {
			var prj = inResponse.children.filter(function(node){
				return node.name === "project.json";
			});
			if (prj.length === 0) {
				// does not exist: create & save it immediatelly
				this.setData(enyo.clone(ProjectConfig.DEFAULT_PROJECT_CONFIG));
				// Use the folder name by default for the project name
				this.data.name = inResponse.name;
				this.saveData(next);
			} else {
				// already exists: load it
				this.fileId = prj[0].id;
				this.loadData(next);
			}
		});
		req.error(this, function(inSender, inError){
			enyo.error("ProjectConfig.init:", inError);
			next && next(inError);
		});
	},
	loadData: function(next) {
		var data,
		    req = this.service.getFile(this.fileId);
		this.data = enyo.clone(ProjectConfig.DEFAULT_PROJECT_CONFIG);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("ProjectConfig.loadData: response=", inResponse);
			if (typeof inResponse.content === 'string') {
				try {
					data = JSON.parse(inResponse.content);
				} catch(e) {
					enyo.error("ProjectConfig.loadData:", e);
					req.fail(e);
				}
			} else {
				data = inResponse.content;
			}
			enyo.mixin(this.data, data);
			if (this.debug) enyo.log("ProjectConfig.loadData data=", this.data);
		});
		req.error(this, function(inSender, inError) {
			enyo.error("ProjectConfig.loadData:", inError);
			next && next(inError);
		});
	},
	saveData: function(next) {
		var req;
		if (this.fileId) {
			req = this.service.putFile(this.fileId, JSON.stringify(this.data));
		} else {
			req = this.service.createFile(this.folderId, "project.json", JSON.stringify(this.data));
		}
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("saveData response:", inResponse);
			this.fileId = inResponse.id;
			next && next();
		}); 
		req.error(this, function(inSender, inError) {
			enyo.error("ProjectConfig.loadData:", inError);
			next && next(inError);
		});
	},
	/**
	 * @todo remove this function: the config.xml should only exist in the memory of the browser client
	 */
	saveXml: function(xmlString, next) {
		var req = this.service.createFile(this.folderId, "project.xml", xmlString);
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("ProjectConfig.saveXml: response=", inResponse);
			this.fileId = inResponse.id;
			next && next();
		}); 
		req.error(this, function(inSender, inError) {
			this.error("***", inError);
			next && next(inError);
		});
	},
	statics: {
		DEFAULT_PROJECT_CONFIG: {
			id: "com.examples.apps.MyApp",
			name: "BUG IF YOU SEE THIS",
			version: "0.0.1",
			title: "Example: My Application",
			description: "Description of My Application",
			build: {
				phonegap: null,
				war: null,
				zip: null,
				exe: null
			}
		}
	}
});
