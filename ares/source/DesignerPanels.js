enyo.kind({
	name:"Ares.DesignerPanels",
	kind:"FittableRows", 
	components:[
		{kind: "onyx.Toolbar", name:"toolbar", classes: "ares-top-toolbar", layoutKind: "FittableColumnsLayout", noStretch: true, components: [
			{kind: "onyx.Grabber", classes: "ares-grabber", ontap: "activePanel", components:[
				{kind: "aresGrabber", name: "aresGrabberDirection", classes:"lleftArrow"}
			]},
			{name:"editorControls", kind: "FittableColumns", fit:true, components:[
				{kind: "onyx.MenuDecorator", onSelect: "fileMenuItemSelected", components: [
					{content: "File"},
					{kind: "onyx.Menu", floating: true, maxHeight: "100%", components: [
						{name: "saveButton", value: "saveDocAction", components: [
							{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save.png"},
							{content: $L("Save")}
						]},
						{name: "saveAsButton", value: "saveAsDocAction", components: [
							{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-save.png"},
							{content: $L("Save as...")}
						]},
						{classes: "onyx-menu-divider"},
						{name: "closeButton", value: "closeDocAction", components: [
							{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
							{content: $L("Close")}
						]},
						{name: "closeAllButton", value: "closeAllDocAction", components: [
							{kind: "onyx.IconButton", src: "$phobos/assets/images/menu-icon-stop.png"},
							{content: $L("Close All")}
						]}
					]}
				]},
				{name: "newKindButton", kind: "onyx.Button", showing: false, content: $L("New Kind"), ontap: "newKindAction"},
				{fit: true},
				{name: "editorButton", kind: "onyx.Button", content: "Editor Settings", ontap: "editorSettings"},
				{name: "designerButton", kind: "onyx.Button", content: $L("Designer"), ontap: "designerAction"}
			]},
			{name:"deimosControls", kind: "FittableColumns", fit:true,  components:[
				{name: "docLabel", content: "Deimos"},
				{kind: "onyx.PickerDecorator", components: [
					{name: "kindButton", kind: "onyx.PickerButton"},
					{name: "kindPicker", kind: "onyx.Picker", onChange: "kindSelected", components: [
					]}
				]},
				{fit: true},
				{kind: "onyx.Button", content: "Code Editor", ontap: "closeDesignerAction"}
			]}
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
				]}
			]
		}
	],
	events: {
		onRegisterMe: "",
		onMovePanel:""
	},
	published: {
		panelIndex: 2
	},
	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"codeEditor", reference:this});
	},
	switchGrabberDirection: function(active){
		this.$.bottomBar.switchGrabberDirection(active);
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
		this.$.toolbar.resized();
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	}	
});