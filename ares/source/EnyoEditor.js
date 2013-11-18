/*global ComponentsRegistry, ares, Ares, alert, async, enyo, $L */
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
					{kind: "onyx.IconButton", src: "assets/images/code_editor.png", ontap: "closeDesignerAction"},
					{kind: "onyx.Tooltip", content: "Code editor"}
				]}
			]},
			{name: "codePreviewDecorator", kind: "onyx.TooltipDecorator", classes: "ares-icon", components: [
				{kind: "onyx.IconButton", src: "../project-view/assets/images/project_view_preview.png", ontap: "doSavePreviewAction"},
				{kind: "onyx.Tooltip", name:"previewTooltip", content: "Preview"}
			]},
			{classes:"ares-logo-container", components:[
				{name:"logo", kind:"Ares.Logo"}
			]}
		]},
		{ name: "savePopup", kind: "saveActionPopup"},
		{
			name: "bottomBar",
			kind: "DocumentToolbar",
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
					{kind: "Phobos", onCloseDocument: "handleCloseDocument"}
				]},
				{components: [
					{kind: "Deimos", onCloseDesigner: "closeDesigner"}
				]}
			]
		}
	],
	events: {
		onShowWaitPopup: "",
		onHideWaitPopup: "",
		onNewActiveDocument: "", // to preserve legacy in Ares.js
		onAllDocumentsAreClosed: "",
		onRegisterMe: "",
		onMovePanel:"",
		onSavePreviewAction:"",
		onDesignerBroken: "",
		onFileEdited:"_fileEdited",
		onError: ""
	},
	published: {
		panelIndex: 2,
		aceActive: true
	},
	handlers: {
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
		this.doMovePanel({panelIndex:this.panelIndex});
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
	kindSelected: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("deimos").kindSelected(inSender, inEvent);
	},
	designerAction: function() {
		if(ComponentsRegistry.getComponent("phobos").editorUserSyntaxError() !== 0)
		{
			this.userSyntaxErrorPop();
		}
		else
		{
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
	closeDesignerAction: function(){
		ComponentsRegistry.getComponent("deimos").closeDesignerAction();
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
	},

	// Save actions
	saveCurrentDoc: function() {
		var phobos = ComponentsRegistry.getComponent('phobos');
		this.saveDoc(
			this.activeDocument.getName(),
			phobos.getEditorContent(),
			{
				service: this.activeDocument.getProjectData().getService(),
				fileId: this.activeDocument.getFileId()
			}
		);
	},

	saveDoc: function(name,content,where,next){
		var req;

		if (where.fileId) {
			// plain save
			req = where.service.putFile(where.fileId, content);
		} else {
			// used with saveAs
			req = where.service.createFile(where.folderId, where.name, content);
		}

		this.showWaitPopup($L("Saving ") + name + " ...");
		this.trace("Saving doc: " + name + " id " + where.fileId);

		req.response(this, function(inEvent, inData) {
			var docDataId = Ares.Workspace.files.computeId(inEvent.file);
			var docData = Ares.Workspace.files.get(docDataId);
			if(docData){
				docData.setData(content);
			}
			this.saveComplete(docData);
			if (next) {next(null, docData);}
		}).error(this, function(inEvent, inErr) {
			ComponentsRegistry.getComponent("phobos").saveFailed(inErr);
			if (next) {next(inErr);}
		});
	},

	saveComplete: function(inDocData) {
		this.hideWaitPopup();
		var codeLooksGood = false ;
		var phobos = ComponentsRegistry.getComponent('phobos');

		if (inDocData) {
			// TODO: The user may have switched to another file
			// update deimos label with edited status which is actually "not-edited" ...
			inDocData.setEdited(false);
			this._fileEdited();
		}

		if (this.docData === inDocData) {
			codeLooksGood = phobos.reparseUsersCode();
		}
		else {
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

	// close actions

	handleCloseDocument: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.closeDocument(inEvent.id);
	},

	closeActiveDoc: function() {
		var docId = this.activeDocument.getId();
		this.trace("close document:",this.activeDocument.getName());
		ComponentsRegistry.getComponent('phobos').closeSession();
		this.activeDocument = null;
		this.forgetDoc(docId);
	},

	forgetDoc: function(docId) {
		// remove Doc from cache
		ComponentsRegistry.getComponent("documentToolbar").removeTab(docId);
		Ares.Workspace.files.removeEntry(docId);
		if (! Ares.Workspace.files.length ) {
			this.doAllDocumentsAreClosed();
		}
	},

	closeDocument: function(docId, next) {
		if (docId && this.activeDocument.getId() === docId) {
			this.closeActiveDoc();
		}
		else if (docId) {
			this.warn("closing a doc different from current one: ", docId);
			this.forgetDoc(docId);
		}
		else {
			this.warn("called without docId to close");
		}

		if (typeof next === 'function') {
			next();
		}
	},

	switchToDocument: function(newDoc,next) {
		// safety net
		if ( ! newDoc ) {
			if  (this.debug) { throw("File ID " + newDoc + " not found in cache!");}
			else             { alert("File ID not found in cache!");}
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

		//select project if the file(d) comes from another project then the previous file
		if (!oldDoc || oldDoc.getProjectData().getName() !== newName){
			this.trace("also switch project "
					   + (oldDoc ? "from " + oldDoc.getProjectData().getName()  + " " : "")
					   + ' to ' + newDoc.getProjectData().getName());
			var project = Ares.Workspace.projects.get(newDoc.getProjectData().id);
			var projectList = ComponentsRegistry.getComponent("projectList");
			var deimos = ComponentsRegistry.getComponent("deimos");

			// switch document is done in the callback
			async.series(
				[
					projectList.selectInProjectList.bind(projectList,project),
					deimos.projectSelected.bind(deimos,project),
					this._switchDoc.bind(this,newDoc)
				],
				function() {
					if (next) {next();}
				}
			);
		}
		else {
			this._switchDoc(newDoc);
			if (next) {next();}
		}

	},

	// switch Phobos or Deimos to new document
	_switchDoc: function(newDoc) {
		var oldDoc = this.activeDocument ;
		var currentIF = newDoc.getCurrentIF();
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getName()  + " " : " ")
				   + ' to ' + newDoc.getName() + " IF is " + currentIF );
		if (oldDoc && newDoc === oldDoc) {
			// no actual switch
			return;
		}

		// We no longer save the data as the ACE edit session will keep the data for us
		ComponentsRegistry.getComponent("phobos").openDoc(newDoc);

		this.activeDocument = newDoc;
		var enyoEditor = ComponentsRegistry.getComponent("enyoEditor");
		enyoEditor.addPreviewTooltip("Preview " + newDoc.getProjectData().id);

		if (currentIF === 'code') {
			enyoEditor.$.panels.setIndex(this.phobosViewIndex);
			enyoEditor.manageControls(false);
		} else {
			ComponentsRegistry.getComponent("phobos").designerAction();
			enyoEditor.manageControls(true);
		}
		this._fileEdited();
		ComponentsRegistry.getComponent("documentToolbar").activateFileWithId(newDoc.getId());
		this.doNewActiveDocument({ doc: this.activeDocument} );
	},


	// Close documents
	requestCloseCurrentDoc: function(inSender, inEvent) {
		this.requestCloseDoc(this.activeDocument);
	},
	requestCloseDoc: function(doc) {
		var popup = this.$.savePopup ;
		if (doc.getEdited() === true) {
			this.trace("request close doc on ",doc.getName());
			popup.setMessage('"' + doc.getFile().path
					+ '" was modified.<br/><br/>Save it before closing?') ;
			popup.setTitle($L("Document was modified!"));

			popup.setActionButton($L("Don't Save"));
			popup.setActionCallback(this.closeDocument.bind(this,doc));

			popup.setSaveCallback(
				(function() {
					// FIXME 3082 save only current doc
					// other doc need to clean the edit session
					ComponentsRegistry.getComponent('phobos').saveDocAction();
					this.closeActiveDoc();
				}).bind(this)
			);

			popup.setCancelCallback(this.aceFocus.bind(this)) ;

			popup.show();
		} else {
			this.closeActiveDoc();
		}
		return true; // Stop the propagation of the event
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
			{name: "saveAsButton", value:  [ 'phobos', "saveAsDocAction"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save as...")}
			]},
			{classes: "onyx-menu-divider"},
			{name: "closeButton", value:  [ 'enyoEditor', "requestCloseCurrentDoc"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close")}
			]},
			{name: "closeAllButton", value: [ 'phobos', "closeAllDocAction"], classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close All")}
			]}
		]}
	]
});

enyo.kind({
	name: "saveActionPopup",
	kind: "Ares.ActionPopup",

	/** @private */
	create: function() {
		this.inherited(arguments);
		this.$.message.allowHtml = true;
		this.$.buttons.createComponent(
			{name:"saveButton", kind: "onyx.Button", content: $L("Save"), ontap: "save"},
			{owner: this}
		);
	},
	setSaveCallback: function(cb) {
		this.saveCallback = cb;
	},
	/** @private */
	save: function(inSender, inEvent) {
		this.hide();
		if (this.saveCallback) { this.saveCallback(); }
		else {this.doSaveActionPopup();}
	}
});
