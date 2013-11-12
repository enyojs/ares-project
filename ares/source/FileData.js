/* global Ares, Backbone */

enyo.singleton({
	kind: "enyo.Component",
	name: "Ares.Model"
});

Ares.Model.File = Backbone.Model.extend({				// TODO: Move to enyo.Model when possible
	getId: function() {
		return this.get("id");
	},
	getFile: function() {
		return this.get("file");
	},
	getName: function() {
		return this.get("file").name;
	},
	getData: function() {
		return this.get("data");
	},
	setData: function(data) {
		this.set("data", data);
	},
	getProjectData: function() {
		return this.get("project-data");
	},
	setProjectData: function(projectData) {
		this.set("project-data", projectData);
	},
	getEdited: function() {
		return this.get("edited");
	},
	setEdited: function(edited) {
		this.set("edited", edited);
	},
	getMode: function() {
		return this.get("mode");
	},
	setMode: function(mode) {
		this.set("mode", mode);
	},
	getAceSession: function() {
		return this.get("ace-session");
	},
	setAceSession: function(session) {
		this.set("ace-session", session);
	},
	getCurrentIF: function() {
		return this.get("currentIF");
	},
	setCurrentIF: function(currentIF) {
		this.set("currentIF", currentIF);
	}
});

Ares.Model.Files = Backbone.Collection.extend({		// TODO: move to enyo.Collection when possible
	model: Ares.Model.File,
	newEntry: function(file, data, projectData) {
		var id = this.computeId(file);
		var obj = new Ares.Model.File({id: id, file: file, data: data, "project-data": projectData, edited: false, currentIF: "code"});
		this.add(obj);
		return obj;
	},
	removeEntry: function(id) {
		var obj = this.get(id);
		if (obj) {
			this.remove(obj);
			obj.clear({silent: true});
		}
	},
	computeId: function(file) {
		return file && file.service && file.id && (file.service.getConfig().id + "-" + file.id);
	}
});
