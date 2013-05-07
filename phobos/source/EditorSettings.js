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
		{classes: "ares_editorfont", content: "Editor Settings"},
		{tag: "br"},
		{name: "phobosEditorPopup", kind: "FittableColumns", classes:"ares_editorpopup", components: [
			{name: "highLightLabel", fit: true, classes: "ares_editorfont", content: "High light active line"},
			{style: "width: 15px;", content: " "},
			{name: "highLightButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "buttonToggle"},
		]},

		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "wordWrapLabel", fit: true, classes: "ares_editorfont", content: "Word Wrap"},
			{style: "width: 65px;", content: " "},
			{name: "wordWrapButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "wordWrapToggle"},

		]},
		
		{fit: true, content: " "},
		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "rightpane", fit: true, classes: "ares_editorfont", content: "Right Pane "},
			{style: "width: 65px;", content: " "},
			{name: "rightPaneButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "rightPaneChanged"},
		]},
		
		{fit: true, content: " "},
		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "fontSizeLabel", fit: true, classes: "ares_editorfont", content: "Font Size"},
			{style: "width: 90px;", content: " "},
			{kind: "onyx.PickerDecorator", components: [
				{style: "min-width: 100px; font-size: 13px;"},
				{name: "fontSizePicker", kind: "onyx.Picker", onSelect: "fontSize", components:[
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
		]},

		{fit: true, content: " "},
		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "editorThemesLabel", fit: true, classes: "ares_editorfont", content: "Editor Themes"},
			{style: "width: 15px;", content: " "},
			{name : "themesPicker", kind: "onyx.PickerDecorator", components: [
				{style: "min-width: 150px;"},
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
			]},

		]},
		
		{kind: "Control", tag: "br"},
	
		{kind: "FittableColumns", name: "groupbox7", classes:"keys", components: [
				{kind: "Control", content: "Programmable buttons Ctrl-SHIFT F1 to F12"},
				{kind: "Control", tag: "br"},
				{kind: "Control", content: "Mac Programmable buttons Command-SHIFT  F1 to F12"},
				{kind: "Control", tag: "br"},
				{kind: "Control", tag: "br"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-1", name: "F1", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-2", name: "F2", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-3", name: "F3", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-4", name: "F4", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-5", name: "F5", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-6", name: "F6", ontap: "showPopup"},
				{kind: "Control", tag: "br"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-7", name: "F7", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-8", name: "F8", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-9", name: "F9", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-10", name: "F10", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-11", name: "F11", ontap: "showPopup"},
				{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-12", name: "F12", ontap: "showPopup"}
			]},
		
		{tag: "br"},
		{name: "close", kind: "onyx.Button", content: "Cancel", ontap: "doClose"},
		{name: "change", kind: "onyx.Button", content: "Save", ontap: "saveSettings"},		
		
		{kind: "onyx.Popup", modal: true, floating: true, centered: true, canGenerate: false, name: "modalPopup", components: [
			{kind: "Control", classes: "onyx-toolbar-inline", name: "altInputbox", components: [
					{kind: "onyx.InputDecorator", classes: "phobos_editorsettings_buttoninput", name: "inputDecorator", components: [
							{kind: "onyx.TextArea", placeholder: "Enter text here", classes: "alt_button_input", name: "textArea"}
						]},
					{kind: "Control", tag: "br"},
					{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
					{kind: "onyx.Button", content: "OK", name: "oksave", ontap: "inputChanged"}
				]},
			{kind: "Control", tag: "br"}
		]}
	],
	/**
	 * @private
	 */
	
	create: function() {
		this.inherited(arguments);
		this.getValuesFromLocalStorage();
		// lock thems Button's width, so it doesn't move when the caption changes
		this.$.themes.setBounds({width: 100 });
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

	closeModalPopup: function(inSender){
		this.$.modalPopup.hide();
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
