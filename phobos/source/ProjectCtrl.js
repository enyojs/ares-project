enyo.kind({
	name: "ProjectCtrl",
	kind: "enyo.Component",
	debug: false,
	published: {
		phobos: null,
		projectData: null,
		pathResolver: null
	},
	components: [
		{name: "enyoAnalyzer", kind: "Analyzer", onIndexReady: "enyoIndexReady"},
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
	 * Start the enyo/onyx analysis if not already done for the project
	 * @public
	 */
	buildEnyoDb: function() {
		if (this.analysisDone(this.$.enyoAnalyzer.index)) {
			this.debug && this.log("ENYO DB already available - index: ", this.$.enyoAnalyzer.index);
			this.enyoIndexReady();
		} else {
			this.debug && this.log("Starting enyo analysis for " + this.projectUrl);
			this.resetPhobosDb();
			this.$.enyoAnalyzer.analyze(["$enyo/source", "$lib/onyx", "$lib/layout"], this.pathResolver);
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
			this.debug && this.log("Project DB already available - index: ", this.$.enyoAnalyzer.index);
			this.projectIndexReady();
		} else {
			this.debug && this.log("Starting project analysis for " + this.projectUrl);
			this.$.projectAnalyzer.analyze([this.projectUrl], this.pathResolver);
		}
	},
	/**
	 * Passes the analyzer data to Phobos and start the project analysis
	 * @protected
	 */
	enyoIndexReady: function() {
		// Pass to phobos
		this.phobos.enyoIndexReady(this, this.$.enyoAnalyzer.index);

		// Start analysis of the project
		this.buildProjectDb();	// TODO: exclude enyo/onyx from the analysis
	},
	/**
	 * Passes the analyzer data to Phobos
	 * @protected
	 */
	projectIndexReady: function() {
		// Pass to phobos
		this.phobos.projectIndexReady(this, this.$.projectAnalyzer.index);
	},
	/**
	 * Reset Phobos and AutoComplete enyo and project databases while the analysis
	 * performed asynchronously.
	 * This is mandatory to avoid using invalid data from a previously opened project
	 * @protected
	 */
	resetPhobosDb: function() {
		this.phobos.enyoIndexReady(this, null);
		this.phobos.projectIndexReady(this, null);
	}
});