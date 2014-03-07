/* global ares, ProjectConfig, ServiceRegistry, ilibProjectView */

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
	
	constructor: function(){
		this.inherited(arguments);
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
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
		req.response(this, function _projectLoaded(inSender, inResponse) {
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
			if (next instanceof Function) {
				next(inError);
			}
		});
	},
	/**
	 * Force reloading the configuration from the storage
	 * @param {Function} next CommonJS callback
	 */
	load: function(next) {
		var data,
		    req = this.service.getFile(this.fileId);
		req.response(this, function _projectReloaded(inRequest, inResponse) {
			this.trace("ProjectConfig.load: file=", inResponse);
			if (typeof inResponse.content === 'string') {
				try {
					data = enyo.json.parse(inResponse.content);
				} catch(e) {
					enyo.error("ProjectConfig.load:", e);
					inRequest.fail(e);
				}
			} else {
				data = inResponse.content;
			}
			this.data = ProjectConfig.checkConfig(data);
			this.trace("ProjectConfig.load config=", this.data);
			if (this.data !== data) {
				this.save(next);
			} else {
				if (typeof next === 'function') {
					next();
				}
			}
		});
		req.error(this, function(inSender, inError) {
			this.error("ProjectConfig.load:", inError);
			if (next instanceof Function) {
				next(inError);
			}
		});
	},
	/**
	 * Save the current configuration to storage
	 * @param {Function} next CommonJS callback
	 */
	save: function(next) {
		var req;
		this.trace("data=", this.data);
		if (this.fileId) {
			req = this.service.putFile(this.fileId, enyo.json.stringify(this.data, null, 2));
		} else {
			req = this.service.createFile(this.folderId, "project.json", JSON.stringify(this.data, null, 2));
		}
		req.response(this, function _projectSaved(inSender, inResponse) {
			this.trace("ProjectConfig.save: inResponse=", inResponse);
			this.fileId = inResponse.id;
			if (next instanceof Function) {
				next();
			}
		});
		req.error(this, function(inSender, inError) {
			enyo.error("ProjectConfig.save: error=", inError);
			if (next instanceof Function) {
				next(inError);
			}
		});
	},
	statics: {
		checkConfig: function(inConfig) {
			var config = ares.clone(ProjectConfig.DEFAULT_PROJECT_CONFIG);

			// Get default project configuration for each service that can
			ServiceRegistry.instance.forEach(function(provider) {
				if ((typeof provider.getDefaultProjectConfig === 'function') &&
				    (typeof provider.getConfig === 'function')) {
					var providerId = provider.getConfig().id;
					config.providers[providerId] = provider.getDefaultProjectConfig();
				}
			});

			// backward compatibility: turn "build: {}" into "providers: {}"
			if (inConfig && inConfig.build) {
				inConfig.providers = inConfig.build;
				delete inConfig.build;
			}

			// Overlay the actual configuration over the default one
			config = ares.extend(config, inConfig);

			return config;
		},

		// used to pre-fill properties of a new project
		// contains default values
		PREFILLED_CONFIG_FOR_UI: {
			providers: {},
			preview: {
				"top_file": '/debug.html'
			}
		},

		// FIXME: the below should be replaced by proper JSON
		// schema validation with default values.
		DEFAULT_PROJECT_CONFIG: {
			id: "com.examples.apps.myapp",
			name: "BUG IF YOU SEE THIS",
			version: "0.0.1",
			title: ilibProjectView("Example: My Application"),
			description: ilibProjectView("My application description..."),
			author: {
				name: ilibProjectView("An Example Company"),
				href: "http://www.example.com"
			},
			providers: {},
			preview: {
				"top_file": '/debug.html'
			}
		}
	}
});
