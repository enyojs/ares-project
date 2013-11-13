/* global Ares, ServiceRegistry, async, ares, alert, ComponentsRegistry */

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
					classes: "ares-panel-min-width "
				},
				{
					kind: "Harmonia",
					name: "harmonia",
					classes: "ares-panel-min-width enyo-fit",
					onFileDblClick: "openDocument",
					onFileChanged: "closeDocument",
					onFolderChanged: "closeSomeDocuments"
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
		onCloseFileRequest: "bounceCloseFileRequest",
		onRegisterMe : "_registerComponent",
		onMovePanel : "_movePanel",
		onSavePreviewAction: "_saveBeforePreview",
		onDisplayPreview : "_displayPreview",
		onNewActiveDocument: "_setActiveDocument"
	},
	projectListIndex: 0,
	hermesFileTreeIndex: 1,
	enyoEditorIndex: 2,
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	projectListWidth: 300,
	isProjectView: true,
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		ComponentsRegistry.getComponent("enyoEditor").$.panels.setIndex(this.phobosViewIndex);
		ServiceRegistry.instance.setOwner(this); // plumb services events all the way up
		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (Ares.TestController) {
			Ares.Workspace.loadProjects("com.enyojs.ares.tests", true);
			this.createComponent({kind: "Ares.TestController", aresObj: this});
		} else {
			Ares.Workspace.loadProjects();
		}

		Ares.instance = this;
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
		this._openDocument(inEvent.projectData, inEvent.file, function(inErr) {});
	},
	/** @private */
	_openDocument: function(projectData, file, next) {
		var fileDataId = Ares.Workspace.files.computeId(file);
		if (! fileDataId ) {
			throw new Error ('Undefined fileId for file ' + file.name + ' service ' + file.service);
		}
		var fileData = Ares.Workspace.files.get(fileDataId);
		this.trace("open document with project ", projectData.getName(),
				   " file ", file.name, " using cache ", fileData);
		if (fileData) {
			// useful when double clicking on a file in HermesFileTree
			this.switchToDocument(fileData);
		} else {
			this.showWaitPopup(this, {msg: $L("Opening...")});
			async.waterfall(
				[
					this._fetchDocument.bind(this,projectData, file),
					this._switchToNewTab.bind(this,projectData,file)
				],
				(function (err) {
					if (err) {
						this.warn("Open failed", err);
					}
					if (typeof next === 'function') {
						next();
					}
				}).bind(this)
			);
		}
		//hide projectView only the first time
		if (! Ares.Workspace.files.length ) {
			this.hideProjectView();
		}
		
	},

	_switchToNewTab: function(projectData, file, inContent) {
		this.trace("projectData:", projectData.getName(), ", file:", file.name);
		this.hideWaitPopup();
		var fileData = Ares.Workspace.files.newEntry(file, inContent, projectData);
		this.trace(fileData.getId());
		ComponentsRegistry.getComponent("documentToolbar")
			.createFileTab(file.name, fileData.getId(), file.path);
		this.switchToDocument(fileData);
	},

	/** @private */
	_fetchDocument: function(projectData, file, next) {
		this.trace("projectData:", projectData.getName(), ", file:", file.name);
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
			ComponentsRegistry.getComponent("documentToolbar").removeTab(docId);
			Ares.Workspace.files.removeEntry(docId);
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

	_setActiveDocument: function(inSender, inEvent) {
		// register current active Document, even though this should be handled only
		// in EnyoEditor
		this.trace("called for " , inEvent.doc.getName());
		this.activeDocument = inEvent.doc ;
	},

	designDocument: function(inSender, inEvent) {
		// send all files being edited to the designer, this will send code to designerFrame
		this.syncEditedFiles(inEvent.projectData);
		// then load palette and inspector, and tune serialiser behavior sends option data to designerFrame
		ComponentsRegistry.getComponent("deimos").load(inEvent);
		// switch to Deimos editor
		ComponentsRegistry.getComponent("enyoEditor").$.panels.setIndex(this.deimosViewIndex);
		// update an internal variable
		ComponentsRegistry.getComponent("enyoEditor").activeDocument.setCurrentIF('designer');
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
		ComponentsRegistry.getComponent("enyoEditor").$.panels.setIndex(this.phobosViewIndex);
		ComponentsRegistry.getComponent("enyoEditor").activeDocument.setCurrentIF('code');
		ComponentsRegistry.getComponent("enyoEditor").manageControls(false);
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

	// switch file *and* project (if necessary)
	switchFile: function(inSender, inEvent) {
		var newDoc = Ares.Workspace.files.get(inEvent.id);
		ComponentsRegistry.getComponent("enyoEditor").switchToDocument(newDoc);
	},

	// switch Phobos or Deimos to new document
	switchToDocument: function(newDoc) {
		ComponentsRegistry.getComponent("enyoEditor").switchToDocument(newDoc);
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
	syncEditedFiles: function(project) {
		// project is a backbone Ares.Model.Project defined in WorkspaceData.js
		var projectName = project.getName();
		this.trace("update all edited files on project", projectName);
		
		function isProjectFile(model) {
			return model.getFile().name !== "package.js"
				&& model.getProjectData().getName() === projectName ;
		}
		// backbone collection
		Ares.Workspace.files.filter(isProjectFile).forEach(this.updateCode,this);
	},

	updateCode: function(inDoc) {
		// inDoc is a backbone Ares.Model.File defined in FileData.js
		var filename = inDoc.getFile().path,
			aceSession = inDoc.getAceSession(),
			code = aceSession && aceSession.getValue();
		// project is a backbone Ares.Model.Project defined in WorkspaceData.js
		var projectName = inDoc.getProjectData().getName();
		this.trace('code update on file', filename,' project ' + projectName);

		ComponentsRegistry.getComponent("deimos").syncFile(projectName, filename, code);
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
		ComponentsRegistry.getComponent("enyoEditor").showErrorTooltip(inSender, inEvent);
	},
	resetDesignerErrorTooltip: function(inSender, inEvent){
		ComponentsRegistry.getComponent("enyoEditor").resetErrorTooltip();
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
