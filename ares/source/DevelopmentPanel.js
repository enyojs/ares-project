 /* global ComponentsRegistry */
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
				]},
				{name: "cssDecorator", kind: "onyx.TooltipDecorator", components: [
				{name: "cssButton", kind: "onyx.IconButton", Showing: "false", src: "assets/images/designer.png", ontap: "doCss"},
					{kind: "onyx.Tooltip", content: $L("Css Designer")}
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
			{name:"cssControls", kind: "FittableColumns", fit:true,  classes: "onyx-toolbar-inline", components:[
				{fit: true},
				{name: "cssEditorDecorator", kind: "onyx.TooltipDecorator", classes: "ares-icon", components: [
					{kind: "onyx.IconButton", Showing: "false", src: "assets/images/code_editor.png", ontap: "closecssDesigner"},
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
				]},
				{components: [
					{kind: "Hera"},
				]}
			]
		}
	],
	events: {
		onRegisterMe: "",
		onMovePanel:"",
		onCloseCss: "",
		onSavePreviewAction:"",
		onDesignerBroken: ""
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
		this.$.cssControls.setShowing(false);
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
	/**
	 *  @private
	 * show/goto the hera
	 */
	doCss: function(){
		ComponentsRegistry.getComponent("phobos").cssAction();
		this.$.editorControls.setShowing(false);
		this.$.deimosControls.setShowing(false);
		this.$.cssControls.setShowing(true);
		this.$.toolbar.resized();
	},
	closecssDesigner: function(){
		ComponentsRegistry.getComponent("hera").csssave();
		this.$.editorControls.setShowing(true);
		this.$.deimosControls.setShowing(false);
		this.$.cssControls.setShowing(false);
		this.$.toolbar.resized();
		this.doCloseCss();
	},
	resetErrorTooltip: function(){
		this.$.designerTooltipBroken.reset("Designer");
		this.$.designerButtonBroken.setDisabled(true);	
	},
	getErrorFromDesignerBroken: function(){
		return this.$.designerTooltipBroken.error;
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
