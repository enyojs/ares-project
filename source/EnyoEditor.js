/*global ComponentsRegistry, ares, Ares, async, enyo, ilibAres, setTimeout */
enyo.kind({
	name:"Ares.EnyoEditor",
	kind:"FittableRows", 
	components:[
		{kind: "onyx.MoreToolbar", name: "toolbar", classes: "ares-top-toolbar ares-designer-panels", components: [
			{kind: "onyx.Grabber", classes: "ares-grabber ares-icon", ontap: "activePanel", components:[
				{kind: "aresGrabber", name: "aresGrabberDirection", classes: "lleftArrow"}
			]},
			{name: "designerFileMenu", kind: "Ares.FileMenu", onSelect: "fileMenuItemSelected"},
			{name: "editorFileMenu", kind: "Ares.FileMenu", onSelect: "fileMenuItemSelected"},
			{name: "newKindDecorator", kind: "onyx.TooltipDecorator", components: [
				{name: "newKindButton", kind: "onyx.IconButton", src: "assets/images/new_kind.png", ontap: "newKindAction"},
				{kind: "onyx.Tooltip", content: ilibAres("New Kind")}
			]},
			{name: "docLabel", content: "Deimos", classes: "ares-left-margin"},
			{name: "deimosKind", kind: "onyx.PickerDecorator", classes: "ares-right-margin", components: [
				{name: "kindButton", classes:"ares-toolbar-picker deimos-kind-picker", kind: "onyx.PickerButton"},
				{name: "kindPicker", kind: "onyx.Picker", onChange: "kindSelected", components: [
				]}
			]},
			{fit: true},
			{name: "editorSettingDecorator", kind: "onyx.TooltipDecorator", components: [
				{name: "editorButton", kind: "onyx.IconButton", src: "assets/images/editor_settings.png", ontap: "editorSettings"},
				{kind: "onyx.Tooltip", content: ilibAres("Editor Settings")}
			]},
			{name: "designerButtonContainer", components: [ //TO DO: needs to avoid the confusion with phobos adjustPanelForMode
				{name: "designerDecorator", kind: "onyx.TooltipDecorator", components: [
					{name: "designerButton", kind: "onyx.IconButton", src: "assets/images/designer.png", ontap: "designerAction"},
					{name: "designerButtonBroken", kind: "onyx.IconButton", src: "assets/images/designer_broken.png", ontap: "doDesignerBroken"},
					{name: "designerTooltipBroken", kind: "Ares.ErrorTooltip", content: ilibAres("Designer")}
				]}
			]},
			{name: "codeEditorDecorator", kind: "onyx.TooltipDecorator", classes: "ares-icon", components: [
				{kind: "onyx.IconButton", src: "assets/images/code_editor.png", ontap: "closeDesigner"},
				{kind: "onyx.Tooltip", content: ilibAres("Code editor")}
			]},
			{name: "cssHeraDecorator", kind: "onyx.TooltipDecorator", components: [
				{name: "cssButton", kind: "onyx.IconButton", Showing: "false", src: "assets/images/designer.png", ontap: "doCss"},
				{kind: "onyx.Tooltip", content: $L("Css Designer")}
			]},
			{classes:"ares-logo-container", components:[
				{name:"logo", kind:"Ares.Logo"}
			]}
		]},
		{ name: "savePopup", kind: "Ares.ActionPopup", allowHtmlMsg: true},
		{
			name: "saveAsPopup",
			kind: "Ares.FileChooser",
			classes:"ares-masked-content-popup",
			showing: false,
			headerText: ilibAres("Save as..."),
			folderChooser: false,
			onFileChosen: "saveAsFileChosen",
			allowCreateFolder: true,
			allowNewFile: true,
			allowToolbar: true
		},
		{
			name: "overwritePopup",
			kind: "Ares.ActionPopup",
			title: ilibAres("Overwrite"),
			message: ilibAres("Overwrite existing file?"),
			actionButton: ilibAres("Overwrite")
		},
		{
			name: "docToolBar",
			kind: "DocumentToolbar",
			onTabRemoveRequested: "handleCloseDocument",
			onTabChangeRequested: 'handleSwitchDoc',
			onTabChanged: 'handleSwitchDocNoCb', // called when doc is switched after tab removal
			classes: "ares-bottom-bar"
		},
		{
			kind: "Panels",
			arrangerKind: "CarouselArranger",
			draggable: false,
			classes:"enyo-fit ares-panels",
			onTransitionStart : "stopPanelEvent",
			onTransitionFinish: "stopPanelEvent",
			ondragstart	      : "stopPanelEvent",
			ondrag            : "stopPanelEvent",
			ondragfinish      : "stopPanelEvent",
			components: [
				{components: [
					{kind: "Phobos"}
				]},
				{components: [
					{kind: "Deimos"}
				]},
				{components: [
					{kind: "Ares.Hera"},
				]}
			]
		}
	],
	events: {
		onShowWaitPopup: "",
		onHideWaitPopup: "",
		onAllDocumentsAreClosed: "",
		onCloseCss: "",
		onRegisterMe: "",
		onMovePanel:"",
		onDesignerBroken: "",
		onFileEdited:"_fileEdited",
		onError: ""
	},
	published: {
		// harcoded until ENYO-2755 is fixed
		panelIndex: 2,
		aceActive: true
	},
	handlers: {
		onErrorTooltip: "showErrorTooltip",
		onErrorTooltipReset: "resetErrorTooltip",
		onAceGotFocus: "switchProjectToCurrentDoc",
		onChildRequest: "handleCall",
		onAceFocus: "aceFocus",
		onNewcss: "newCss",
		onReplacecss: "replacecss",
		onCssDocument: "cssDocument",
		onEditcss: "doCss",
		onReflowed: "reflowed"
	},
	debug: false,
	create: function() {
		this.inherited(arguments);
		// Setup this.trace() function according to this.debug value
		ares.setupTraceLogger(this);
		this.doRegisterMe({name:"enyoEditor", reference:this});
	},

	/**
	 * handle a Call from children.
	 * @param {Object} inSender
	 * @param {Object} inEvent: inEvent.task: array [ method_name_to_call, arg1, arg2 , ...]
	 * @returns {true}
	 */
	handleCall: function(inSender, inEvent){
		var data = inEvent.task;
		var task = typeof data === 'object' ? data : [ data ];
		var method = task.shift();
		this[method].apply(this, task);
		return true;
	},

	activePanel : function(){
		// my index within the main Ares panels, not index phobos and deimos panels
		this.doMovePanel({panelIndex: this.panelIndex});
	},
	showDeimosPanel: function () {
		this.$.panels.setIndex(1) ;
	},
	showPhobosPanel: function () {
		this.$.panels.setIndex(0) ;
	},
	stopPanelEvent: function(){
		return true;
	},
	fileMenuItemSelected: function(inSender, inEvent) {
		var method = inEvent.selected.value;
		this[method]();
	},
	editorSettings: function(){
		this.$.phobos.editorSettings();
	},
	applySettings: function(settings){
		this.$.phobos.applySettings(settings);
	},
	changeRightPane: function(editorSettings){
		this.$.phobos.changeRightPane(editorSettings);
	},
	newKindAction: function() {
		this.$.phobos.newKindAction();
	},
	requestSelectedText: function() {
		return this.$.phobos.requestSelectedText();
	},
	updateComponentsCode: function(kindList) {
		return this.$.phobos.updateComponentsCode(kindList);
	},
	replaceKind: function(kindIndex, config) {
		return this.$.phobos.replaceKind(kindIndex, config);
	},
	addNewKind: function(config) {
		return this.$.phobos.addNewKind(config);
	},


	/**
	 * event handler for kind Picker
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @returns {true}
	 */
	kindSelected: function(inSender, inEvent) {
		var index = inSender.getSelected().index;
		var deimos = this.$.deimos;
		async.waterfall([
			deimos.selectKind.bind(deimos, index),
			(function(name,next) {
				this.$.kindButton.setContent(name);
				this.$.toolbar.resized();
				next();
			}).bind(this)
		]);
		return true;
	},

	/**
	 * kindPicker let user select the top kind to be designed. By
	 * default, the first one is selected
	 * @param {array} kinds
	 */
	initKindPicker: function(kinds) {
		this.$.kindPicker.destroyClientControls();
		for (var i = 0; i < kinds.length; i++) {
			var k = kinds[i];
			this.$.kindPicker.createComponent({
				content: k.name,
				index: i
			});
		}
		this.$.kindButton.setContent(kinds[0].name);
		this.$.kindPicker.render();
		this.$.toolbar.resized();
	},

	designerAction: function() {
		if(this.$.phobos.editorUserSyntaxError() !== 0) {
			this.userSyntaxErrorPop();
		} else {
			this.$.phobos.designerAction(ares.noNext);
			this.manageControls('designer', 'js');
		}
	},
	enableDesignerButton: function(enable) {
		this.$.designerButton.setShowing(enable);
		this.$.designerButtonBroken.setShowing(! enable);
	},
	userSyntaxErrorPop: function(){
		this.doError({msg: ilibAres("Designer cannot work on a file with a syntax error. Please fix the error highlighted in code editor before launching the designer."), title: ilibAres("Syntax Error")});
	},

	closeDesigner: function(inSender, inEvent){
		if (this.activeDocument.getCurrentIF() === 'hera') {
			this.$.hera.csssave();
			this.manageControls('code','css');
			this.$.panels.setIndex(0);
			this.$.toolbar.resized();
		} else {
			this.$.deimos.closeDesigner(/* bleach */ true);
		}
		return true;
	},

	switchToCodeMode: function() {
		this.trace();
		this.$.panels.setIndex(this.phobosViewIndex);
		this.activeDocument.setCurrentIF('code');
		this.manageControls('code','js');
		this.aceFocus();
	},

	/**
	 * Change controls on the panel top toolbar
	 * 
	 * @private
	 * @param {string} 'code' 'hera' or 'designer', which controls should be available
	 * @param {string} 'js' or 'css' file type that can switch to graphical editor
	 */
	manageControls: function(mode, type){
		var cssMode      = mode === 'hera' ;
		var designerMode = mode === 'designer' ;
		var codeMode     = mode === 'code' ;
		this.trace('called with mode ' + mode );

		this.setAceActive( codeMode );

		//designer mode items
		this.$.designerFileMenu.setShowing(designerMode);
		this.$.docLabel.setShowing(designerMode);
		this.$.deimosKind.setShowing(designerMode);

		// hera mode items
		this.$.cssHeraDecorator.setShowing(codeMode);

		//code editor mode items
		this.$.editorFileMenu.setShowing(codeMode);
		this.$.newKindDecorator.setShowing(codeMode);
		this.$.editorSettingDecorator.setShowing(codeMode);

		// navigation buttons
		this.$.codeEditorDecorator.setShowing(designerMode || cssMode);

		if (type == 'js') {
			this.$.designerButtonContainer.setShowing(codeMode);
		} else if (type == 'css') {
			this.$.cssHeraDecorator.setShowing(codeMode);
		}

		this.$.toolbar.reflow();
		this.$.toolbar.resized();
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	},
	updateDeimosLabel: function(edited) {
		if (edited) {
			this.$.docLabel.setContent("Deimos *");
		} else {
			this.$.docLabel.setContent("Deimos");
		}
		this.$.toolbar.resized();
	},
	aceFocus: function(){
		if(this.getAceActive()){
			this.$.phobos.focusEditor();
		}
	},
	showErrorTooltip: function(inSender, inEvent){
		this.$.designerTooltipBroken.reset("Designer");
		this.$.designerButtonBroken.setDisabled(false);
		this.$.designerTooltipBroken.raise(inEvent);
	},
	resetErrorTooltip: function(){
		this.$.designerTooltipBroken.reset("Designer");
		this.$.designerButtonBroken.setDisabled(true);	
	},
	getErrorFromDesignerBroken: function(){
		return this.$.designerTooltipBroken.error;
	},
	_fileEdited: function() {
		this.updateDeimosLabel(this.activeDocument.getEdited());
	},

	// document currently shown by Ace
	activeDocument: null,

	showWaitPopup: function(inMessage) {
		this.doShowWaitPopup({msg: inMessage});
	},
	hideWaitPopup: function() {
		this.doHideWaitPopup();
		this.aceFocus();
	},

	/**
	 * apply action on each doc of passed project (or project's doc)
	 * or current project (if param is falsy)
	 * @param {Function} action: function called on each project doc
	 * @param {Object} param: project (defaults to activeProject)
	 */
	foreachProjectDocs: function(action, param) {
		var project
				= param instanceof Ares.Model.Project ? param
				: param instanceof Ares.Model.File    ? param.getProjectData()
				:                                       Ares.Workspace.projects.getActiveProject();
		var projectName = project.getName();

		function isProjectDoc(model) {
			return model.getProjectData().getName() === projectName ;
		}
		// backbone collection
		Ares.Workspace.files.filter(isProjectDoc).forEach(action, this);
	},

	// Save actions

	/**
	 * Save all docs of current project
	 */
	saveProjectDocs: function() {
		var saveOne = function(doc) {
			this.saveDoc(doc, ares.noNext);
		};

		this.foreachProjectDocs( saveOne.bind(this) );
	},

	/**
	 * Request (once) to save all docs of a project and call back
	 * @param {Ares.Model.Project} project
	 * @param {Function} next
	 */
	saveProjectDocsWithCb: function(project, next) {
		var popup = this.$.savePopup ;
		var todo = [];
		var toSave = [];

		// check which files need to be saved
		var action = function(doc) {
			if (doc.getEdited() === true) {
				todo.push(this.saveDoc.bind(this, doc)) ;
				toSave.push(doc.getName());
			}
		};
		this.foreachProjectDocs( action.bind(this), project );

		if (todo.length) {
			this.trace("request save project doc on ", project.getName());
			var verb = todo.length > 1 ? 'were' : 'was' ;
			popup.setMessage('"' + toSave.join('", "') + '" ' + verb + ' modified.') ;
			popup.setTitle(ilibAres("Project was modified!"));

			popup.setActionButton(ilibAres("Don't Save"));
			popup.setActionCallback( next );

			popup.setAction1Button(ilibAres("Save"));
			popup.setAction1Callback( async.series.bind(null, todo, next) );

			popup.setCancelCallback(
				(function() {
					next(new Error('canceled'));
				}).bind(this)
			) ;

			popup.show();
		} else {
			setTimeout( next, 0);
		}
	},

	saveAllDocs: function() {
		var saveOne = function(doc) {
			this.saveDoc(doc, ares.noNext);
		};
		Ares.Workspace.files.forEach( saveOne.bind(this) );
	},

	saveCurrentDoc: function() {
		this.saveDoc(this.activeDocument, ares.noNext);
	},

	saveDoc: function(doc, next) {
		ares.assertCb(next);
		var content;
		if (doc === this.activeDocument) {
			content = this.$.phobos.getEditorContent();
		} else {
			content = doc.getEditedData();
		}

		var where = {
			service: doc.getProjectData().getService(),
			fileId: doc.getFileId()
		};
		this.saveFile(doc.getName(), content, where, next);
	},

	saveFile: function(name, content, where, next){
		ares.assertCb(next);
		var req;

		if (where.fileId) {
			// plain save
			this.trace("Saving doc: " + name + " id " + where.fileId);
			req = where.service.putFile(where.fileId, content);
		} else {
			// used with saveAs
			this.trace("Saving doc: " + name + " in dir id " + where.folderId);
			req = where.service.createFile(where.folderId, where.name, content);
		}

		// hide is done in the callbacks below
		this.showWaitPopup(ilibAres("Saving ") + name + " ...");

		req.response(this, function(inSender, inData) {
			this.trace('saveFile response ', inData);
			var savedFile = inData[0]; // only one file was saved
			savedFile.service = where.service;
			var docDataId = Ares.Workspace.files.computeId(savedFile);
			if (! docDataId) {
				this.error("cannot find docDataId from ", savedFile, ' where ', where);
			}
			var docData = Ares.Workspace.files.get(docDataId);
			this.trace('saveFile response ok for ', name, savedFile, docDataId, " => ", docData);
			if(docData){
				docData.setData(content);
				docData.setEditedData(content);
				// update deimos label with edited status which is
				// actually "not-edited" ...
				docData.setEdited(false);
				this._fileEdited();
			}
			this.hideWaitPopup();
			this.analyseData(docData);
			next(null, savedFile);
		}).error(this, function(inSender, inErr) {
			this.trace('saveFile response failed with ' , inErr , ' for ', name, where);
			this.hideWaitPopup();
			this.doError({msg: "Unable to save the file: " + inErr });
			next(inErr);
		});
	},

	analyseData: function(inDocData) {
		var codeLooksGood = false ;
		var phobos = this.$.phobos;

		if (this.activeDocument === inDocData) {
			// current file was just saved
			codeLooksGood = phobos.reparseUsersCode();
		} else {
			this.trace("skipping reparse user code");
		}

		// successful analysis will enable designer button
		this.enableDesignerButton(false);

		// Global analysis is always triggered even if local analysis
		// reports an error.  This way, errors are reported from a
		// single place wherever the error is.  The alternative is to
		// report error during local analysis, which often lead to
		// error reported twice (i.e on first file edit after a
		// project load)
		this.trace("triggering full analysis after file save");
		phobos.projectCtrl.forceFullAnalysis();

		this.trace("done. codeLooksGood: ", codeLooksGood);
	},

	requestSaveDocAs: function() {
		var file = this.activeDocument.getFile();
		var projectData = Ares.Workspace.projects.getActiveProject();
		var buildPopup = function() {
			var path = file.path;
			var relativePath = path.substring(
				path.indexOf(projectData.id) + projectData.id.length,
				path.length
			);
			this.$.saveAsPopup.pointSelectedName(relativePath, true);
			// saveAsPopup may invoke saveAsFileChosen
			this.$.saveAsPopup.show();
		};
		this.$.saveAsPopup.connectProject(projectData, buildPopup.bind(this));
	},
	saveAsFileChosen: function(inSender, inEvent) {
		this.trace(inEvent);

		if (inEvent.file) {
			this.$.saveAsPopup.$.hermesFileTree
				.checkNodeName(inEvent.name, this.requestOverwrite.bind(this, inEvent));
		} else {
			// no file or folder chosen
			this.aceFocus();
		}
	},
	requestOverwrite: function(param,willClobber) {
		var owp = this.$.overwritePopup;
		if (willClobber) {
			owp.setActionCallback(this.saveAs.bind(this, param));
			owp.setCancelCallback(this.aceFocus.bind(this));
			owp.show();
		} else {
			this.saveAs(param);
		}
	},

	saveAs: function(param){
		this.trace( param);

		var relativePath = param.name.split("/");
		var name = relativePath[relativePath.length-1];
		var doc = this.activeDocument;
		var projectData = Ares.Workspace.projects.getActiveProject();
		var file= param.file;
		var content= this.$.phobos.getEditorContent();

		var myNext = (function(err,result) {
			this.trace("err:", err);
			this.hideWaitPopup();
		}).bind(this);

		if (!file) {
			myNext(new Error("Internal error: missing file/folder description"));
			return;
		}

		var aresInstance = ComponentsRegistry.getComponent('ares');
		async.waterfall([
			this.closeDoc.bind(this, doc),
			_prepareNewLocation.bind(this),
			this.saveFile.bind(this, name, content),
			_refreshFileTree.bind(this),
			aresInstance._openDocument.bind(aresInstance, projectData)
		], myNext.bind(this) );

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

		function _refreshFileTree(file, next) {
			this.trace(file);
			// refreshFileTree is async, there's no need to wait before opening
			// the document
			ComponentsRegistry.getComponent("harmonia").refreshFileTree(file.id);
			next(null, file);
		}
	},

	// close actions

	closeActiveDoc: function() {
		var doc = this.activeDocument;
		this.trace("close document:", doc.getName());
		this.$.phobos.closeSession();
		this.activeDocument = null;
		this.forgetDoc(doc) ;
	},

	forgetDoc: function(doc) {
		// remove Doc from cache
		var docId = doc.getId();
		Ares.Workspace.files.removeEntry(docId);
		this.$.docToolBar.removeTab(docId);
		if (! Ares.Workspace.files.length ) {
			this.doAllDocumentsAreClosed();
		}
	},

	/**
	 * close a document
	 * @param {(String|Object)} param: docId or doc
	 * @param {[Function]} next
	 */
	closeDoc: function(param, next) {
		ares.assertCb(next);
		var doc = typeof param === 'object' ? param : Ares.Workspace.files.get(param) ;

		var docId = doc ? doc.getId() : undefined;

		if (docId && this.activeDocument && this.activeDocument.getId() === docId) {
			this.closeActiveDoc();
		} else if (docId) {
			this.trace("closing a doc different from current one: ", doc.getName());
			this.forgetDoc(doc);
		} else {
			this.trace("called without doc to close");
		}

		next();
	},

	switchToNewTabAndDoc: function(projectData, file, inContent,next) {
		ares.assertCb(next);
		this.trace("projectData:", projectData.getName(), ", file:", file.name);
		var fileData = Ares.Workspace.files.newEntry(file, inContent, projectData);
		ComponentsRegistry.getComponent("documentToolbar")
			.createDocTab(file.name, fileData.getId(), file.path);
		this.switchToDocument(fileData, ilibAres("Opening..."), next);
	},

	switchProjectToCurrentDoc: function(inSender, inEvent) {
		var pl = ComponentsRegistry.getComponent("projectList") ;
		if (! this.switching && this.activeDocument) {
			pl.selectProject( this.activeDocument.getProjectData(), ares.noNext );
		}
		return true;
	},

	/**
	 * Handle switch doc event
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @returns {true}
	 */
	handleSwitchDoc: function(inSender, inEvent) {
		var newDoc = Ares.Workspace.files.get(inEvent.userId);
		this.trace(inEvent.id, newDoc);
	
		if(this.$.panels.getIndex() === 2){		// save  hera if user switches tabs away from hera
			this.$.hera.csssave();
			this.reflowed();
		}
		this.switchToDocument(newDoc, ilibAres("Switching file..."), inEvent.next);

		return true;
	},

	/**
	 * Handle switch doc event
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @returns {true}
	 */
	handleSwitchDocNoCb: function(inSender, inEvent) {
		var newDoc = Ares.Workspace.files.get(inEvent.userId);
		this.switchToDocument(newDoc, ilibAres("Switching file..."), ares.noNext);
		return true;
	},

	/**
	 * Switch file *and* project (if necessary)
	 * @param {Object} newDoc
	 * @param {String} popupMsg: message to display in popup message
	 * @param {Code} next
	 * @throws {String} throw an error when File ID is not found in cache
	 */
	switchToDocument: function(newDoc, popupMsg, next) {
		ares.assertCb(next);
		// safety net
		if ( ! newDoc ) {
			if  (this.debug) { throw("File ID " + newDoc + " not found in cache!");}
			setTimeout( function() { next(new Error("File ID not found in cache!")); }, 0);
			return;
		}

		var deimos = this.$.deimos ;
		var oldDoc = this.activeDocument ; // may be undef when a project is closed
		var oldProject = Ares.Workspace.projects.getActiveProject(); // may be undef before opening the first file
		var safeNext = next; // function parameter is not a closure

		// don't open an already opened doc
		if ( oldDoc && newDoc.getId() === oldDoc.getId()) {
			setTimeout( function() { next(); }, 0);
			return ;
		}

		var newName = newDoc.getProjectData().getName() ;
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getName() + " " : "") + "to " + newDoc.getName() );

		var serial = [];
		// used to block onFocus event coming from text editor
		this.switching = true ;

		// select project if the document comes from a different
		// project compared to the project of the previous document
		if (oldProject !== undefined && oldProject.getName() !== newName) {
			var pname =  oldProject ? "from " + oldProject.getName()  + " " : "" ;
			this.trace("also switch project " + pname + ' to ' + newDoc.getProjectData().getName());
			var project = Ares.Workspace.projects.get(newDoc.getProjectData().id);
			var projectList = ComponentsRegistry.getComponent("projectList");

			popupMsg = ilibAres("Switching project...");

			this.resetErrorTooltip();

			serial.push(
				function(_next) { that.doShowWaitPopup({msg: popupMsg}); _next();},
				projectList.selectProject.bind(projectList, project),
				deimos.projectSelected.bind(deimos, newDoc.getProjectData() )
			);
		} else {
			serial.push(
				function(_next) { that.doShowWaitPopup({msg: popupMsg}); _next();}
			);
		}

		var that = this ;
		serial.push(
			this._switchDoc.bind(this, newDoc),
			function(_next) { that.aceFocus(); _next();}
		);

		// no need to handle error, call outer next without params
		async.series( serial, function(err){
			that.doHideWaitPopup();
			that.switching = false ;
			safeNext();
		});
	},

	// FIXME ENYO-3624: this function must trigger a reload of the designer
	// to take into account code modification discarded by user
	reloadDoc: function(doc,next) {
		ares.assertCb(next);
		var reloadedDoc = this.activeDocument ;
		this.activeDocument = null;// reset to trigger reload
		this._switchDoc(reloadedDoc, next);
	},

	/**
	 * switch Phobos or Deimos to new document
	 * @param {Object} newDoc
	 * @param {Function} next
	 */
	_switchDoc: function(newDoc,next) {
		ares.assertCb(next);
		var newProject;
		var phobos = this.$.phobos;

		var oldDoc = this.activeDocument ;
		var currentIF = newDoc.getCurrentIF();
		var oldName = oldDoc ? "from " + oldDoc.getName() + " " : " " ;
		this.trace("switch " + oldName + ' to ' + newDoc.getName() + " IF is " , currentIF );

		if (oldDoc && newDoc === oldDoc) {
			// no actual switch
			setTimeout(next,0);
			return;
		}

		// save current data, this is needed to save project files
		// without switching ace and deimos
		if (oldDoc) {
			oldDoc.setEditedData(phobos.getEditorContent());
		}

		// open ace session (or image viewer)
		var codeOk = phobos.openDoc(newDoc);

		this.activeDocument = newDoc;
		newProject = newDoc.getProjectData() ;
		Ares.Workspace.projects.setActiveProject( newProject.getName() );

		var manageControlParam = 'code' ;
		var type = newDoc.getName().match(/\w+$/) ;
		this.trace("edit file type: " + type);

		var todo = [];
		if (currentIF === 'code') {
			todo.push(
				(function(next) {
					this.$.panels.setIndex(this.phobosViewIndex);
					next();
				}).bind(this)
			);
		}  else if(currentIF === 'hera') {
			todo.push(
				(function(next) {
					this.$.panels.setIndex(2);
					manageControlParam = 'hera';
					next();
				}).bind(this)
			);
		} else if (codeOk) {
			// really switch to designer if code is fine and already in designer mode
			manageControlParam = 'designer' ;
			todo.push(
				phobos.designerAction.bind(phobos)
			) ;
		}

		var _switchDocEnd = function (err) {
			this.manageControls(manageControlParam, type) ;
			this._fileEdited();
			this.$.toolbar.resized();
			this.$.docToolBar.activateDocWithId(newDoc.getId());
			this.trace("_switchDoc done with err ", err);
			setTimeout(next,0) ;
		};

		async.series( todo, _switchDocEnd.bind(this) );

	},


	/**
	 * handle request close doc events coming from TabBar
	 * Request to save doc and close if user agrees
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @returns {true}
	 */
	handleCloseDocument: function(inSender, inEvent) {
		// inEvent.next callback is ditched. Ares will call removeTab
		// when file is closed no matter where the tab removal request
		// comes from.
		var doc = Ares.Workspace.files.get(inEvent.userId);

		async.series([
			this.requestSave.bind(this, doc),
			this.closeDoc.bind(this, doc)
		]);
		return true; // Stop the propagation of the event
	},

	/**
	 * handle request close doc events coming from File menu
	 * Request to save doc and close if user agrees
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @returns {true}
	 */
	requestCloseCurrentDoc: function(inSender, inEvent) {
		async.series([
			this.requestSave.bind(this, this.activeDocument),
			this.closeDoc.bind(this, this.activeDocument)
		]);
		return true; // Stop the propagation of the event
	},

	/**
	 * Close all files of a project
	 * @param {[Object]} project, defaults to current project
	 * @param {[Function]} next
	 */
	requestCloseProject: function (project, next) {
		this.trace("close project requested");
		var serial = [] ;

		// build the serie of functions to be fed to async.series
		this.foreachProjectDocs(
			this._chainSaveClose.bind(this, serial),
			project
		);

		// the real work is done here
		async.series( serial, next ) ;
	},

	_chainSaveClose: function(serial,doc) {
		this.trace("close project will close file " + doc.getName(), doc);
		var close = this.closeDoc.bind(this,doc) ;
		var save  = this.requestSave.bind(this,doc);
		// save and close active doc the last to avoid switch
		var method = this.activeDocument === doc ? 'push' : 'unshift' ;
		serial[method](save, close);
	},

	requestCloseCurrentProject: function(inSender, inEvent) {
		this.requestCloseProject();
		return true ;
	},

	requestCloseAll: function(inSender, inEvent) {
		this.trace("close project requested");
		var serial = [] ;

		// build the serie of functions to be fed to async.series
		Ares.Workspace.files.forEach(
			this._chainSaveClose.bind(this, serial)
		);

		// the real work is done here
		async.series( serial ) ;

		return true ;
	},

	/**
	 * query the user for save before performing next action
	 * @param {Object} doc to save
	 * @param {Function} next
	 */
	requestSave: function(doc, next) {
		ares.assertCb(next);
		var popup = this.$.savePopup ;
		if (doc.getEdited() === true) {
			this.trace("request save doc on ", doc.getName());
			popup.setMessage('"' + doc.getFile().path + '" was modified.<br/><br/>Save it before closing?') ;
			popup.setTitle(ilibAres("Document was modified!"));

			popup.setActionButton(ilibAres("Don't Save"));
			popup.setActionCallback( function() {next(null, doc);});

			popup.setAction1Button(ilibAres("Save"));
			popup.setAction1Callback( this.saveDoc.bind(this, doc, next) );

			popup.setCancelCallback(
				(function() {
					this.reloadDoc(doc, ares.noNext);
					this.aceFocus();
					next(new Error('canceled'));
				}).bind(this)
			) ;

			popup.show();
		} else {
			setTimeout( next.bind(null,null, doc), 0);
		}
	},

	designDocument: function(inData, next) {
		ares.assertCb(next);

		var deimos = this.$.deimos;
		var project = inData.projectData ;
		var todo = [];

		if ( deimos.isDesignerBroken() ) {
			// reload designer
			todo.push( deimos.projectSelected.bind(deimos, project) );
		}

		// send all files being edited to the designer, this
		// will send code to designerFrame
		todo.push( this.syncEditedFiles.bind(this,inData.projectData) );

		// then load palette and inspector, and tune serialiser
		// behavior sends option data to designerFrame and render main
		// kind
		todo.push( deimos.loadDesignerUI.bind(deimos, inData) );

		todo.push((function(next) {
			// switch to Deimos editor
			this.showDeimosPanel();
			// update an internal variable
			this.activeDocument.setCurrentIF('designer');
			next();
		}).bind(this));

		async.series(
			todo,
			(function(err) {
				if (err) {
					this.trace("designDocument -> loadDesignerUI done, err is ",err);
					this.doError({msg: "designDocument ended with error", err: err, callback: next()});
				}
				else {
					this.trace("designDocument done");
					setTimeout(next, 0);
				}
			}).bind(this)
		);
	},

	/**
	 * Update code running in designer
	 * @param {Ares.Model.Project} project, backbone object defined in WorkspaceData.js
	 */
	syncEditedFiles: function(project, next) {
		var projectName = project.getName();
		this.trace("update all edited files on project", projectName);

		function isProjectFile(model) {
			return model.getFile().name !== "package.js"
				&& model.getProjectData().getName() === projectName ;
		}
		// backbone collection
		var tasks = [];
		var pushTask = function(doc) {
			tasks.push( this.updateCode.bind(this, doc) );
		} ;
		Ares.Workspace.files.filter(isProjectFile).forEach(pushTask, this);

		async.series(tasks, next);
	},

	/**
	 *
	 * @param {Ares.Model.File} inDoc is a backbone object defined in FileData.js
	 */
	updateCode: function(inDoc, next) {
		var filename = inDoc.getFile().path,
			aceSession = inDoc.getAceSession(),
			code = aceSession && aceSession.getValue();
		// project is a backbone Ares.Model.Project defined in WorkspaceData.js
		var projectName = inDoc.getProjectData().getName();
		this.trace('code update on file', filename,' project ' , projectName);

		this.$.deimos.syncFile(projectName, filename, code, next);
	},

	undo: function(next) {
		ares.assertCb(next);
		this.$.phobos.undoAndUpdate(next) ;
	},

	redo: function(next) {
		ares.assertCb(next);
		this.$.phobos.redoAndUpdate(next) ;
	},

	loadDesignerUI: function(inData, next) {
		this.$.deimos.loadDesignerUI(inData, next);
	},
	
	/**
	 *  @private
	 * show controls and load data
	 */
	doCss: function (){
		this.$.phobos.cssAction();
		this.manageControls('hera', 'css');
		this.$.toolbar.resized();
	},

	/*
	* write the new css to the end of the file
	* @protected
	*/
	newCss: function(inSender, inEvent){
		this.trace(inSender, inEvent);
		this.$.phobos.newcss(this.$.hera.out);
	},
	
	/*
	* replace the old data in the css file with the new css rules
	* @protected
	*/
	replacecss: function(inSender, inEvent){
		this.trace(inSender, inEvent);
		this.$.phobos.replacecss(this.$.hera.old, this.$.hera.out);
	},
	
	
	/*
	* open hera
	* @protected
	*/
	cssDocument: function(inSender, inEvent){
		this.trace(inSender, inEvent);
		this.$.hera.cssload(inEvent);
		this.$.panels.setIndex(2) ;
		this.activeDocument.setCurrentIF('hera');
	},
	
	/*
	* a reflow to fix deimos fro poking through here
	*/
	reflowed: function(inSender, inEvent){
		this.trace(inSender, inEvent);
	
		var width = this.width * 3;
		var index = this.$.panels.getIndex();
		var styleis = "-webkit-transform: translateX(" + width + "px);";
		
		if(index === 1 ){
			width = 0;
			styleis = "-webkit-transform: translateX(" + width + "px);";
			this.$.deimos.setStyle(styleis);
		}	
		
		if(index === 2 ){
			this.$.deimos.setStyle(styleis);
		}
	}
	
});

/**
	Ares.FileMenu extends _onyx.MenuDecorator_. This contains the various drop-down options (save, close, etc.) in our file menu
*/
enyo.kind({
	name: "Ares.FileMenu",
	kind: "onyx.MenuDecorator",
	classes:"aresmenu ares-right-margin ares-left-margin",
	events: {
		onAceFocus: ""
	},
	// value is the name of an event that will be sent to Phobos
	// through onSelect event -> EnyoEditor.fileMenuItemSelected -> Phobos.fileMenuItemSelected
	components: [
		{tag:"button", content: "File"},
		{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", maxHeight: "100%", components: [
			{name: "saveButton", value: "saveCurrentDoc", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-save-darken.png"},
				{content: ilibAres("Save")}
			]},
			{name: "saveAsButton", value: "requestSaveDocAs", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-save-darken.png"},
				{content: ilibAres("Save as...")}
			]},
			{name: "saveProjectButton", value: "saveProjectDocs", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-save-darken.png"},
				{content: ilibAres("Save Project")}
			]},
			{name: "saveAllDocsButton", value: "saveAllDocs", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-save-darken.png"},
				{content: ilibAres("Save all")}
			]},
			{classes: "onyx-menu-divider"},
			{name: "closeButton", value: "requestCloseCurrentDoc", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-stop.png"},
				{content: ilibAres("Close")}
			]},
			{name: "closeProjectButton", value: "requestCloseCurrentProject", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-stop.png"},
				{content: ilibAres("Close Project")}
			]},
			{name: "closeAllButton", value: "requestCloseAll", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$assets/enyo-editor/phobos/images/menu-icon-stop.png"},
				{content: ilibAres("Close All")}
			]}
		]}
	]
});
