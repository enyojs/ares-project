/* global ComponentsRegistry, alert */
enyo.kind({
	name:"Ares.DevelopmentPanel",
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
					{kind: "Phobos"}
				]},
				{components: [
					{kind: "Deimos", onCloseDesigner: "closeDesigner"}
				]}
			]
		}
	],
	events: {
		onRegisterMe: "",
		onMovePanel:"",
		onSavePreviewAction:"",
		onDesignerBroken: "",
		onFileEdited:"_fileEdited"
	},
	published: {
		panelIndex: 2,
		aceActive: true
	},
	handlers: {
		onAceFocus: "aceFocus"
	},
	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"developmentPanel", reference:this});
	},
	activePanel : function(){
		this.doMovePanel({panelIndex:this.panelIndex});
	},
	stopPanelEvent: function(){
		return true;
	},
	fileMenuItemSelected: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("phobos").fileMenuItemSelected(inSender, inEvent);
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
	_fileEdited: function(){
		ComponentsRegistry.getComponent("developmentController")._fileEdited();
	}
});

enyo.kind({
	name: "Ares.DevelopmentController",
	kind: "enyo.Component",

	events: {
		onRegisterMe: "",
		onNewActiveDocument: "", // to preserve legacy in Ares.js
	},

	debug: false,

	create: function() {
		this.inherited(arguments);

		// Setup this.trace() function according to this.debug value
		ares.setupTraceLogger(this);

		this.doRegisterMe({name:"developmentController", reference:this});
	},

	activeDocument: null,

	switchToDocument: function(newDoc) {
		// safety net
		if ( ! newDoc ) {
			if  (this.debug) { throw("File ID " + newDoc + " not found in cache!");}
			else             { alert("File ID not found in cache!");}
			return;
		}

		var oldDoc = this.activeDocument ; // may be undef when a project is closed
		var newName = newDoc.getProjectData().getName() ;
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getId() + " " : " ")
				   + "to " + newDoc.getId() );

		//select project if the file(d) comes from another project then the previous file
		if (!oldDoc || oldDoc.getProjectData().getName() !== newName){
			this.trace("also switch project "
					   + (oldDoc ? "from " + oldDoc.getProjectData().getName()  + " " : " ")
					   + ' to ' + newDoc.getProjectData().getName());
			var project = Ares.Workspace.projects.get(newDoc.getProjectData().id);
			// switch document is done in the callback
			ComponentsRegistry.getComponent("projectList")
				.selectInProjectList(project, this._switchDoc.bind(this,newDoc));
		}
		else {
			this._switchDoc(newDoc);
		}

	},

	// switch Phobos or Deimos to new document
	_switchDoc: function(newDoc) {
		var oldDoc = this.activeDocument ;
		var currentIF = newDoc.getCurrentIF();
		this.trace("switch " + (oldDoc ? "from " + oldDoc.getId()  + " " : " ")
				   + ' to ' + newDoc.getId() + " IF is " + currentIF );
		// We no longer save the data as the ACE edit session will keep the data for us
		if (!oldDoc || newDoc !== oldDoc) {
			ComponentsRegistry.getComponent("phobos").openDoc(newDoc);
		}
		this.activeDocument = newDoc;
		var developmentPanel = ComponentsRegistry.getComponent("developmentPanel");
		developmentPanel.addPreviewTooltip("Preview " + newDoc.getProjectData().id);

		if (currentIF === 'code') {
			developmentPanel.$.panels.setIndex(this.phobosViewIndex);
			developmentPanel.manageControls(false);
		} else {
			ComponentsRegistry.getComponent("phobos").designerAction();
			developmentPanel.manageControls(true);
		}
		this._fileEdited();
		ComponentsRegistry.getComponent("documentToolbar").activateFileWithId(newDoc.getId());
		this.doNewActiveDocument({ doc: this.activeDocument} );
	},
	_fileEdited: function() {
		ComponentsRegistry.getComponent("developmentPanel").updateDeimosLabel(this.activeDocument.getEdited());
	},

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
	components: [
		{tag:"button", content: "File"},
		{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", maxHeight: "100%", components: [
			{name: "saveButton", value: "saveDocAction", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save")}
			]},
			{name: "saveAsButton", value: "saveAsDocAction", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save-darken.png"},
				{content: $L("Save as...")}
			]},
			{classes: "onyx-menu-divider"},
			{name: "closeButton", value: "closeDocAction", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close")}
			]},
			{name: "closeAllButton", value: "closeAllDocAction", classes:"aresmenu-button", components: [
				{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
				{content: $L("Close All")}
			]}
		]}
	]
});
