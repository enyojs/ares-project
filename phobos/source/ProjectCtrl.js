enyo.kind({
	name: "ProjectCtrl",
	kind: "enyo.Component",
	debug: false,
	published: {
		projectData: null,
		pathResolver: null,
		fullAnalysisDone: false
	},
	components: [
		{name: "projectAnalyzer", kind: "analyzer.Analyzer", onIndexReady: "projectIndexReady"}
	],
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.projectUrl = this.projectData.getProjectUrl();
		this.trace("New project: ", this.projectUrl);
		this.createPathResolver(this.projectUrl);
		this.projectData.setProjectIndexer(this.$.projectAnalyzer.index);
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
	 * Start the project analysis if not already done
	 * @protected
	 */
	buildProjectDb: function() {
		if (this.fullAnalysisDone) {
			this.trace("Project DB already available - index: ", this.$.projectAnalyzer.index);
		} else {
			this.trace("Starting project analysis for ", this.projectUrl);
			this.$.projectAnalyzer.analyze([this.projectUrl + "/enyo/source", this.projectUrl], this.pathResolver);
		}
	},
	/**
	 * Notifies modules dependent on the indexer that it has updated
	 * @protected
	 */
	projectIndexReady: function() {
		// Update the model to wake up the listeners
		this.fullAnalysisDone = true;
		this.projectData.updateProjectIndexer();
	}
});
