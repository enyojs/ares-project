enyo.kind({
	name:"Ares.DesignerPanels",
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
					{kind: "onyx.Tooltip", content: $L("Designer")}
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
					{kind: "Phobos", onSaveDocument: "saveDocument", onSaveAsDocument: "saveAsDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument", onUpdate: "phobosUpdate"}
				]},
				{components: [
					{kind: "Deimos", onCloseDesigner: "closeDesigner"}
				]}
			]
		},
		{kind: "Ares.ErrorPopup", name: "userErrorPopup", msg: $L("unknown error")},
		{name: "savePopup", kind: "saveActionPopup", onConfirmActionPopup: "abandonDocAction", onSaveActionPopup: "saveBeforeClose", onCancelActionPopup: "cancelClose"},
		{name: "savePopupPreview", kind: "saveActionPopup", onConfirmActionPopup: "abandonDocActionOnPreview", onSaveActionPopup: "saveBeforePreviewAction", onCancelActionPopup: "cancelAction"},
		{name: "saveAsPopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, headerText: $L("Save as..."), folderChooser: false, allowCreateFolder: true, allowNewFile: true, allowToolbar: true, onFileChosen: "saveAsFileChosen"},
		{name: "overwritePopup", kind: "overwriteActionPopup", title: $L("Overwrite"), message: $L("Overwrite existing file?"), actionButton: $L("Overwrite"), onConfirmActionPopup: "saveAsConfirm", onCancelActionPopup: "saveAsCancel", onHide:"doAceFocus"}
	],
	events: {
		onShowWaitPopup: "",
		onHideWaitPopup: "",
		onSaveAsDocument: "",
		onRegisterMe: "",
		onMovePanel:"",
		onSavePreviewAction:"",
		onShowWaitPopup: "",
		onSaveDocument: "",
		onDesignerUpdate:"",
		onCloseDocument: "",
		onSwitchFile: "",
		onDisplayPreview:""
	},
	published: {
		panelIndex: 2,
		aceActive: true
	},
	handlers: {
		onAceFocus: "aceFocus",
		onSave:"saveDocAction"
	},
	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"designerPanels", reference:this});
	},
	activePanel : function(){
		this.doMovePanel({panelIndex:this.panelIndex});
	},
	stopPanelEvent: function(){
		return true;
	},
	fileMenuItemSelected: function(inSender, inEvent) {
		var openedPanel = (this.$.panels.index == 1 ? "deimos" : "phobos");
		if (typeof this[inEvent.selected.value] === 'function') {
			this[inEvent.selected.value](openedPanel);
		} else {
			this.warn("Unexpected event or missing function: event:", inEvent.selected.value);
		}
	},
	editorSettings: function(){
		this.owner.componentsRegistry.phobos.editorSettings();
	},
	newKindAction: function() {
		this.owner.componentsRegistry.phobos.newKindAction();
	},
	kindSelected: function(inSender, inEvent) {
		this.owner.componentsRegistry.deimos.kindSelected(inSender, inEvent);
	},
	designerAction: function() {
		if(this.owner.componentsRegistry.phobos.editorUserSyntaxError() !== 0)
		{
			this.userSyntaxErrorPop();
		}
		else
		{
			this.owner.componentsRegistry.phobos.designerAction();
			this.manageControls(true);
		}
	},
	userSyntaxErrorPop: function(){
		this.$.userErrorPopup.raise({msg: $L("Designer cannot work on a file with a syntax error. Please fix the error highlighted in code editor before launching the designer."), title: $L("Syntax Error")});
	},
	closeDesignerAction: function(){
		this.owner.componentsRegistry.deimos.closeDesignerAction();
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
			this.owner.componentsRegistry.phobos.focusEditor();	
		}
	},
	saveDocAction: function(openedPanel) {
		this.doShowWaitPopup({msg:$L("Saving ...")});
		if(openedPanel === "deimos"){
			this.doDesignerUpdate(this.owner.componentsRegistry.deimos.prepareDesignerUpdate());
		} else{
			this.aceFocus();	
		}		
		this.doSaveDocument({content: this.owner.componentsRegistry.phobos.$.ace.getValue(), file: this.owner.componentsRegistry.phobos.docData.getFile()});
		return true;
	},
	saveAsDocAction: function() {
		var docData = this.owner.componentsRegistry.phobos.docData;
		var file = docData.getFile();
		var projectData = docData.getProjectData();
		this.$.saveAsPopup.connectProject(projectData, (function() {
			var path = file.path;
			var relativePath = path.substring(path.indexOf(projectData.id) + projectData.id.length, path.length);
			this.$.saveAsPopup.pointSelectedName(relativePath, true);
			this.$.saveAsPopup.show();
		}).bind(this));
	},
	closeDocAction: function(inSender, inEvent) {
		if (this.owner.componentsRegistry.phobos.docData.getEdited() === true) {
			this.showSavePopup("savePopup",'"' + this.owner.componentsRegistry.phobos.docData.getFile().path + '" was modified.<br/><br/>Save it before closing?');
		} else {
			var id = this.owner.componentsRegistry.phobos.docData.getId();
			this.beforeClosingDocument();
			this.doCloseDocument({id: id});
			this.closeNextDoc();
		}
		return true; // Stop the propagation of the event
	},
	closeAllDocAction: function(inSender, inEvent) {
		this.owner.componentsRegistry.phobos.closeAll = true;
		this.closeNextDoc();
		return true; // Stop the propagation of the event
	},
	saveAsFileChosen: function(inSender, inEvent) {
		//this.trace(inSender, "=>", inEvent);
		
		if (!inEvent.file) {
			this.aceFocus();
			// no file or folder chosen
			return;
		}
		
		var hft = this.$.saveAsPopup.$.hermesFileTree ;
		var next = function(result) {
			if (result) {
				this.$.overwritePopup.set("data", inEvent);
				this.$.overwritePopup.show();
			} else {
				this.saveAsConfirm(inSender, {data: inEvent});
			}
		}.bind(this);

		hft.checkNodeName(inEvent.name, next);		
		
		return true; //Stop event propagation
	},
	/** @private */
	saveAsConfirm: function(inSender, inData){
		//this.trace(inSender, "=>", inData);
		
		var data = inData.data;
		var relativePath = data.name.split("/");
		var name = relativePath[relativePath.length-1];
		var docData = this.owner.componentsRegistry.phobos.docData;
		var openedPanel = (this.$.panels.index == 1 ? 'deimos' : 'phobos');
		var projectData = docData.getProjectData();

		if(openedPanel === 'deimos'){
			this.doDesignerUpdate(this.owner.componentsRegistry.deimos.prepareDesignerUpdate());
			projectData.currentIF = 'designer';
		}	

		this.doShowWaitPopup($L("Saving ..."));
		this.doSaveAsDocument({
			docId: docData.getId(),
			projectData: docData.getProjectData(),
			file: data.file,
			name: name,
			content: this.owner.componentsRegistry.phobos.$.ace.getValue(),
			next: (function(err) {
				this.doHideWaitPopup();
				if (typeof data.next === 'function') {
					data.next();
				}
			}).bind(this)
		});

		return true; //Stop event propagation
	},
	saveAsCancel: function(inSender, inEvent) {
		//this.trace(inSender, "=>", inEvent);

		return true; //Stop event propagation
	},
	// called when "Don't Save" is selected in save popup
	abandonDocAction: function(inSender, inEvent) {
		this.$.savePopup.hide();
		var docData = this.owner.componentsRegistry.phobos.docData;
		this.beforeClosingDocument();
		this.doCloseDocument({id: docData.getId()});
		this.closeNextDoc();
	},
	/*
	 * Perform a few actions before closing a document
	 * @protected
	 */
	beforeClosingDocument: function() {
		this.owner.componentsRegistry.phobos.$.ace.destroySession(this.owner.componentsRegistry.phobos.docData.getAceSession());
		// NOTE: docData will be clear when removed from the Ares.Workspace.files collections
		this.owner.componentsRegistry.phobos.resetAutoCompleteData();
		this.owner.componentsRegistry.phobos.docData = null;
		this.owner.componentsRegistry.phobos.setProjectData(null);
	},
	closeNextDoc: function() {
		if(this.owner.componentsRegistry.phobos.docData && this.owner.componentsRegistry.phobos.closeAll) {
			this.closeDocAction(this.owner.componentsRegistry.phobos);
		} else {
			this.owner.componentsRegistry.phobos.closeAll = false;
		}
	},
	/**
	* @protected
	*/
	showSavePopup: function(componentName, message){
		this.$[componentName].setTitle($L("Document was modified!"));
		this.$[componentName].setMessage(message);
		this.$[componentName].setActionButton($L("Don't Save"));
		this.$[componentName].show();
	},
	saveBeforeClose: function(){
		this.saveDocAction();
		var id = this.owner.componentsRegistry.phobos.docData.getId();
		this.beforeClosingDocument();
		this.doCloseDocument({id: id});
		this.closeNextDoc();
		return true;
	},
	/**
	* @protected
	*/
	saveNextDocument: function(){
		if(this.editedDocs.length >= 1){
			var docData = this.editedDocs.pop();
			this.owner.componentsRegistry.phobos.openDoc(docData);
			this.doSwitchFile({id:docData.id});
			this.showSavePopup("savePopupPreview",'"' + this.docData.getFile().path + '" was modified.<br/><br/>Save it before preview?');
		}else{
			this.aceFocus();
			this.doDisplayPreview();
		}
		return true;
	},
	/** 
	* @protected
	*/
	saveDocumentsBeforePreview: function(editedDocs){
		this.editedDocs = editedDocs;
		this.saveNextDocument();
	},
	/**
	* Called when save button is selected in save popup shown before preview action
	* @protected
	*/
	saveBeforePreviewAction: function(inSender, inEvent){
		this.saveDocAction();
		this.saveNextDocument();
		return true;
	},
	/**
	* Called when don't save button is selected in save popup shown before preview action
	* @protected
	*/
	abandonDocActionOnPreview: function(inSender, inEvent) {
		this.$.savePopup.hide();
		this.aceFocus();
		this.saveNextDocument();
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

enyo.kind({
	name: "saveActionPopup",
	kind: "Ares.ActionPopup",
	events:{
		onSaveActionPopup: ""
	},
	/** @private */
	create: function() {
		this.inherited(arguments);
		this.$.message.allowHtml = true;
		this.$.buttons.createComponent(
			{name:"saveButton", kind: "onyx.Button", content: $L("Save"), ontap: "save"},
			{owner: this}
		);
	},
	/** @private */
	save: function(inSender, inEvent) {
		this.hide();
		this.doSaveActionPopup();
	}
});

enyo.kind({
	name: "overwriteActionPopup",
	kind: "Ares.ActionPopup",
	data: null,
	/** @private */
	create: function() {
		this.inherited(arguments);
	},
	/* Ares.ActionPopup overloading */
	/** @private */
	actionConfirm: function(inSender, inEvent) {
        this.hide();
        this.doConfirmActionPopup({data: this.data});
        return true;
    },
    
});