var AresStore = function(name) {
	this.name = name;
	var store = localStorage.getItem(this.name);
	this.data = (store && JSON.parse(store)) || {};

	// Remove data in 'old' format (prior introduction of Ares.WorkspaceData)
	if (_.isArray(this.data)) {			// TODO: to be removed in a while
		this.data = {};
	}
};
    
_.extend(AresStore.prototype, {

	debug: false,
	strExclude: {originator: 1, service: 1, config: 1},
	stringifyReplacer: function(key, value) {
		if (this.strExclude[key] !== undefined) {
			return undefined;	// Exclude
		}
		return value;	// Accept
	},

	// Save the current state of the **Store** to *localStorage*.
	save: function() {
		try {
			var projectString = JSON.stringify(this.data, enyo.bind(this, this.stringifyReplacer));
			localStorage.setItem(this.name, projectString);
			this.debug && enyo.log("Store.save DONE: " + projectString);
		} catch(error) {
			enyo.log("Exception: ", error);
		}
	},
    
	// Add a model
	create: function(model) {
		if (!model.id) model.id = model.attributes.id = guid();
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
			case "read":    resp = model.id ? this.find(model) : this.findAll(); break;
			case "create":  resp = this.create(model);		break;
			case "update":  resp = this.update(model);      break;
			case "delete":  resp = this.destroy(model);     break;
		}

		if (resp) {
			options.success(resp);
		} else {
			options.error("Record not found");
		}
	}
});

if ( ! Ares.Model) {
	Ares.Model = {};
}

Ares.Model.Project = Backbone.Model.extend({				// TODO: Move to enyo.Model when possible
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
		return this.set("service", service);
	},
	getConfig: function() {
		return this.get("config");
	},
	setConfig: function(config) {
		return this.set("config", config);
	},
	getProjectUrl: function() {
		return this.get("project-url");
	},
	setProjectUrl: function(projectUrl) {
		return this.set("project-url", projectUrl);
	},
	sync: function(method, model, options) {
		var store = model.localStorage || model.collection.localStorage;
		store.sync(method, model, options);
	}
});

Ares.Model.PROJECTS_STORAGE_KEY = "com.enyojs.ares.projects";
Ares.Model.Projects = Backbone.Collection.extend({		// TODO: move to enyo.Collection when possible
	model: Ares.Model.Project,
	initiliaze: function() {
		enyo.log("Ares.Model.WorkspaceData.initialize()");
	},
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
		var project, oldProject = this.get(oldName);
		if (oldProject === undefined) {
			throw new Error("Project '" + oldName + "'Does not exist");
		} else {
			this.createProject(newName, oldProject.getFolderId(), oldProject.getServiceId());
			oldProject.destroy();
		}
	},
	sync: function(method, model, options) {
		var store = model.localStorage || model.collection.localStorage;
		store.sync(method, model, options);
	}
});

// Create the workspace collection of projects and load the data from the local storage
Ares.WorkspaceData = new Ares.Model.Projects();
if (Ares.TestController) {
	Ares.Model.TEST_STORAGE_KEY = "com.enyojs.ares.test";
	// reset the test local storage
	localStorage.setItem(Ares.Model.TEST_STORAGE_KEY, "{}");
	Ares.WorkspaceData.localStorage = new AresStore(Ares.Model.TEST_STORAGE_KEY);
} else {
	Ares.WorkspaceData.localStorage = new AresStore(Ares.Model.PROJECTS_STORAGE_KEY);	
}
Ares.WorkspaceData.fetch();

