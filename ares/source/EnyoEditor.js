/*global ComponentsRegistry, ares, Ares, async, enyo, $L */
enyo.kind({
	name:"Ares.EnyoEditor",
	kind:"FittableRows", 
	components:[
		{kind: "onyx.MoreToolbar", name:"toolbar", classes: "ares-top-toolbar ares-designer-panels", layoutKind: "FittableColumnsLayout", noStretch: true, components: [
			{kind: "onyx.Grabber", classes: "ares-grabber ares-icon", ontap: "activePanel", components:[
				{kind: "aresGrabber", name: "aresGrabberDirection", classes:"lleftArrow"}
			]},
			{name:"editorControls", kind: "FittableColumns", fit:true, classes: "onyx-toolbar-inline", components:[
				{name: "editorFileMenu", kind: "Ares.FileMenu", onSelect: "fileMenuItemSelected"},
				{name: "newKindDecorator", kind: "onyx.TooltipDecorator", components: [
					{name: "newKindButton", kind: "onyx.IconButton", src: "assets/images/new_kind.png", ontap: "newKindAction"},
					{kind: "onyx.Tooltip", content: $L("New Kind")}
				]},
				{fit: true},
				{name: "editorSettingDecorator", kind: "onyx.TooltipDecorator", components: [
					{name: "editorButton", kind: "onyx.IconButton", src: "assets/images/editor_settings.png", ontap: "editorSettings"},
					{kind: "onyx.Tooltip", content: "Editor Settings"}
				]},
				{name: "designerDecorator", kind: "onyx.TooltipDecorator", components: [
					{name: "designerButton", kind: "onyx.IconButton", src: "assets/images/designer.png", ontap: "designerAction"},
					{name: "designerButtonBroken", kind: "onyx.IconButton", src: "assets/images/designer_broken.png", ontap: "doDesignerBroken"},
					{name: "designerTooltipBroken", kind: "Ares.ErrorTooltip", content: $L("Designer")}
				]}
			]},
			{name:"deimosControls", kind: "FittableColumns", fit:true,  classes: "onyx-toolbar-inline", components:[
				{name: "designerFileMenu", kind: "Ares.FileMenu", onSelect: "fileMenuItemSelected"},
				{name: "docLabel", content: "Deimos", classes: "ares-left-margin"},
				{kind: "onyx.PickerDecorator", classes: "ares-right-margin", components: [
					{name: "kindButton", classes:"ares-toolbar-picker", kind: "onyx.PickerButton"},
					{name: "kindPicker", kind: "onyx.Picker", onChange: "kindSelected", components: [
					]}
				]},
				{fit: true},
				{name: "codeEditorDecorator", kind: "onyx.TooltipDecorator", classes: "ares-icon", components: [
					{kind: "onyx.IconButton", src: "assets/images/code_editor.png", ontap: "closeDesigner"},
					{kind: "onyx.Tooltip", content: "Code editor"}
				]}
			]},
			{name: "codePreviewDecorator", kind: "onyx.TooltipDecorator", classes: "ares-icon", components: [
				{kind: "onyx.IconButton", src: "../project-view/assets/images/project_view_preview.png", ontap: "requestPreview"},
				{kind: "onyx.Tooltip", name:"previewTooltip", content: "Preview"}
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
			headerText: $L("Save as..."),
			folderChooser: false,
			allowCreateFolder: true,
			allowNewFile: true,
			allowToolbar: true
		},
		{
			name: "overwritePopup",
			kind: "Ares.ActionPopup",
			title: $L("Overwrite"),
			message: $L("Overwrite existing file?"),
			actionButton: $L("Overwrite")
		},
		{
			name: "bottomBar",
			kind: "DocumentToolbar",
			onCloseDocRequest: "handleCloseDocument",
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
				]}
			]
		}
	],
	events: {
		onShowWaitPopup: "",
		onHideWaitPopup: "",
		onAllDocumentsAreClosed: "",
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
	// FIXME 3082 move elsewhere
		onDesignDocument: "designDocument",
		onAceFocus: "aceFocus"
	},
	debug: false,
	create: function() {
		this.inherited(arguments);
		// Setup this.trace() function according to this.debug value
		ares.setupTraceLogger(this);
		this.doRegisterMe({name:"enyoEditor", reference:this});
	},
	activePanel : function(){
		// my index within the main Ares panels, not index phobos and deimos panels
		this.doMovePanel({panelIndex:this.panelIndex});
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
		var target = inEvent.selected.value[0];
		var method = inEvent.selected.value[1];
		this.trace("will call " + target + ' ' + method);
		var object = ComponentsRegistry.getComponent(target);
		object[method]();
	},
	editorSettings: function(){
		ComponentsRegistry.getComponent("phobos").editorSettings();
	},
	newKindAction: function() {
		ComponentsRegistry.getComponent("phobos").newKindAction();
	},

	// kind Picker stuff
	kindSelected: function(inSender, inEvent) {
		var index = inSender.getSelected().index;
		var deimos = ComponentsRegistry.getComponent("deimos");
		async.series([
			deimos.selectKind.bind(deimos,index),
			(function(name,next) {
				this.$.kindButton.setContent(name);
				this.$.toolbar.reflow();
				next();
			}).bind(this)
		]);
		return true;
	},

	initKindPicker: function(kinds) {
		// kindPicker let user select the top kind to be designed
		var maxLen ;
		for (var i = 0; i < kinds.length; i++) {
			var k = kinds[i];
			this.$.kindPicker.createComponent({
				content: k.name,
				index: i
			});
			maxLen = Math.max(k.name.length, maxLen);
		}

		this.$.kindButton.setContent(kinds[0].name);
		this.$.kindButton.applyStyle("width", (maxLen+2) + "em");
		this.$.kindPicker.render();
		this.resized();
	},

	designerAction: function() {
		if(ComponentsRegistry.getComponent("phobos").editorUserSyntaxError() !== 0) {
			this.userSyntaxErrorPop();
		} else {
			ComponentsRegistry.getComponent("phobos").designerAction();
			this.manageControls(true);
		}
	},
	enableDesignerButton: function(enable) {
		this.$.designerButton.setShowing(enable);
		this.$.designerButtonBroken.setShowing(! enable);
	},
	userSyntaxErrorPop: function(){
		this.doError({msg: $L("Designer cannot work on a file with a syntax error. Please fix the error highlighted in code editor before launching the designer."), title: $L("Syntax Error")});
	},

	closeDesigner: function(inSender, inEvent){
		ComponentsRegistry.getComponent("deimos").closeDesigner();
		return true;
	},

	switchToCodeMode: function() {
		this.trace();
		this.$.panels.setIndex(this.phobosViewIndex);
		this.activeDocument.setCurrentIF('code');
		this.manageControls(false);
		this.aceFocus();
	},

	/**
	 * Change controls on the panel top toolbar
	 * 
	 * @private
	 * @param {boolean} designer, designer = true if designer's controls should be available
	 */
	manageControls: function(designer){
		this.setAceActive(!designer);
		this.$.editorControls.setShowing(!designer);
		this.$.deimosControls.setShowing(designer);
		this.$.toolbar.resized();
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	},
	addPreviewTooltip: function(message){
		this.$.previewTooltip.setContent(message);
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
			ComponentsRegistry.getComponent("phobos").focusEditor();	
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

	activeDocument: null,

	showWaitPopup: function(inMessage) {
		this.doShowWaitPopup({msg: inMessage});
	},
	hideWaitPopup: function() {
		this.doHideWaitPopup();
		this.aceFocus();
	},

	//* apply action on each doc of passed project (or project's doc)
	// or current project (if param is falsy)
	foreachProjectDocs: function(action,param) {
		var project
				= param instanceof Ares.Model.Project ? param
				: param instanceof Ares.Model.File    ? param.getProjectData()
				:                                       this.activeDocument.getProjectData();
		var projectName = project.getName();

		function isProjectDoc(model) {
			return model.getProjectData().getName() === projectName ;
		}
		// backbone collection
		Ares.Workspace.files.filter(isProjectDoc).forEach(action,this);
	},

	requestPreview: function() {
		// request save one by one and then launch preview
		var previewer = ComponentsRegistry.getComponent("projectView");
		var project = this.activeDocument.getProjectData();
		var serialSaver = [] ;
		this.trace("preview requested on project "+ project.getName());

		// build the serie of functions to be fed to async.series
		this.foreachProjectDocs(
			function(doc) {
				serialSaver.push(
					this.requestSave.bind(this,doc)
				);
			}
		);

		// the real work is done here
		async.series( serialSaver, previewer.launchPreview.bind(previewer,project)) ;
	},

	// Save actions
	saveProjectDocs: function() {
		this.foreachProjectDocs(this.saveDoc.bind(this));
	},

	saveCurrentDoc: function() {
		this.saveDoc(this.activeDocument);
	},

	saveDoc: function(doc) {
		var content;
		if (doc === this.activeDocument) {
			content = ComponentsRegistry.getComponent('phobos').getEditorContent();
		} else {
			content = doc.getEditedData();
		}

		var where = {
			service: doc.getProjectData().getService(),
			fileId: doc.getFileId()
		};
		this.saveFile(doc.getName(), content, where);
	},

	saveFile: function(name,content,where,next){
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
		this.showWaitPopup($L("Saving ") + name + " ...");

		req.response(this, function(inSender,inData) {
			this.log('saveFile response ',inData);
			var savedFile = inData[0]; // only one file was saved
			savedFile.service = where.service;
			var docDataId = Ares.Workspace.files.computeId(savedFile);
			if (! docDataId) {
				this.error("cannot find docDataId from ", savedFile, ' where ', where);
			}
			var docData = Ares.Workspace.files.get(docDataId);
			this.log('saveFile response ok for ',name,savedFile, docDataId, " => ",docData);
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
			if (next) {next(null, savedFile);}
		}).error(this, function(inSender, inErr) {
			this.log('saveFile response failed with ' + inErr + ' for ',name,where);
			this.hideWaitPopup();
			this.doError({msg: "Unable to save the file: " + inErr });
			if (next) {next(inErr);}
		});
	},

	analyseData: function(inDocData) {
		var codeLooksGood = false ;
		var phobos = ComponentsRegistry.getComponent('phobos');

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

		this.trace("done. codeLooksGood: "+ codeLooksGood);
	},

	requestSaveDocAs: function() {
		var file = this.activeDocument.getFile();
		var projectData = this.activeDocument.getProjectData();
		var buildPopup = function() {
			var path = file.path;
			var relativePath = path.substring(
				path.indexOf(projectData.id) + projectData.id.length,
				path.length
			);
			this.$.saveAsPopup.pointSelectedName(relativePath, true);
			this.$.saveAsPopup.setFileChosenCallback(this.saveAsFileChosen.bind(this));
			this.$.saveAsPopup.show();
		};
		this.$.saveAsPopup.connectProject(projectData, buildPopup.bind(this));
	},
	saveAsFileChosen: function(param) {
		this.trace(param);

		if (param.file) {
			this.$.saveAsPopup.$.hermesFileTree
				.checkNodeName(param.name, this.requestOverwrite.bind(this,param));
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
		var projectData= this.activeDocument.getProjectData();
		var file= param.file;
		var content= ComponentsRegistry.getComponent('phobos').getEditorContent();

		var myNext = (function(err,result) {
			this.trace("err:", err);
			this.hideWaitPopup();
			if (typeof param.next === 'function') {
				param.next(err, result);
			}
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

		function _refreshFileTree( file, next) {
			this.log(file);
			// refreshFileTree is async, there's no need to wait before opening
			// the document
			ComponentsRegistry.getComponent("harmonia").refreshFileTree(file.id);
			next(null, file);
		}
	},

	// close actions

	handleCloseDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var doc = Ares.Workspace.files.get(inEvent.id);
		this.requestCloseDoc(doc);
	},

	closeActiveDoc: function() {
		var doc = this.activeDocument;
		this.trace("close document:",doc.getName());
		ComponentsRegistry.getComponent('phobos').closeSession();
		this.activeDocument = null;
		this.forgetDoc(doc) ;
	},

	forgetDoc: function(doc) {
		// remove Doc from cache
		var docId = doc.getId();
		ComponentsRegistry.getComponent("documentToolbar").removeTab(docId);
		Ares.Workspace.files.removeEntry(docId);
		if (! Ares.Workspace.files.length ) {
			this.doAllDocumentsAreClosed();
		}
	},

	//* close a document, param can be a docId or a doc
	closeDoc: function(param, next) {
		var doc = typeof param === 'object' ? param : Ares.Workspace.files.get(param) ;
		var docId = doc.getId();

		if (docId && this.activeDocument && this.activeDocument.getId() === docId) {
			this.closeActiveDoc();
		} else if (docId) {
			this.log("closing a doc different from current one: ", doc.getName());
			this.forgetDoc(doc);
		} else {
			this.warn("called without doc to close");
		}

		if (typeof next === 'function') {
			next();
		}
	},

	switchToNewTabAndDoc: function(projectData, file, inContent,next) {
		this.trace("projectData:", projectData.getName(), ", file:", file.name);
		var fileData = Ares.Workspace.files.newEntry(file, inContent, projectData);
		ComponentsRegistry.getComponent("documentToolbar")
			.createDocTab(file.name, fileData.getId(), file.path);
		this.switchToDocument(fileData,next);
	},

	// switch file *and* project (if necessary)
	switchToDocument: function(newDoc,next) {
		// safety net
		if ( ! newDoc ) {
			if  (this.debug) { throw("File ID " + newDoc + " not found in cache!");}
			next("File ID not found in cache!");
			return;
		}

		var oldDoc = this.activeDocument ; // may be undef when a project is closed

		// don't open an already opened doc
		if ( oldDoc && newDoc.getId() === oldDoc.getId()) {
			if (next) {next();}
			return ;
		}

		var newName = newDoc.getProjectData().getName() ;
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getName() + " " : "")
				   + "to " + newDoc.getName() );

		this.doShowWaitPopup({msg: "switching files"});

		var serial = [];

		//select project if the file(d) comes from another project then the previous file
		if (!oldDoc || oldDoc.getProjectData().getName() !== newName){
			this.trace("also switch project "
					   + (oldDoc ? "from " + oldDoc.getProjectData().getName()  + " " : "")
					   + ' to ' + newDoc.getProjectData().getName());
			var project = Ares.Workspace.projects.get(newDoc.getProjectData().id);
			var projectList = ComponentsRegistry.getComponent("projectList");
			var deimos = ComponentsRegistry.getComponent("deimos");

			serial.push(
				projectList.selectInProjectList.bind(projectList,project),
				deimos.projectSelected.bind(deimos,project)
			);
		}

		serial.push(
			this._switchDoc.bind(this,newDoc),
			this.doHideWaitPopup.bind(this)
		);

		async.series( serial, next );
	},

	// switch Phobos or Deimos to new document
	_switchDoc: function(newDoc) {
		var phobos = ComponentsRegistry.getComponent('phobos');

		var oldDoc = this.activeDocument ;
		var currentIF = newDoc.getCurrentIF();
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getName()  + " " : " ")
				   + ' to ' + newDoc.getName() + " IF is " + currentIF );

		if (oldDoc && newDoc === oldDoc) {
			// no actual switch
			return;
		}

		// save current data, this is needed to save project files
		// without switching ace and deimos
		if (oldDoc) {
			oldDoc.setEditedData(phobos.getEditorContent());
		}

		// open ace or deimos depending on edition mode...
		phobos.openDoc(newDoc);

		this.activeDocument = newDoc;
		this.addPreviewTooltip("Preview " + newDoc.getProjectData().id);

		if (currentIF === 'code') {
			this.$.panels.setIndex(this.phobosViewIndex);
			this.manageControls(false);
		} else {
			phobos.designerAction();
			this.manageControls(true);
		}
		this._fileEdited();
		this.$.bottomBar.activateDocWithId(newDoc.getId());
	},


	// Close documents
	requestCloseDoc: function(doc) {
		async.waterfall([
			this.requestSave.bind(this, doc),
			this.closeDoc.bind(this)
		]);
		return true; // Stop the propagation of the event
	},

	requestCloseCurrentDoc: function(inSender, inEvent) {
		async.waterfall([
			this.requestSave.bind(this, this.activeDocument),
			this.closeDoc.bind(this)
		]);
		return true; // Stop the propagation of the event
	},

	//* Close all files of a project. use current project if
	// project is null. next is optional
	requestCloseProject: function (project,next) {
		this.trace("close project requested");
		var serial = [] ;

		// build the serie of functions to be fed to async.series
		this.foreachProjectDocs(
			this._chainSaveClose.bind(this,serial),
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
			this._chainSaveClose.bind(this,serial)
		);

		// the real work is done here
		async.series( serial ) ;

		return true ;
	},

	//* query the user for save before performing next action
	requestSave: function(doc, next) {
		var popup = this.$.savePopup ;
		if (doc.getEdited() === true) {
			this.trace("request save doc on ",doc.getName());
			popup.setMessage('"' + doc.getFile().path
					+ '" was modified.<br/><br/>Save it before closing?') ;
			popup.setTitle($L("Document was modified!"));

			popup.setActionButton($L("Don't Save"));
			popup.setActionCallback( function() {next(null,doc);});

			popup.setAction1Button($L("Save"));
			popup.setAction1Callback(
				(function() {
					this.saveDoc(doc);
					next(null,doc);
				}).bind(this)
			);

			popup.setCancelCallback(this.aceFocus.bind(this)) ;

			popup.show();
		} else {
			next(null,doc);
		}
	},

		// FIXME 3082 move elsewhere
	designDocument: function(inSender, inEvent) {
		this.trace();
		// send all files being edited to the designer, this will send code to designerFrame
		this.syncEditedFiles(inEvent.projectData);
		// then load palette and inspector, and tune serialiser behavior sends option data to designerFrame
		this.$.deimos.loadDesignerUI(
			inEvent,
			(function(err) {
				this.trace("designDocument -> loadDesignerUI done, err is ",err);
			}).bind(this)
		);
		// switch to Deimos editor
		this.showDeimosPanel();
		// update an internal variable
		this.activeDocument.setCurrentIF('designer');
	},

	/**
	 * Update code running in designer
	 * @param {Ares.Model.Project} project, backbone object defined
	 * in WorkspaceData.js
	 */
	syncEditedFiles: function(project) {
		var projectName = project.getName();
		this.trace("update all edited files on project", projectName);

		function isProjectFile(model) {
			return model.getFile().name !== "package.js"
				&& model.getProjectData().getName() === projectName ;
		}
		// backbone collection
		Ares.Workspace.files.filter(isProjectFile).forEach(this.updateCode,this);
	},

	/**
	 *
	 * @param {Ares.Model.File} inDoc is a backbone object defined in FileData.js
	 */
	updateCode: function(inDoc) {
		var filename = inDoc.getFile().path,
			aceSession = inDoc.getAceSession(),
			code = aceSession && aceSession.getValue();
		// project is a backbone Ares.Model.Project defined in WorkspaceData.js
		var projectName = inDoc.getProjectData().getName();
		this.trace('code update on file', filename,' project ' + projectName);

		this.$.deimos.syncFile(projectName, filename, code);
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
			{name: "saveButton", value: [ 'enyoEditor', "saveCurrentDoc" ], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save")}
			]},
			{name: "saveAsButton", value:  [ 'enyoEditor', "requestSaveDocAs"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save as...")}
			]},
			{name: "saveProjectButton", value: [ 'enyoEditor', "saveProjectDocs" ], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save Project")}
			]},
			{classes: "onyx-menu-divider"},
			{name: "closeButton", value:  [ 'enyoEditor', "requestCloseCurrentDoc"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close")}
			]},
			{name: "closeProjectButton", value:  [ 'enyoEditor', "requestCloseCurrentProject"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close Project")}
			]},
			{name: "closeAllButton", value: [ 'enyoEditor', "requestCloseAll"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close All")}
			]}
		]}
	]
});
