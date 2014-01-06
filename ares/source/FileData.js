/*global Ares, Backbone, enyo */

enyo.singleton({
	kind: "enyo.Component",
	name: "Ares.Model"
});

Ares.Model.File = Backbone.Model.extend({				// TODO: Move to enyo.Model when possible
	/**
	 *
	 * @returns {String} service_name-project_name_as_hex_and_file_id_in_hex
	 */
	getId: function() {
		return this.get("id");
	},

	/**
	 *
	 * @returns {String} id encrypted in hexa
	 */
	getFileId: function() {
		return this.get("file").id;
	},
	getFile: function() {
		return this.get("file");
	},
	getName: function() {
		return this.get("file").name;
	},

	/**
	 * Returns data. Within Ares, this data is supposed to reflect the
	 * content as stored on the file system. Ensuring this is the
	 * caller responsability.
	 * @returns {String}
	 */
	getData: function() {
		return this.get("data");
	},

	/**
	 * save data. Within Ares, this function is called when saving
	 * file on the remote file system.
	 * @param {String} data
	 */
	setData: function(data) {
		this.set("data", data);
	},

	/**
	 * Purpose within Ares: mirror the content of the ace session
	 * updated when switching files, the content may no be up-to-date
	 * for current document
	 * @returns {String}
	 */
	getEditedData: function() {
		return this.get("edited-data");
	},
	setEditedData: function(data) {
		this.set("edited-data", data);
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
