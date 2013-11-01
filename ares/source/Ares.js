/* global Ares, ServiceRegistry, async, ares, alert, ComponentsRegistry, KeyboardJS */

enyo.path.addPaths({
	"assets"	: "$enyo/../assets",
	// deprecated aliases
	"utilities"	: "$enyo/../utilities",
	"services"	: "$enyo/../services",
	"phobos"	: "$enyo/../phobos",
	"deimos"	: "$enyo/../deimos",
	"harmonia"	: "$enyo/../harmonia",
	"project-view"	: "$enyo/../project-view"
});

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
					classes: "ares-panel-min-width ",
					onProjectSelected: "projectSelected"
				},
				{
					kind: "Harmonia",
					name: "harmonia",
					classes: "ares-panel-min-width enyo-fit",
					onFileDblClick: "openDocument",
					onFileChanged: "closeDocument",
					onFolderChanged: "closeSomeDocuments"
				},
				{kind: "Ares.DevelopmentPanel", name: "developmentPanel"}
			]
		},
		{
			name: "waitPopup",
			kind: "onyx.Popup",
			centered: true,
			floating: true, 
			autoDismiss: false,
			modal: true,
			style: "text-align: center; padding: 20px;",
			components: [
				{kind: "Image", src: "$phobos/assets/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
				{name: "waitPopupMessage", content: "Ongoing...", style: "padding-top: 10px;"}, 
				{kind: "onyx.Button", name:"cancelWaitPopup", content: "Cancel", ontap: "cancelService", style: "margin-top: 10px;", showing: false}						
			]
		},
		
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error", details: ""},
		{name: "signInErrorPopup", kind: "Ares.SignInErrorPopup", msg: "unknown error", details: ""},
		{kind: "ServiceRegistry"},
		{kind: "Ares.PackageMunger", name: "packageMunger"}
	],
	handlers: {
		onReloadServices: "handleReloadServices",
		onUpdateAuth: "handleUpdateAuth",
		onShowWaitPopup: "showWaitPopup",
		onHideWaitPopup: "hideWaitPopup",
		onError: "showError",
		onErrorTooltip: "showDesignerErrorTooltip",
		onErrorTooltipReset: "resetDesignerErrorTooltip",
		onDesignerBroken: "showDesignerError",
		onSignInError: "showAccountConfiguration",
		onTreeChanged: "_treeChanged",
		onFsEvent: "_fsEventAction",
		onChangingNode: "_nodeChanging",
		onSaveDocument: "saveDocument", 
		onSaveAsDocument: "saveAsDocument", 
		onCloseDocument: "closeDocument", 
		onCloseProjectDocuments: "closeDocumentsForProject",
		onDesignDocument: "designDocument", 
		onUpdate: "phobosUpdate",
		onCloseDesigner: "closeDesigner", 
		onDesignerUpdate: "designerUpdate", 
		onUndo: "designerUndo", 
		onRedo: "designerRedo",
		onSwitchFile: "switchFile",
		onDesign: "bounceDesign",
		onNewKind: "bounceNew",
		onCloseFileRequest: "bounceCloseFileRequest",
		onRegisterMe : "_registerComponent",
		onMovePanel : "_movePanel",
		onSavePreviewAction: "_saveBeforePreview",
		onDisplayPreview : "_displayPreview",
		onFileEdited:"_fileEdited"

	},
	projectListIndex: 0,
	hermesFileTreeIndex: 1,
	developmentPanelIndex: 2,
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	projectListWidth: 300,
	isProjectView: true,
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		ComponentsRegistry.getComponent("developmentPanel").$.panels.setIndex(this.phobosViewIndex);
		ServiceRegistry.instance.setOwner(this); // plumb services events all the way up
		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (Ares.TestController) {
			Ares.Workspace.loadProjects("com.enyojs.ares.tests", true);
			this.createComponent({kind: "Ares.TestController", aresObj: this});
		} else {
			Ares.Workspace.loadProjects();
		}

		Ares.instance = this;

		// For Key-Binding Sample
		this.initializeKeyBinding();
	},

	rendered: function() {
		this.inherited(arguments);
		this.showProjectView();
	},
	
	initializeKeyBinding: function() {
		KeyboardJS.on('ctrl + s', 
			function(e) {
				// Close the Editwindow
				ComponentsRegistry.getComponent("phobos").closeDocAction();
				// Prevent the Default Browser's action
				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			function(e) {
				// 'Ctrl + S' Key-Up callback event issued: Do nothing
		});
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
	projectSelected: function() {
		this.trace("set timer for setting project in Deimos");
		setTimeout(enyo.bind(this, function() { 
			var currentProject = ComponentsRegistry.getComponent("projectView").currentProject;
			this.trace("setting project in Deimos" + currentProject.id);
			ComponentsRegistry.getComponent("deimos").projectSelected(currentProject);
		}), 500);	// <-- TODO - using timeout here because project url is set asynchronously
		return true;
	},
	openDocument: function(inSender, inEvent) {
		this._openDocument(inEvent.projectData, inEvent.file, function(inErr) {});
	},
	/** @private */
	_openDocument: function(projectData, file, next) {
		var self = this;
		var fileDataId = Ares.Workspace.files.computeId(file);
		if (! fileDataId ) {
			throw new Error ('Undefined fileId for file ' + file.name + ' service ' + file.service);
		}
		var fileData = Ares.Workspace.files.get(fileDataId);
		this.trace("open document with projectData ", projectData, " fileDataId ", fileDataId);
		if (fileData) {
			// useful when double clicking on a file in HermesFileTree
			this.switchToDocument(fileData);
		} else {
			this.showWaitPopup(this, {msg: $L("Opening...")});
			this._fetchDocument(projectData, file, function(inErr, inContent) {
				self.hideWaitPopup();
				if (inErr) {
					self.warn("Open failed", inErr);
					if (typeof next === 'function') {
						next(inErr);
					}
				} else {
					fileData = Ares.Workspace.files.newEntry(file, inContent, projectData);
					ComponentsRegistry.getComponent("documentToolbar").createFileTab(file.name, fileDataId, file.path, projectData);
					self.switchToDocument(fileData);
					if (typeof next === 'function') {
						next();
					}
				}
			});
		}
		//hide projectView only the first time
		if (! Ares.Workspace.files.length ) {
			this.hideProjectView();
		}
		
	},

	/** @private */
	_fetchDocument: function(projectData, file, next) {
		this.trace("projectData:", projectData, ", file:", file);
		var service = projectData.getService();
		service.getFile(file.id)
			.response(this, function(inEvent, inData) {
				next(null, inData && inData.content || "");
			})
			.error(this, function(inEvent, inErr) {
				next(inErr);
			});
	},
	saveDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var content = inEvent.content;
		this._saveDocument(inEvent.content, {service: inEvent.file.service, fileId: inEvent.file.id}, function(err) {
			if (err) {
				ComponentsRegistry.getComponent("phobos").saveFailed(err);
			} else {
				var fileDataId = Ares.Workspace.files.computeId(inEvent.file);
				var fileData = Ares.Workspace.files.get(fileDataId);
				if(fileData){
					fileData.setData(content);
				}
				ComponentsRegistry.getComponent("phobos").saveComplete(fileData);
			}
		});
	},
	_saveDocument: function(content, where, next) {
		var req;
		if (where.fileId) {
			req = where.service.putFile(where.fileId, content);
		} else {
			req = where.service.createFile(where.folderId, where.name, content);
		}
		req.response(this, function(inEvent, inData) {
			next(null, inData);
		}).error(this, function(inEvent, inErr) {
			next(inErr);
		});

	},
	saveAsDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var self = this,
		    file = inEvent.file,
		    name = inEvent.name;

		if (!file) {
			_footer(new Error("Internal error: missing file/folder description"));
			return;
		}

		async.waterfall([
			this._closeDocument.bind(this, inEvent.docId),
			_prepareNewLocation.bind(this),
			this._saveDocument.bind(this, inEvent.content),
			_savedToOpen.bind(this),
			this._openDocument.bind(this, inEvent.projectData)
		], _footer);

		function _prepareNewLocation(next) {
			var where, err;
			if (file.isDir && name) {
				// create given file in given dir
				where = {
					service: file.service,
					folderId: file.id,
					name: name
				};
			} else if (!file.isDir && !name) {
				// overwrite the given file
				where = {
					service: file.service,
					fileId: file.id
				};
			} else if (!file.isDir && name) {
				// create a new file in the same folder as the
				// given file
				where = {
					service: file.service,
					folderId: file.parent.id,
					name: name
				};
			} else {
				err = new Error("Internal error: wrong file/folder description");
			}
			next(err, where);
		}

		function _savedToOpen(inData, next) {
			ComponentsRegistry.getComponent("projectView").refreshFile(file);
			// FIXME: only HermesFileTree report built-in file#service
			var hermesFile = inData[0];
			hermesFile.service = file.service;
			hermesFile.name = ares.basename(hermesFile.path);
			next(null, hermesFile);
		}

		function _footer(err, result) {
			self.trace("err:", err, "result:", result);
			if (typeof inEvent.next === 'function') {
				inEvent.next(err, result);
			}
		}
	},
	closeDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var self = this;
		this._closeDocument(inEvent.id, function() {
			if (! Ares.Workspace.files.length ) {
				self.showProjectView();
			}
		});
	},
	/* @private */
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

		if (! Ares.Workspace.files.length ) {
			this.showProjectView();
		}
	},
	/** @private */
	_closeDocument: function(docId, next) {
		if (docId) {
			// remove file from cache
			Ares.Workspace.files.removeEntry(docId);
			ComponentsRegistry.getComponent("documentToolbar").removeTab(docId);
		}
		if (typeof next === 'function') {
			next();
		}
	},
	/** @private */
	_fsEventAction: function(inSender, inEvent) {
		var harmonia = ComponentsRegistry.getComponent("harmonia");
		harmonia.refreshFile(inEvent.nodeId);
	},
	designDocument: function(inSender, inEvent) {
		this.syncEditedFiles();
		ComponentsRegistry.getComponent("deimos").load(inEvent);
		ComponentsRegistry.getComponent("developmentPanel").$.panels.setIndex(this.deimosViewIndex);
		this.activeDocument.setCurrentIF('designer');
	},
	//* A code change happened in Phobos - push change to Deimos
	phobosUpdate: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("deimos").load(inEvent);
	},
	//* A design change happened in Deimos - push change to Phobos
	designerUpdate: function(inSender, inEvent) {
		if (inEvent) {
			ComponentsRegistry.getComponent("phobos").updateComponents(inSender, inEvent);
		}
	},
	closeDesigner: function(inSender, inEvent) {
		this.designerUpdate(inSender, inEvent);
		ComponentsRegistry.getComponent("developmentPanel").$.panels.setIndex(this.phobosViewIndex);
		this.activeDocument.setCurrentIF('code');
		ComponentsRegistry.getComponent("developmentPanel").manageControls(false);
	},
	//* Undo event from Deimos
	designerUndo: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("phobos").undoAndUpdate();
	},
	//* Redo event from Deimos
	designerRedo: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("phobos").redoAndUpdate();
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
		this.$.aresLayoutPanels.getPanels()[this.developmentPanelIndex].switchGrabberDirection(false);
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
	switchFile: function(inSender, inEvent) {
		var d = Ares.Workspace.files.get(inEvent.id);
		if (d) {
			//select project if the file(d) comes from another project then the previous file

			// The following code introduced for ENYO-3142 uncovers a lot of issues
			// this code will be re-introduced once these issues are fixed

			// if (this.activeDocument.id && d !== this.activeDocument){
			// 	var project = Ares.Workspace.projects.get(d.getProjectData().id);
			// 	if(project){
			// 		ComponentsRegistry.getComponent("projectList").selectInProjectList(project);
			// 	}
			// }

			this.switchToDocument(d);		
		} else if (this.debug) {
			throw("File ID " + d + " not found in cache!");
		}
		else {
			alert("File ID not found in cache!");
		}
	},
	switchToDocument: function(d) {
		// We no longer save the data as the ACE edit session will keep the data for us
		if (!this.activeDocument || d !== this.activeDocument) {
			ComponentsRegistry.getComponent("phobos").openDoc(d);
		}
		var currentIF = d.getCurrentIF();
		this.activeDocument = d;
		var developmentPanel = ComponentsRegistry.getComponent("developmentPanel");
		developmentPanel.addPreviewTooltip("Preview "+this.activeDocument.getProjectData().id);
		
		if (currentIF === 'code') {
			developmentPanel.$.panels.setIndex(this.phobosViewIndex);
			developmentPanel.manageControls(false);
		} else {
			ComponentsRegistry.getComponent("phobos").designerAction();
			developmentPanel.manageControls(true);
		}
		this._fileEdited();
		ComponentsRegistry.getComponent("documentToolbar").activateFileWithId(d.getId());
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceDesign: function(inSender, inEvent) {
		var editorMode = ComponentsRegistry.getComponent("developmentPanel").$.panels.getIndex() == this.phobosViewIndex;
		if (editorMode) {
			ComponentsRegistry.getComponent("phobos").designerAction(inSender, inEvent);
		} else {
			ComponentsRegistry.getComponent("deimos").closeDesignerAction();
		}
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceNew: function(inSender, inEvent) {
		this.$.componentsRegistry.phobos.newKindAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring

	// Close is a special case, because it can be invoked on a
	// document other than the currently-active one, so we must first
	// switch the active document and then close it
	bounceCloseFileRequest: function(inSender, inEvent) {
		this.switchFile(inSender, inEvent);
		enyo.asyncMethod(ComponentsRegistry.getComponent("phobos"), "closeDocAction");
	},
	//* Update code running in designer
	syncEditedFiles: function() {
		var files = Ares.Workspace.files,
			model,
			i;
		
		for(i=0;i<files.models.length;i++) {
			model = files.models[i];
			
			if(model.getFile().name === "package.js") {
				continue;
			}

			this.updateCode(files.get(model.id));
		}
	},
	updateCode: function(inDoc) {
		var filename = inDoc.getFile().path,
			aceSession = inDoc.getAceSession(),
			code = aceSession && aceSession.getValue();

		if(filename.slice(-4) === ".css") {
			this.syncCSSFile(filename, code);
		} else if(filename.slice(-3) === ".js") {
			this.syncJSFile(code);
		}
	},

	syncCSSFile: function(inFilename, inCode) {
		ComponentsRegistry.getComponent("deimos").syncCSSFile(inFilename, inCode);
	},

	syncJSFile: function(inCode) {
		ComponentsRegistry.getComponent("deimos").syncJSFile(inCode);
	},

	showWaitPopup: function(inSender, inEvent) {
		if(inEvent.service === 'build' && ! inEvent.msg.match(/Starting/)) {
			// Node server fails if cancel is done during "Starting build" phase
			// See ENYO-3506
			this.$.cancelWaitPopup.show();
		}
		this.$.waitPopupMessage.setContent(inEvent.msg);
		this.$.waitPopup.show();
	},

	cancelService: function(inSender, inEvent) {
		enyo.Signals.send("plugin.phonegap.buildCanceled");
		this.$.cancelWaitPopup.hide();
		this.hideWaitPopup();
	},

	hideWaitPopup: function() {
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
	showDesignerErrorTooltip: function(inSender, inEvent){
		ComponentsRegistry.getComponent("developmentPanel").showErrorTooltip(inSender, inEvent);
	},
	resetDesignerErrorTooltip: function(inSender, inEvent){
		ComponentsRegistry.getComponent("developmentPanel").resetErrorTooltip();
	},
	showDesignerError: function(){
		this.showError("",ComponentsRegistry.getComponent("developmentPanel").getErrorFromDesignerBroken());
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
		var docId = Ares.Workspace.files.computeId(inEvent.node),
			self=this;
		this._closeDocument(docId, function() {
			if (! Ares.Workspace.files.length ) {
				self.showProjectView();
			}
		});
	},
	/**
	 * Event handler for to close opened documents of a project
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent => inEvent.project in Ares.Model.Project
	 */
	closeDocumentsForProject: function(inSender, inEvent){
		var files = Ares.Workspace.files,
			model,
			i;
		for( i = 0; i < files.models.length; i++ ) {
			model = files.models[i];

			var serviceId = model.getProjectData().getServiceId();
			var folderId = model.getProjectData().getFolderId();
			if ( serviceId === inEvent.project.getServiceId() && folderId === inEvent.project.getFolderId()) {
				this._closeDocument(model.id);
				i--;
			}
		}
		if (! Ares.Workspace.files.length ) {
			this.showProjectView();
		} else{
			this.selectProjectForActiveDocument();
		}
	},
	selectProjectForActiveDocument:function(){
		var project = Ares.Workspace.projects.get(this.activeDocument.getProjectData().id);
		if(project){
			ComponentsRegistry.getComponent("projectList").selectInProjectList(project);
		}
	},
	_saveBeforePreview: function(inSender, inEvent){
		var project = Ares.Workspace.projects.get(this.activeDocument.getProjectData().id);
		var files = Ares.Workspace.files;
		var editedDocs = [];
		enyo.forEach(files.models, function(model) {
			var serviceId = model.getProjectData().getServiceId();
			var folderId = model.getProjectData().getFolderId();
			if ( serviceId === project.getServiceId() && folderId === project.getFolderId()) {
				if(model.getEdited()){
					editedDocs.push(model);
				}
			}
		}, this);
		ComponentsRegistry.getComponent("phobos").saveDocumentsBeforePreview(editedDocs);
	},
	_displayPreview: function(inSender, inEvent){
		var project = Ares.Workspace.projects.get(this.activeDocument.getProjectData().id);
		ComponentsRegistry.getComponent("projectView").previewAction(inSender,{project:project});
	},
	_fileEdited: function() {
		ComponentsRegistry.getComponent("developmentPanel").updateDeimosLabel(this.activeDocument.getEdited());
	},
	/**
	 * Event handler for ares components registry
	 * 
	 * @private
	 * @param {Object} inSender
	 * @param {Object} inEvent => inEvent.name in [phobos, deimos, projectView, documentToolbar, harmonia, developmentPanel, accountsConfigurator, ...]
	 */
	_registerComponent: function(inSender, inEvent) {
		ComponentsRegistry.registerComponent(inEvent);

		return true;
	},
	stopEvent: function(){
		return true;
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
	}
});

if ( ! Ares.isBrowserSupported()) {
	alert($L("Ares is designed for the latest version of IE. We recommend that you upgrade your browser or use Chrome"));
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
