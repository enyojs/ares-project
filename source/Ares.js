/*global Ares, ServiceRegistry, enyo, async, ares, alert, ComponentsRegistry, AresI18n */

enyo.path.addPaths({
	"assets"	: "$enyo/../assets"
});

/* ilibAres covers Ares main translations */
var ilibAres = AresI18n.resolve.bind(null, AresI18n.setBundle("$assets/resources"));
/* 
 * ilibUtilities covers Utilities specific translations.
 * Because ilibUtilities is used by Preview.js too, this bundle has been separated from Ares one.
 */
var ilibUtilities = AresI18n.resolve.bind(null, AresI18n.setBundle("$assets/utilities/resources")); 

enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "onyx",
	fit: true,
	debug: false,
	//noDefer: true, //FIXME: does not work with statics:{}
	components: [
		{
			name:"aresLayoutPanels",
			kind: "Panels",
			draggable: false,
			arrangerKind: "CollapsingArranger",
			fit: true,
			classes:"ares-main-panels enyo-border-box",
			onTransitionFinish:"changeGrabberDirection",
			components:[
				{
					name: "projectView",
					kind: "ProjectView",
					classes: "ares-panel-min-width "
				},
				{
					kind: "Harmonia",
					name: "harmonia",
					classes: "ares-panel-min-width enyo-fit",
					onFileOpenRequest: "openDocument",
					onFileRemoved: "closeDocument",
					onFolderChanged: "closeSomeDocuments",
					onModifySettings: "modifySettingsAction",
					onPreview: "previewAction",
					onBuild: "buildAction",
					onInstall: "installAction",
					onRun: "runAction",
					onRunDebug: "runDebugAction",
					onProjectSave: "saveProjectFiles"
				},
				{kind: "Ares.EnyoEditor", name: "enyoEditor"}
			]
		},
		{
			name: "waitPopup",
			kind: "onyx.Popup",
			centered: true,
			floating: true, 
			autoDismiss: false,
			modal: true,
			style: "text-align: center; padding: 20px; width: 200px;",
			components: [
				{kind: "Image", src: "$assets/enyo-editor/phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
				{name: "waitPopupMessage", content: ilibAres("Ongoing..."), style: "padding-top: 10px;"}, 
				{kind: "onyx.Button", name:"canceBuildButton", content: ilibAres("Cancel"), ontap: "cancelService", style: "margin-top: 10px;", showing: false}						
			]
		},
		
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: ilibAres("Unknown error"), details: ""},
		{name: "signInErrorPopup", kind: "Ares.SignInErrorPopup", msg: ilibAres("Unknown error"), details: ""},
		{kind: "ServiceRegistry"},
		{kind: "Ares.PackageMunger", name: "packageMunger"}
	],
	handlers: {
		onReloadServices: "handleReloadServices",
		onUpdateAuth: "handleUpdateAuth",
		onShowWaitPopup: "showWaitPopup",
		onHideWaitPopup: "hideWaitPopup",
		onError: "showError",
		onDesignerBroken: "showDesignerError",
		onSignInError: "showAccountConfiguration",
		onTreeChanged: "_treeChanged",
		onFsEvent: "_fsEventAction",
		onChangingNode: "_nodeChanging",
		onAllDocumentsAreClosed: "showProjectView",
		onRegisterMe : "_registerComponent",
		onMovePanel : "_movePanel",
		//handlers for editorSettings kind (utilities/EditorSettings.js)
		onChangeSettings:"applyPreviewSettings", 
		onChangeRightPane: "changeRightPane", 
		onApplySettings: "applySettings",
		//handlers for editorSettings kind (project-view/ProjectList.js)
		onDisableProjectMenu: "disableProjectMenu"
	},
	projectListIndex: 0,
	hermesFileTreeIndex: 1,
	enyoEditorIndex: 2,
	projectListWidth: 300,
	isProjectView: true,
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this._registerComponent(null, {name: "ares", reference: this});
		ComponentsRegistry.getComponent("enyoEditor").showPhobosPanel();
		ServiceRegistry.instance.setOwner(this); // plumb services events all the way up
		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (Ares.TestController) {
			Ares.Workspace.loadProjects("com.enyojs.ares.tests", true);
			this.createComponent({kind: "Ares.TestController", aresObj: this});
		} else {
			Ares.Workspace.loadProjects();
		}

		Ares.instance = this;

		// i18n checking
		this.trace("ilibAres: Cancel=", ilibAres("Cancel"));
		this.trace("ilibUtilities: Close=", ilibUtilities("Close"));
	},

	rendered: function() {
		this.inherited(arguments);
		this.showProjectView();
	},
	/**
	 * @private
	 */
	handleReloadServices: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.reloadServices();
	},
	/**
	 * @private
	 */
	handleUpdateAuth: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.serviceRegistry.setConfig(inEvent.serviceId, {auth: inEvent.auth}, inEvent.next);
	},
	openDocument: function(inSender, inEvent) {
		this._openDocument(inEvent.projectData, inEvent.file, ares.noNext );
	},

	// used only in _openDocument
	onGoingOpen: false,
	_openDocument: function(projectData, file, next) {
		ares.assertCb(next);
		var fileDataId = Ares.Workspace.files.computeId(file);
		var editor = ComponentsRegistry.getComponent("enyoEditor");
		if (! fileDataId ) {
			throw new Error ('Undefined fileId for file ' + file.name + ' service ' + file.service);
		}
		var fileData = Ares.Workspace.files.get(fileDataId);

		if (this.onGoingOpen) {
			var msg = "Aborted: openDocument is already on-going";
			this.log(msg);
			next(new Error(msg));
			return;
		}

		this.onGoingOpen = true;
		var myNext = (function(err) {
			this.onGoingOpen = false;
			next(err);
		}).bind(this);

		// hide projectView only the first time a file is opened in a project
		// otherwise, let the user handle this
		var mayHideProjectView = Ares.Workspace.files.length ? function(next) { next();}
			: function(next) { this.hideProjectView(); next();} ;

		this.trace("open document with project ", projectData.getName(), " file ", file.name, " using cache ", fileData);

		if (fileData) {
			// switch triggered by double-clicking an already opened
			// file in HermesFileTree
			editor.switchToDocument(fileData, ilibAres("Switching file..."), myNext) ;
		} else {
			this.showWaitPopup(this, {msg: ilibAres("Fetching file...")});
			async.waterfall(
				[
					this._fetchDocument.bind(this,projectData, file),
					editor.switchToNewTabAndDoc.bind(editor,projectData,file),
					mayHideProjectView.bind(this)
				],
				(function(err) {
					this.hideWaitPopup();
					myNext(err);
				}).bind(this)
			);
		}
	},

	/** @private */
	_fetchDocument: function(projectData, file, next) {
		this.trace("project name:", projectData.getName(), ", file name:", file.name);
		var service = projectData.getService();
		service.getFile(file.id)
			.response(this, function(inEvent, inData) {
				next(null, inData && inData.content || "");
			})
			.error(this, function(inEvent, inErr) {
				next(inErr);
			});
	},

	/**
	 * close documents contained in a folder after a folder rename.
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 */
	// One might say that these documents are canon folder...
	closeSomeDocuments: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		
		var files = Ares.Workspace.files,
			model,
			i;
		
		for( i = 0; i < files.models.length; i++ ) {
			model = files.models[i];

			var path = model.getFile().path,
				serviceId = model.getProjectData().getServiceId();

			if ( serviceId == inEvent.projectData.getServiceId() && path.indexOf( inEvent.file.path, 0 ) >= 0 ) {
				this._closeDocument(model.id);
				i--;
			}
		}
	},
	/** @private */
	closeDocument: function(inSender,inEvent) {
		this._closeDocument(inEvent.id);
	},

	_closeDocument: function(docId) {
		ComponentsRegistry.getComponent("enyoEditor").closeDoc(docId, ares.noNext);
	},
	/** @private */
	_fsEventAction: function(inSender, inEvent) {
		var harmonia = ComponentsRegistry.getComponent("harmonia");
		harmonia.refreshFileTree(inEvent.nodeId);
	},

	saveProjectFiles: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("enyoEditor").saveProjectDocsWithCb(
			inEvent.project,
			inEvent.callback
		);
	},

	handleBeforeUnload: function() {
		if (window.location.search.indexOf("debug") == -1) {
			return 'You may have some unsaved data';
		}
	},
	/**
	 * The width of the panel needs to be calculated en function of width of the previous panel
	 * if the panel is not the last panel of arranger 
	 * and we want that this panel take place of all remaining screen after display of all previous panels

	 * @private
	 * @param {Object} panel
	 */
	_calcPanelWidth:function(panel) {
		var cn = this.$.aresLayoutPanels.hasNode();
		this.aresContainerBounds = cn ? {width: cn.clientWidth, height: cn.clientHeight} : {};
		panel.applyStyle("width", (this.aresContainerBounds.width - this.projectListWidth) + "px");
	},
	hideProjectView: function(inSender, inEvent) {
		this.isProjectView = false;
		this.$.aresLayoutPanels.getPanels()[this.hermesFileTreeIndex].applyStyle("width", null);
		var harmonia = ComponentsRegistry.getComponent("harmonia");
		harmonia.addClass("ares-small-screen");
		this.$.aresLayoutPanels.reflow();
		this.$.aresLayoutPanels.setIndexDirect(this.hermesFileTreeIndex);
		harmonia.showGrabber();
		harmonia.hideLogo();
	},
	showProjectView: function(inSender, inEvent) {
		this.isProjectView = true;
		var harmonia = ComponentsRegistry.getComponent("harmonia");
		harmonia.removeClass("ares-small-screen");		
		this.$.aresLayoutPanels.setIndex(this.projectListIndex);
		this.$.aresLayoutPanels.getPanels()[this.enyoEditorIndex].switchGrabberDirection(false);
		this._calcPanelWidth(this.$.aresLayoutPanels.getPanels()[this.hermesFileTreeIndex]);
		this.$.aresLayoutPanels.reflow();
		harmonia.hideGrabber();
		harmonia.showLogo();
	},
	changeGrabberDirection:function(inSender, inEvent){
		if(inEvent.toIndex > 0 && inEvent.fromIndex < inEvent.toIndex){
			for(var i = 1; i<=inEvent.toIndex; i++){
				this.$.aresLayoutPanels.getPanels()[i].switchGrabberDirection(true);
			}
		}
		if(inEvent.fromIndex>inEvent.toIndex){
			this.$.aresLayoutPanels.getPanels()[inEvent.fromIndex].switchGrabberDirection(false);
		}
	},
	/** @private */
	_movePanel: function(inSender, inEvent){
		if(inEvent.panelIndex === this.$.aresLayoutPanels.getIndex()){
			this.$.aresLayoutPanels.previous();
		}else{
			this.$.aresLayoutPanels.setIndex(inEvent.panelIndex);
		}
	},
	resizeHandler: function(inSender, inEvent) {
		this.inherited(arguments);
		if(this.$.aresLayoutPanels.getIndex() === this.projectListIndex && this.isProjectView){
			this._calcPanelWidth(this.$.aresLayoutPanels.getPanels()[this.hermesFileTreeIndex]);
		}
	},

	showWaitPopup: function(inSender, inEvent) {
		if(inEvent.service === 'build' ) {
			this.$.canceBuildButton.show();
		}
		this.$.waitPopupMessage.setContent(inEvent.msg);
		this.$.waitPopup.show();
	},

	cancelService: function(inSender, inEvent) {
		enyo.Signals.send("plugin.phonegap.buildCanceled");
		this.hideWaitPopup();		
	},

	hideWaitPopup: function(inSender, inEvent) {
		this.$.canceBuildButton.hide();
		this.$.waitPopup.hide();
	},

	showError: function(inSender, inEvent) {
		this.trace("event:", inEvent, "from sender:", inSender);
		this.hideWaitPopup();		
		if (inEvent && inEvent.err && inEvent.err.status === 401) {
			this.showSignInErrorPopup(inEvent);
		} else {
			this.showErrorPopup(inEvent);
		}
		
		return true; //Stop event propagation
	},
	showErrorPopup : function(inEvent) {
		this.$.errorPopup.raise(inEvent);
	},
	showDesignerError: function(){
		this.showError("",ComponentsRegistry.getComponent("enyoEditor").getErrorFromDesignerBroken());
	},
	showSignInErrorPopup : function(inEvent) {
		this.$.signInErrorPopup.raise(inEvent);
	},
	showAccountConfiguration: function() {
		ComponentsRegistry.getComponent("accountsConfigurator").show();		
		this.$.signInErrorPopup.hide();		
	},
	/**
	 * Event handler for user-initiated file or folder changes
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent as defined by calls to HermesFileTree#doTreeChanged
	 */
	_treeChanged: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.packageMunger.changeNodes(inEvent, (function(err) {
			if (err) {
				this.warn(err);
			}
		}).bind(this));
	},
	/**
	 * Event handler for system-initiated file or folder changes
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent as defined by calls to Ares.PackageMunger#doChangingNode
	 */
	_nodeChanging: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var docId = Ares.Workspace.files.computeId(inEvent.node);
		this._closeDocument(docId);
	},

	
	/**
	 * Event handler for ace's settings called when settings from localStorage have to be applied (cancel/open)
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 */
	applySettings: function(inSender, inEvent){
		ComponentsRegistry.getComponent("enyoEditor").applySettings(inEvent.originator.getSettingFromLS());
	},

	/**
	 * Event handler for ace's settings called when a setting is changing (change theme, font size on ui for example)
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 */
	applyPreviewSettings: function(inSender, inEvent){
		ComponentsRegistry.getComponent("enyoEditor").applySettings(inEvent.originator.getPreviewSettings());
	},

	/**
	 * Event handler for ace's settings called when a right panel is changed
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 */
	changeRightPane: function(inSender, inEvent){
		ComponentsRegistry.getComponent("enyoEditor").changeRightPane(inEvent.originator.getPreviewSettings());
	},

	/**
	 * Event handler for ares components registry
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent => inEvent.name in [phobos, deimos, projectView, documentToolbar, harmonia, enyoEditor, accountsConfigurator, ...]
	 */
	_registerComponent: function(inSender, inEvent) {
		ComponentsRegistry.registerComponent(inEvent);

		return true;
	},
	stopEvent: function(){
		return true;
	},
	/** @private */
	disableProjectMenu: function(inSender, inEvent) {
		var disable = inEvent && inEvent.disable;
		ComponentsRegistry.getComponent("harmonia").disableProjectMenu(disable);

		return true;
	},
	/** @private */
	modifySettingsAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if ( project) {
			ComponentsRegistry.getComponent("projectView").$.projectWizardModify.start( project );
		}

		return true; //Stop event propagation
	},
	/**
	 * Event handler: Launch a preview widget of the selected project in a separate frame
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	previewAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if ( project) {
			ComponentsRegistry.getComponent("harmonia").launchPreview(project);
		}
		return true; // stop the bubble
	},
	/**
	 * Event handler: handle build project action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	buildAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			ComponentsRegistry.getComponent("harmonia").projectSaveAndAction(project, 'build', 'build');
		}
		return true; // stop bubble-up
	},	
	/**
	 * Event handler: handle install application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	installAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			ComponentsRegistry.getComponent("harmonia").projectSaveAndAction(project, 'test', 'install');
		}
		return true; // stop bubble-up
	},
	/**
	 * Event handler: handle run application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	runAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			ComponentsRegistry.getComponent("harmonia").projectSaveAndAction(project, 'test', 'run');
		}
		return true; // stop bubble-up
	},
	/**
	 * Event handler: handle debug application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	runDebugAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			ComponentsRegistry.getComponent("harmonia").projectSaveAndAction(project, 'test', 'runDebug');
		}
		return true; // stop bubble-up
	},

	statics: {
		isBrowserSupported: function() {
			if (enyo.platform.ie && enyo.platform.ie <= 8) {
				return false;
			} else {
				return true;
			}
		},
		instance: null
	},


});

if ( ! Ares.isBrowserSupported()) {
	alert(ilibAres("Ares is designed for the latest version of IE. We recommend that you upgrade your browser or use Chrome"));
}

/**
 * Manages registered components
 * 
 * @class ComponentRegistry
 * @augments enyo.Object
 */
enyo.kind({
	name: "ComponentsRegistry",
	debug: false,
	kind: "enyo.Object",
	statics: {
		components: {},
		/** @public */
		registerComponent: function(inEvent) {
			var ref = ComponentsRegistry.components[inEvent.name];
			if (ref === undefined || ref === inEvent.reference){
				ComponentsRegistry.components[inEvent.name] = inEvent.reference;
			} else {
				throw new Error("Component is already registred: '" + inEvent.name + "'");
			}
		},
		getComponent: function(name) {
			return ComponentsRegistry.components[name];
		}
	}
});
