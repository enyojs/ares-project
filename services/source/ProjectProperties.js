/**
 * Base kind (with public methods) for ProjectProperties panels.
 */
enyo.kind({
	name: "Ares.ProjectProperties",
	kind: "enyo.Control",
	published: {
		config: {}
	},
	/** public */
	setProjectConfig: function(config) {
		this.config = ares.extend(this.config, config);
	},
	/** public */
	getProjectConfig: function() {
		return this.config;
	},
	/**public */
	saveProjectConfig: function(project) {
		return true;
	}
});
