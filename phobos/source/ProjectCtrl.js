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
		this.inherited(arguments);
		this.projectUrl = this.projectData.getProjectUrl();
		if (this.debug) {
			this.log("New project: " + this.projectUrl);
		}
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
			if (this.debug) {
				this.log("Project DB already available - index: ", this.$.projectAnalyzer.index);
			}
		} else {
			if (this.debug) {
				this.log("Starting project analysis for " + this.projectUrl);
			}
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
