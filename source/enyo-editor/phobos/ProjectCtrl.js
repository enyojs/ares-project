/*global enyo, ares, ilibPhobos */

/**
 One ProjectCtrl instance is created per project (when the first file of a project
 is opened). This object manages the asynchronous analysis tasks.
 @classdesc 
*/

enyo.kind({
	name: "ProjectCtrl",
	kind: "enyo.Component",
	debug: false,
	published: {
		projectData: null,
		pathResolver: null,
		fullAnalysisDone: false // true when done *and* successfull
	},
	events: {
		onErrorTooltip: '',
		onErrorTooltipReset: ''
	},
	handlers:{
		onError: 'raiseErrorTooltip',
	},
	components: [
		{
			name: "projectAnalyzer",
			kind: "analyzer.Analyzer",
			onIndexReady: "projectIndexReady",
			onError: "passError"
		},
		{
			// hack: cannot bubble up errors from runtime-machine-js in the middle of the analyser
			kind: "Signals",
			onAnalyserError: "raiseLoadError"
		}
	],

	// track what's going on with the analyses
	ongoing: false, // false when analysis is done (sucessfull or not)
	pending: false, // need to re-run analysis when true

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
			this.trace("Project DB already available for ", this.projectUrl, 
					   " - index: ", this.$.projectAnalyzer.index);
		} else {
			this.forceFullAnalysis();
		}
	},
	forceFullAnalysis: function() {
		//reset error tooltip
		this.doErrorTooltipReset();
		if (! this.ongoing) {
			this.trace("Starting project analysis for ", this.projectUrl);
			this.ongoing = true;
			this.pending = false ;
			this.$.projectAnalyzer.analyze([this.projectUrl + "/enyo/source", this.projectUrl], this.pathResolver);
		} else {
			this.trace("Set pending project analysis for ", this.projectUrl);
			this.pending = true;
		}
	},
	runPendingAnalysis: function(what) {
		this.ongoing = false ;
		if (this.pending) {
			this.trace("Running pending project analysis after ", what);
			this.forceFullAnalysis();
		}
	},
	passError: function(inSender, inEvent) {
		this.runPendingAnalysis('analyser error');
		// let the error bubble so user is notified
	},
	raiseLoadError: function(inSender, inEvent) {
		var cleaner = new RegExp('.*' + this.projectUrl) ;
		var rmdots  = new RegExp('[^/]+/\\.\\./');
		var barUrl = inEvent.msg.replace(cleaner,'').replace(rmdots,'');
		this.log("analyser cannot load ", barUrl);
		this.doErrorTooltip({msg: ilibPhobos("analyser cannot load '{barUrl}'", {barUrl: barUrl})});
		this.runPendingAnalysis('analyser load error');
	},
	/**
	 * Notifies modules dependent on the indexer that it has updated
	 * @protected
	 */
	projectIndexReady: function() {
		this.runPendingAnalysis('successfull analysis');
		if (! this.pending) {
			// Update the model to wake up the listeners only when
			// pending analysis is done to make sure that last
			// modifications are taken into account (for better or for
			// worse)
			this.fullAnalysisDone = true;
			this.projectData.updateProjectIndexer();
		}
	},
	raiseErrorTooltip: function(inSender, inEvent){
		this.doErrorTooltip(inEvent);
		return true;
	}
});
