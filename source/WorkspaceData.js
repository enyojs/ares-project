/*global _, Ares, Backbone, ares, guid, localStorage, enyo */

var AresStore = function(name, eraseAll) {
	this.name = name;

	if (eraseAll === true) {
		localStorage.removeItem(this.name);
		this.data = {};
	} else {
		var store = localStorage.getItem(this.name);
		this.data = (store && enyo.json.parse(store)) || {};
	}

	// Remove data in 'old' format (prior introduction of Ares.Workspace.projects)
	if (_.isArray(this.data)) {			// TODO: to be removed in a while
		this.data = {};
	}
};
    
_.extend(AresStore.prototype, {

	debug: false,
	strExclude: {originator: 1, service: 1, config: 1, build: 1, test: 1},
	stringifyReplacer: function(key, value) {
		if (this.strExclude[key] !== undefined) {
			return undefined;	// Exclude
		}
		return value;	// Accept
	},

	// Save the current state of the **Store** to *localStorage*.
	save: function() {
		try {
			var projectString = enyo.json.stringify(this.data, enyo.bind(this, this.stringifyReplacer));
			localStorage.setItem(this.name, projectString);
			if (this.debug) { enyo.log("Ares.Store#save(): ", projectString); }
		} catch(error) {
			enyo.error("Ares.Store#save():", error);
		}
	},
    
	// Add a model
	create: function(model) {
		if (!model.id) {
			model.id = model.attributes.id = guid();
		}
		this.data[model.id] = model;
		this.save();
		return model;
	},
    
	// Update a model by replacing its copy in `this.data`.
	update: function(model) {
		this.data[model.id] = model;
		this.save();
		return model;
	},

	// Retrieve a model from `this.data` by id.
	find: function(model) {
		return this.data[model.id];
	},

	// Return the array of all models currently in storage.
	findAll: function() {
		return _.values(this.data);
	},

	// Delete a model from `this.data`, returning it.
	destroy: function(model) {
		delete this.data[model.id];
		this.save();
		return model;
	},
	sync: function(method, model, options) {
		var resp;

		switch (method) {
		case "read":
			resp = model.id ? this.find(model) : this.findAll();
			break;
		case "create":
			resp = this.create(model);
			break;
		case "update":
			resp = this.update(model);
			break;
		case "delete":
			resp = this.destroy(model);
			break;
		}

		if (resp) {
			options.success(resp);
		} else {
			options.error("Record not found");
		}
	}
});

Ares.Model.Project = Backbone.Model.extend({				// TODO: Move to enyo.Model when possible
	_getProp: function(name) {
		var parts = name.split("."),
		    v = {};
		v.key = parts[0];
		v.obj = this.get(v.key) || {};
		parts.shift(1);
		v.name = parts.join(".");
		return v;
	},
	getObject: function(name) {
		var v = this._getProp(name);
		return ares.getObject(v.name, false /*create*/, v.obj);
	},
	setObject: function(name, value) {
		var v = this._getProp(name);
		ares.setObject(v.name, value, v.obj);
		this.set(v.key, v.obj);
	},
	getName: function() {
		return this.get("id");
	},
	getServiceId: function() {
		return this.get("serviceId");
	},
	getFolderId: function() {
		return this.get("folderId");
	},
	getService: function() {
		return this.get("service");
	},
	setService: function(service) {
		this.set("service", service);
	},
	/*
		FIXME ENYO-3687
		PGB will become a plugin - therefore should not store its data directly at project level
		e.g. getPluginData(plugname).getDownloadStatus()
	*/
	getDownloadStatus: function() {
		return this.get("downloadStatus");
	},
	setDownloadStatus: function(downloadStatus) {
		this.set("downloadStatus", downloadStatus);
	},
	getValidPgbConf: function() {
		return this.get("validPgbConf");
	},
	setValidPgbConf: function(conf) {
		this.set("validPgbConf", conf);
	},
	getConfig: function() {
		return this.get("config");
	},
	setConfig: function(config) {
		this.set("config", config);
	},
	getProjectUrl: function() {
		return this.get("project-url");
	},
	setProjectUrl: function(projectUrl) {
		this.set("project-url", projectUrl);
	},
	getProjectCtrl: function() {
		return this.get("controller");
	},
	setProjectCtrl: function(controller) {
		this.set("controller", controller);
	},
	getProjectIndexer: function() {
		return this.get("project-indexer");
	},
	setProjectIndexer: function(indexer) {
		this.set("project-indexer", indexer);
	},
	updateProjectIndexer: function() {
		this.trigger('update:project-indexer');
	},
	sync: function(method, model, options) {
		var store = model.localStorage || model.collection.localStorage;
		store.sync(method, model, options);
	}
});

Ares.Model.PROJECTS_STORAGE_KEY = "com.enyojs.ares.projects";
Ares.Model.Projects = Backbone.Collection.extend({		// TODO: move to enyo.Collection when possible
	model: Ares.Model.Project,
	comparator: function(a, b) {
		var result;
		if (a.id > b.id) {
			result = 1;
		} else if (a.id < b.id) {
			result = -1;
		} else {
			result = 0;
		}
		return result;
	},
	createProject: function(name, folderId, serviceId) {
		var project = this.get(name);
		if (project !== undefined) {
			throw new Error("Already exist");
		} else {
			project = new this.model({id: name, folderId: folderId, serviceId: serviceId});
			this.add(project);
			project.save();
			return project;
		}
	},
	removeProject: function(name) {
		var project = this.get(name);
		if (project === undefined) {
			throw new Error("Project '" + name + "'Does not exist");
		} else {
			project.destroy();
		}
	},
	renameProject: function(oldName, newName) {
		var oldProject = this.get(oldName);
		if (oldProject === undefined) {
			throw new Error("Project '" + oldName + "'Does not exist");
		} else {
			this.createProject(newName, oldProject.getFolderId(), oldProject.getServiceId());
			oldProject.destroy();
		}
	},

	/**
	 * Store the project name of the project currently loaded in
	 * designer. When all document are closed, the project is still
	 * active until project is switched. activeProject is never set to
	 * null. activeProject is not to be confused with selected
	 * Project.
	 * @param {String} name
	 * @throws {Error}
	 */
	setActiveProject: function(name) {
		var project = this.get(name);
		if (project) {
			this.active = name;
		} else {
			throw new Error("Unknown project " + name);
		}
	},
	/**
	 * Returns the project currently loaded in designer. Returns
	 * undefined if designer is lot loaded
	 * @returns {Ares.Model.Project|undefined}
	 */
	getActiveProject: function() {
		if (this.active) {
			return this.get(this.active) ;
		}
		return undefined;
	},
	/**
	 * Store the currently selected project
	 * @param {String} name The name of the selected project.
	 */
	setSelectedProject: function(name) {
		var project = this.get(name);
		if (project) {
			this.selectedProject = name;
		} else {
			throw new Error("Unknown project " + name);
		}
	},
	/**
	 * Returns the currently selected project.
	 * @return {Ares.Model.Project|undefined}
	 */
	getSelectedProject: function() {
		if (this.selectedProject) {
			return this.get(this.selectedProject) ;
		}
		return undefined;
	},

	sync: function(method, model, options) {
		var store = model.localStorage || model.collection.localStorage;
		store.sync(method, model, options);
	}
});

/*
	Ares.Workspace singleton that holds the collections of projects, files, ...
 */
enyo.singleton({
	name: "Ares.Workspace",
	kind: enyo.Component,
	create: function() {
		this.inherited(arguments);
		this.projects = new Ares.Model.Projects();
		this.files = new Ares.Model.Files();
	},
	loadProjects: function(storageKey, eraseAll) {
		var key = storageKey || Ares.Model.PROJECTS_STORAGE_KEY;
		this.projects.localStorage = new AresStore(key, eraseAll);
		this.projects.fetch();
	}
});
