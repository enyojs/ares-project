enyo.kind({
	name: "EditorSettings",
	kind: "onyx.Popup",
	events: {
		onChangeHighLight: "",
		onChangeRightPane: "",
		onChangeTheme: "",
		onWordWrap: "",
		onFontsizeChange: "",
		onClose: "",
		onTabSizeChange: "",
		onSoftTabs: ""
	},
	handlers: {
       // onSelect: "itemSelected"
    },
   published: {
		aceSettings: {
	 		theme:"clouds",
	 		highlight:false,
	 		fontsize:"",
	 		wordwrap:false
	 	},
	 	otherSettings: {
	 		rightpane:false,
	 		keys:{ }
	 	}
	},
	SETTINGS_STORAGE_KEY_ACE: "com.enyojs.editor.settings.ace",
	SETTINGS_STORAGE_KEY_OTHER: "com.enyojs.editor.settings.other",
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
			{name: "rightPane", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "rightPaneChanged"},
		]},
		
		{fit: true, content: " "},
		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "fontSizeLabel", fit: true, classes: "ares_editorfont", content: "Font Size"},
			{style: "width: 90px;", content: " "},
			{kind: "onyx.PickerDecorator", components: [
				{style: "min-width: 100px; font-size: 13px;"},
				{name: "fontSizePicker", kind: "onyx.Picker", onSelect: "fontSize"}
			]}
		]},

		{fit: true, content: " "},
		{tag: "br"},

		{ kind: "FittableColumns", classes:"ares_editorfont", components: [
			{name: "editorThemesLabel", fit: true, classes: "ares_editorfont", content: "Editor Themes"},
			{style: "width: 15px;", content: " "},
			{name : "themesPicker", kind: "onyx.PickerDecorator",

			components: [
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
	
		{kind: "FittableColumns", name: "groupbox7", components: [
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
		{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},
		{name: "change", kind: "onyx.Button", content: "OK/Save", ontap: "saveSettings"},		
		
		{kind: "onyx.Popup", modal: true, floating: true, centered: true, canGenerate: false, name: "modalPopup", components: [
			{kind: "Control", classes: "onyx-toolbar-inline", name: "altInputbox", components: [
					{kind: "onyx.InputDecorator", classes: "phobos_editorsettings_buttoninput", name: "inputDecorator", components: [
							{kind: "onyx.TextArea", placeholder: "Enter text here", classes: "alt_button_input", name: "textArea"}
						]},
					{kind: "Control", tag: "br"},
					{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
					{kind: "onyx.Button", content: "OK/Save", name: "oksave", ontap: "inputChanged"}
				]},
			{kind: "Control", tag: "br"}
		]}
	],
	/**
	 * @private
	 */
	
	create: function() {
		this.inherited(arguments);
		//reading Editor Settings values from localStorage
		var self = this;
		Ares.LocalStorage.get(this.SETTINGS_STORAGE_KEY_ACE, function(str) {
			if (self.debug) self.log("localStorage[" + self.SETTINGS_STORAGE_KEY_ACE + "] = ", str);
			try {
				if(str !== null && str !== undefined){
					self.aceSettings = JSON.parse(str);
				}		
			} catch(e) {
				Ares.LocalStorage.remove(self.SETTINGS_STORAGE_KEY_ACE);
			}
		});

		Ares.LocalStorage.get(self.SETTINGS_STORAGE_KEY_OTHER, function(str) {
			if (self.debug) self.log("localStorage[" + self.SETTINGS_STORAGE_KEY_OTHER + "] = ", str);
			try {
				if(str !== null && str !== undefined){
					self.otherSettings = JSON.parse(str);
				}		
			} catch(e) {
				Ares.LocalStorage.remove(self.SETTINGS_STORAGE_KEY_OTHER);
			}
		});

		//set UI items with values from localStorage
		this.$.highLightButton.value = this.aceSettings.highlight;

		this.$.wordWrapButton.value = this.aceSettings.wordwrap;
		
		for(i in this.$.themes.getClientControls()){
			if(this.$.themes.getClientControls()[i].content == this.aceSettings.theme){
				this.$.themes.setSelected(this.$.themes.getClientControls()[i]);
			}
		}

		var sizes = [6, 8, 10, 12, 13, 16, 20, 24, 30, 36];
		for (var i=1; i<sizes.length; i++) {
			this.$.fontSizePicker.createComponent({
				  content: sizes[i], 
				  active: (sizes[i] == this.aceSettings.fontsize)
				});
		}
		
		this.$.rightPane.value = this.otherSettings.rightpane;

		// lock thems Button's width, so it doesn't move when the caption changes
		this.$.themes.setBounds({width: 100 });
	},

	themeSelected: function(inSender, inEvent) {
        this.aceSettings.theme = inEvent.originator.content;
        this.doChangeTheme();
    },

	buttonToggle: function(inSender, inEvent) {
		this.aceSettings.highlight = inEvent.value;
		this.doChangeHighLight();
	},

	wordWrapToggle: function(inSender, inEvent){
		this.aceSettings.wordwrap = inEvent.value;
		this.doWordWrap();
	},

	fontSize: function(inSender, inEvent) {
		this.aceSettings.fontsize = inEvent.selected.content;
		this.doFontsizeChange();
	},	
	
	rightPaneChanged: function(inSender, inEvent){
		this.otherSettings.rightpane = inEvent.value;
		this.doChangeRightPane();	
	},


	inputChanged: function(inSender, inEvent) {
		var key = this.key;	
		if (/^F\d+/.test(key)) {
			this.otherSettings.keys[key] = this.$.textArea.value;
		}	
		this.$.modalPopup.hide();		
	},

	closeModalPopup: function(inSender){
		this.$.modalPopup.hide();
	},

	showPopup: function(inSender) {
		this.key = inSender.name;
		if (/^F\d+/.test(this.key)) {
			if(this.otherSettings.keys[this.key] === undefined){
				this.$.textArea.setValue("");
			} else this.$.textArea.setValue(this.otherSettings.keys[this.key]);
		}
		this.$.modalPopup.show();
	},

	saveSettings: function() {
		Ares.LocalStorage.set(this.SETTINGS_STORAGE_KEY_ACE, JSON.stringify(this.aceSettings));
		Ares.LocalStorage.set(this.SETTINGS_STORAGE_KEY_OTHER, JSON.stringify(this.otherSettings));
		this.doClose();
	}
});
