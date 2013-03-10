enyo.kind({
	name: "ProjectCtrl",
	kind: "enyo.Component",
	debug: false,
	published: {
		projectData: null,
		pathResolver: null
	},
	components: [
		{name: "projectAnalyzer", kind: "Analyzer", onIndexReady: "projectIndexReady"}
	],
	create: function() {
		this.inherited(arguments);
		this.projectUrl = this.projectData.getProjectUrl();
		this.debug && this.log("New project: " + this.projectUrl);
		this.createPathResolver(this.projectUrl);
	},
	/**
	 * Create a path resolver (similar to enyo.path) to resolve
	 * "$enyo", "$lib", ... when launching the Analyzer on the
	 * enyo/onyx used by the loaded project.
	 * @param  inProjectPath
	 * @protected
	 */
	createPathResolver: function(inProjectPath) {
		if ( ! this.pathResolver) {
			this.pathResolver = new enyo.pathResolverFactory();
			this.pathResolver.addPaths({
				enyo: this.projectUrl + "/enyo",
				lib: "$enyo/../lib"
			});
		}
	},
	/**
	 * Verify if the analysis was already done
	 * @param  index the index to check
	 * @protected
	 */
	analysisDone: function(index) {
		return (index !== undefined) && index.objects && (index.objects.length > 0);
	},
	/**
	 * Start the project analysis if not already done
	 * @protected
	 */
	buildProjectDb: function() {
		if (this.analysisDone(this.$.projectAnalyzer.index)) {
			this.debug && this.log("Project DB already available - index: ", this.$.projectAnalyzer.index);
		} else {
			this.debug && this.log("Starting project analysis for " + this.projectUrl);
			this.$.projectAnalyzer.analyze([this.projectUrl + "/enyo/source", this.projectUrl], this.pathResolver);
		}
		this.projectData.setProjectIndexer(this.$.projectAnalyzer.index);
	},
	/**
	 * Notifies modules dependent on the indexer that it has updated
	 * @protected
	 */
	projectIndexReady: function() {
		// Update the model to wake up the listeners
		this.projectData.updateProjectIndexer();
	},
	/**
	 * Reset Phobos and AutoComplete enyo and project databases while the analysis
	 * performed asynchronously.
	 * This is mandatory to avoid using invalid data from a previously opened project
	 * @protected
	 */
	resetPhobosDb: function() {
		// Update the model to wake up the listeners
		this.projectData.setProjectIndexer(null);
	}
});
