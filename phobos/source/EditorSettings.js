enyo.kind({
	name: "EditorSettings",
	kind: "onyx.Popup",
	events: {
		onClose: "",
		onChangeRightPane: "",
		onTabSizeChange: "",
		onSoftTabs: "",
		onChangeSettings:""
	},
	handlers: {
       // onSelect: "itemSelected"
    },
   	published: {
	 	settings: {
	 		theme:"clouds",
	 		highlight:false,
	 		fontsize:16,
	 		wordwrap:false,
	 		rightpane:false,
	 		keys:{ }
	 	},
	 	previewSettings: {
	 		theme:"clouds",
	 		highlight:false,
	 		fontsize:16,
	 		wordwrap:false,
	 		rightpane:false,
	 		keys:{ }
	 	}
	},
	SETTINGS_STORAGE_KEY: "com.enyojs.editor.settings",
	components: [
		{tag:"h3", content: "Editor Settings"},
		{kind:"FittableColumns", components: [	
			{kind:"FittableRows", components: [
				{classes: "ares-row", components: [
					{name: "highLightLabel", tag:"label", classes: "ares-fixed-label ace-label", content: "High light active line"},
					{name: "highLightButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "buttonToggle"},
				]},
				{classes: "ares-row", components: [
					{name: "wordWrapLabel", tag:"label", classes: "ares-fixed-label ace-label", content: "Word Wrap"},
					{name: "wordWrapButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "wordWrapToggle"},

				]},
				{classes: "ares-row", components: [
					{name: "rightpane",tag:"label",  classes: "ares-fixed-label ace-label", content: "Right Pane "},
					{name: "rightPaneButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "rightPaneChanged"},
				]}
			]},
			{kind:"FittableRows", components: [
				{classes: "ares-row", components: [
					{name: "editorThemesLabel", tag:"label", classes: "ares-fixed-label ace-label", content: "Editor Themes"},
					{name : "themesPicker", kind: "onyx.PickerDecorator", components: [
						{classes:"large-picker"},
						{name: "themes", kind: "onyx.Picker", onSelect: "themeSelected", components: [
						{content: "ambiance"},
						{content: "chaos"},
						{content: "chrome"},
						{content: "clouds"},
						{content: "clouds_midnight"},
						{content: "cobalt"},
						{content: "crimson_editor"},
						{content: "dawn"},
						{content: "dreamweaver"},
						{content: "eclipse"},
						{content: "github"},
						{content: "idle_fingers"},
						{content: "kr_theme"},
						{content: "merbivore"},
						{content: "merbivore_soft"},
						{content: "mono_industrial"},
						{content: "monokai"},
						{content: "pastel_on_dark"},
						{content: "solarized_dark"},
						{content: "solarized_light"},
						{content: "textmate"},
						{content: "tomorrow"},
						{content: "tomorrow_night"},
						{content: "tomorrow_night_blue"},
						{content: "tomorrow_night_bright"},
						{content: "tomorrow_night_eighties"},
						{content: "twilight"},
						{content: "vibrant_ink"},
						{content: "xcode"},
						]}
					]}
				]},
				{classes: "ares-row", components: [
					{name: "fontSizeLabel", tag:"label", classes: "ares-fixed-label ace-label", content: "Font Size"},
					{kind: "onyx.PickerDecorator", components: [
						{classes:"small-picker"},
						{name: "fontSizePicker",  kind: "onyx.Picker", onSelect: "fontSize", components:[
							{content: 6},
							{content: 8},
							{content: 10},
							{content: 12},
							{content: 13},
							{content: 16},
							{content: 20},
							{content: 24},
							{content: 30},
							{content: 36},
						]}
					]}
				]}
			]}
			
		]},
		{tag:"p", classes:"break"},
		{kind:"FittableRows", components: [
				{name: "groupbox7", classes:"ares-row", components: [
						{kind: "Control", content: "Programmable buttons Ctrl-SHIFT F1 to F12"},
						{kind: "Control", content: "Mac Programmable buttons Command-SHIFT  F1 to F12"},
						{tag:"p", classes:"break"},
						{kind: "onyx.MenuDecorator", name:"program_buttons", classes:"ace-keys", components: [
							{ kind: "FittableColumns", components:[
								{kind: "onyx.Button", content: "F-1", name: "F1", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-2", name: "F2", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-3", name: "F3", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-4", name: "F4", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-5", name: "F5", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-6", name: "F6", ontap: "showPopup"},
							]},
							{ kind: "FittableColumns", components:[
								{kind: "onyx.Button", content: "F-7", name: "F7", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-8", name: "F8", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-9", name: "F9", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-10", name: "F10", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-11", name: "F11", ontap: "showPopup"},
								{kind: "onyx.Button", content: "F-12", name: "F12", ontap: "showPopup"},
								
							]}
						]},

						{kind: "onyx.Popup", name: "modalPopup", modal:"false", onHide:"restoreButton", classes:"ace-contextual-popup", canGenerate: false,
							components: [
								{kind: "Control", classes: "onyx-toolbar-inline", name: "altInputbox", components: [
									{kind: "onyx.InputDecorator", classes: "phobos_editorsettings_buttoninput", name: "inputDecorator", components: [
										{kind: "onyx.TextArea", placeholder: "Enter text here", classes: "alt_button_input", name: "textArea"}
									]},
									{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
									{kind: "onyx.Button", content: "OK", name: "oksave", ontap: "inputChanged"}
								]}
   						]}
				]}
		]},
		{tag:"p", classes:"break"},
		{name: "close", kind: "onyx.Button", content: "Cancel", ontap: "doClose"},
		{name: "change", kind: "onyx.Button", content: "Save", ontap: "saveSettings"},		
	],
	/**
	 * @private
	 */
	
	create: function() {
		this.inherited(arguments);
		this.getValuesFromLocalStorage();
		this.$.highLightButton.value = this.settings.highlight;
		this.$.wordWrapButton.value = this.settings.wordwrap;
		this.$.rightPaneButton.value = this.settings.rightpane;
		for (var i in this.$.themes.getClientControls()){
			if(this.$.themes.getClientControls()[i].content == this.settings.theme){
				this.$.themes.setSelected(this.$.themes.getClientControls()[i]);
			}
		}
		for (var i in this.$.fontSizePicker.getClientControls()){
			if(this.$.fontSizePicker.getClientControls()[i].content == this.settings.fontsize){
				this.$.fontSizePicker.setSelected(this.$.fontSizePicker.getClientControls()[i]);
			}
		}
		this.previewSettings = JSON.parse(JSON.stringify(this.settings));

	},

	getValuesFromLocalStorage:function(){
		var self = this;
		Ares.LocalStorage.get(this.SETTINGS_STORAGE_KEY, function(str) {
			if (self.debug) self.log("localStorage[" + self.SETTINGS_STORAGE_KEY + "] = ", str);
			try {
				if(str !== null && str !== undefined){
					self.settings = JSON.parse(str);
				}		
			} catch(e) {
				Ares.LocalStorage.remove(self.SETTINGS_STORAGE_KEY);
			}
		});
	},

	initSettingsPopupFromLocalStorage:function(){
		//set UI items with values from localStorage
		//change value of toggle button programmaticaly fire event onChange
		//onyx toggle button API says that it not working when the value is changed programmatically
		this.$.highLightButton.setValue(this.settings.highlight);
		this.$.wordWrapButton.setValue(this.settings.wordwrap);

		for (var i in this.$.themes.getClientControls()){
			if(this.$.themes.getClientControls()[i].content == this.settings.theme){
				this.$.themes.setSelected(this.$.themes.getClientControls()[i]);
			}
		}
		for (var i in this.$.fontSizePicker.getClientControls()){
			if(this.$.fontSizePicker.getClientControls()[i].content == this.settings.fontsize){
				this.$.fontSizePicker.setSelected(this.$.fontSizePicker.getClientControls()[i]);
			}
		}
		this.$.rightPaneButton.setValue(this.settings.rightpane);
		//deep copy: settings in previewSettings
		this.previewSettings = JSON.parse(JSON.stringify(this.settings));
	},

	themeSelected: function(inSender, inEvent) {
        this.previewSettings.theme = inEvent.originator.content;
        this.doChangeSettings();
    },

	buttonToggle: function(inSender, inEvent) {
		this.previewSettings.highlight = inEvent.value;
		this.doChangeSettings();
	},

	wordWrapToggle: function(inSender, inEvent){
		this.previewSettings.wordwrap = inEvent.value;
		this.doChangeSettings();
	},

	fontSize: function(inSender, inEvent) {
		this.previewSettings.fontsize = inEvent.selected.content;
		this.doChangeSettings();
	},	
	
	rightPaneChanged: function(inSender, inEvent){
		this.previewSettings.rightpane = inEvent.value;
		this.doChangeRightPane();	
	},


	inputChanged: function(inSender, inEvent) {
		var key = this.key;	
		if (/^F\d+/.test(key)) {
			this.previewSettings.keys[key] = this.$.textArea.value;
		}	
		this.$.modalPopup.hide();		
	},

	closeModalPopup: function(inSender, inEvent){
		this.$.modalPopup.hide();
	},

	restoreButton: function(inSender) {
		this.$[this.key].removeClass("active");
	},

	showPopup: function(inSender) {
		this.key = inSender.name;

		if (/^F\d+/.test(this.key)) {
			if(this.previewSettings.keys[this.key] === undefined){
				this.$.textArea.setValue("");
			} else this.$.textArea.setValue(this.previewSettings.keys[this.key]);
		}
		this.$.modalPopup.show();	
	},

	saveSettings: function() {
		Ares.LocalStorage.set(this.SETTINGS_STORAGE_KEY, JSON.stringify(this.previewSettings));
		//Local storage modified, reading new settings from local storage
		this.getValuesFromLocalStorage();
		this.initSettingsPopupFromLocalStorage();
		this.doClose();
	}
});