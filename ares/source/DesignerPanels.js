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
					{name: "designerButton", kind: "onyx.IconButton", Showing: "false", src: "assets/images/designer.png", ontap: "designerAction"},
					{kind: "onyx.Tooltip", content: $L("Designer")}
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
					{kind: "onyx.IconButton", src: "assets/images/code_editor.png", ontap: "closecssDesigner"},
					{kind: "onyx.Tooltip", content: "Code editor"}
				]}
			]},
		]},
		{
			name: "bottomBar",
			kind: "DocumentToolbar",
			onSwitchFile: "switchFile",
			onSave: "bounceSave",
			onDesign: "bounceDesign",
			onNewKind: "bounceNew",
			onCloseFileRequest: "bounceCloseFileRequest"
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
					{kind: "Deimos", onCloseDesigner: "closeDesigner", onDesignerUpdate: "designerUpdate", onUndo: "designerUndo", onRedo: "designerRedo"}
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
		onCloseCss: ""
	},
	published: {
		panelIndex: 2
	},
	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"codeEditor", reference:this});
	},
	activePanel : function(){
		this.doMovePanel({panelIndex:this.panelIndex});
	},
	stopPanelEvent: function(){
		return true;
	},
	fileMenuItemSelected: function(inSender, inEvent) {
		this.owner.componentsRegistry.phobos.fileMenuItemSelected(inSender, inEvent);
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
		this.owner.componentsRegistry.phobos.designerAction();
		this.manageConrols(true);
	},
	closeDesignerAction: function(){
		this.owner.componentsRegistry.deimos.closeDesignerAction();
		this.manageConrols(false);
	},
	/**
	 * Change controls on the panel top toolbar
	 * 
	 * @private
	 * @param {boolean} designer, designer = true if designer's controls should be available
	 */
	manageConrols: function(designer){
		this.$.editorControls.setShowing(!designer);
		this.$.deimosControls.setShowing(designer);
		this.$.cssControls.setShowing(false);
		this.$.toolbar.resized();
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	},
	doCss: function(){
		this.owner.componentsRegistry.phobos.cssAction();
		this.$.editorControls.setShowing(false);
		this.$.deimosControls.setShowing(false);
		this.$.cssControls.setShowing(true);
		this.$.toolbar.resized();
	},
	closecssDesigner: function(){
		//this.owner.componentsRegistry.deimos.closeDesignerAction();
		this.owner.componentsRegistry.hera.csssave();
		this.$.editorControls.setShowing(true);
		this.$.deimosControls.setShowing(false);
		this.$.cssControls.setShowing(false);
		this.$.toolbar.resized();
		this.doCloseCss();
	}
});

/**
	Ares.FileMenu extends _onyx.MenuDecorator_. This contains the various drop-down options (save, close, etc.) in our file menu
*/
enyo.kind({
	name: "Ares.FileMenu",
	kind: "onyx.MenuDecorator",
	classes:"aresmenu ares-right-margin ares-left-margin",
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
