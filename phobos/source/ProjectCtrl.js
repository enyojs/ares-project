enyo.kind({
	name: "ProjectCtrl",
	kind: "enyo.Component",
	debug: false,
	published: {
		projectData: null,
		pathResolver: null,
		fullAnalysisDone: false
	},
	events: {
		onError: '',
	},
	components: [
		{name: "projectAnalyzer", kind: "analyzer.Analyzer", onIndexReady: "projectIndexReady"},
		// hack: cannot bubble up errors from runtime-machine-js in the middle of the analyser
		{kind: "Signals", onAnalyserError: "raiseError"}
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
	forceFullAnalysis: function() {
		this.trace("Re-starting project analysis for ", this.projectUrl);
		this.$.projectAnalyzer.analyze([this.projectUrl + "/enyo/source", this.projectUrl], this.pathResolver);
	},
	raiseError: function(inSender, inEvent) {
		var cleaner = new RegExp('.*' + this.projectUrl) ;
		var rmdots  = new RegExp('[^/]+/\\.\\./');
		var barUrl = inEvent.msg.replace(cleaner,'').replace(rmdots,'');
		this.log("analyser cannot load ",barUrl);
		this.doError({msg: "analyser cannot load " + barUrl });
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
