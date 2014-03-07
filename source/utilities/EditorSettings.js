/*global enyo, ares, Ares, ilibUtilities */

enyo.kind({
	name: "editorSettings",
	events: {
		onCloseSettings: "",
		onApplySettings: "",
		onChangeRightPane: "",
		onTabSizeChange: "",
		onChangeSettings: ""
	},
	published: {
		settings: {},
		previewSettings: {},
		defaultsSettings: {
			theme: "clouds",
			highlight: false,
			fontsize: 12,
			wordwrap: false,
			rightpane: true,
			autoTrace: false,
			hera: false,
			autoTraceLine: 'this.log("sender:", inSender, ", event:", inEvent);',
			keys:{ }
		},
		mainToolbar: true
	},
	SETTINGS_STORAGE_KEY: "com.enyojs.editor.settings",
	components: [
		{classes: "ace-settings-paddings", components: [
			{kind:"FittableColumns", components: [
				{kind:"FittableRows", components: [
					{classes: "ares-row", components: [
						{name: "highLightLabel", tag:"label", classes: "ares-fixed-label ace-label", content: ilibUtilities("High light active line")},
						{name: "highLightButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "buttonToggle"}
					]},
					{classes: "ares-row", components: [
						{name: "wordWrapLabel", tag:"label", classes: "ares-fixed-label ace-label", content: ilibUtilities("Word Wrap")},
						{name: "wordWrapButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "wordWrapToggle"}
					]},
					{classes: "ares-row", components: [
						{name: "rightpane",tag:"label",  classes: "ares-fixed-label ace-label", content: ilibUtilities("Right Panel (only for js files)")},
						{name: "rightPaneButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "rightPaneChanged"}
					]},
					{classes: "ares-row", components: [
						{name: "hera",tag:"label",  classes: "ares-fixed-label ace-label", content: "Css editor (experimental)"},
						{name: "heraButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "heraChanged"}
					]}
				]},
				{kind:"FittableRows", components: [
					{classes: "ares-row", components: [
						{name: "editorThemesLabel", tag:"label", classes: "ares-fixed-label ace-label", content: ilibUtilities("Editor Themes")},
						{name : "themesPicker", kind: "Ares.PickerDecorator", components: [
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
								{content: "xcode"}
							]}
						]}
					]},
					{classes: "ares-row", components: [
						{name: "fontSizeLabel", tag:"label", classes: "ares-fixed-label ace-label", content: ilibUtilities("Font Size")},
						{kind: "Ares.PickerDecorator", components: [
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
								{content: 36}
							]}
						]}
					]},
					{classes: "ares-row", components: [
						{
							tag:"label",
							classes: "ares-fixed-label ace-label",
							content: ilibUtilities("Automatically add log instruction")
						},
						{
							name: "autoTraceButton",
							kind: "onyx.ToggleButton",
							onContent: "On",
							offContent: "Off",
							onChange: "aTrace"
						}
					]}
				]}
			]},
			{tag: "p", classes:"break"},
		
			{kind:"FittableRows", name: "functionKeys", components: [
				{kind: "Control", name:"osMessage", classes:"ares-row", content: ilibUtilities("Programmable buttons Ctrl-SHIFT F1 to F12")},
				{kind: "onyx.MenuDecorator", name:"program_buttons", classes:"ares-row", components: [
					{ kind: "FittableColumns", classes:"ace-keys", components:[
						{kind: "onyx.Button", content: ilibUtilities("F-1"), name: "F1", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-2"), name: "F2", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-3"), name: "F3", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-4"), name: "F4", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-5"), name: "F5", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-6"), name: "F6", ontap: "showPopup"}
					]},
					{ kind: "FittableColumns", classes:"ace-keys", components:[
						{kind: "onyx.Button", content: ilibUtilities("F-7"), name: "F7", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-8"), name: "F8", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-9"), name: "F9", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-10"), name: "F10", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-11"), name: "F11", ontap: "showPopup"},
						{kind: "onyx.Button", content: ilibUtilities("F-12"), name: "F12", ontap: "showPopup"}
					]}
				]}
			]},
			{kind: "onyx.Popup", name: "modalPopup", modal: true, autoDismiss: false, onHide:"restoreButton", classes:" enyo-unselectable ace-contextual-popup ares-classic-popup",
			components: [
				{kind: "Control", classes: "ace-input-popup", name: "altInputbox", components: [
					{kind: "onyx.InputDecorator", classes: "ace-input-textarea", name: "inputDecorator", components: [
						{kind: "onyx.TextArea", placeholder: ilibUtilities("Enter text here"), name: "textArea"}
					]}
				]},
				{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
					{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
					{kind: "onyx.Button", classes:"right", content: ilibUtilities("Update"), name: "oksave", ontap: "inputChanged"}
				]}
			]},
			{tag:"p", classes:"break"},
			{name: "autoTraceInputBox", kind:"FittableRows", showing: false, components: [
				{ classes:"ares-row", content: ilibUtilities("Log instruction injected in your event handlers:")},
				{kind: "onyx.InputDecorator", classes: "ace-input-textarea", components: [
					{
						kind: "onyx.Input",
						style: "width: 100%;",
						placeholder: ilibUtilities("Enter log instruction here"),
						name: "autoTraceInputLine",
						onchange: "atraceline"
					}
				]}
			]}
		]},
		
		{name: "settingsToolbar", kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{name: "close", kind: "onyx.Button", content: ilibUtilities("Cancel"), ontap: "cancelSettings"},
			{name: "restoreDefault", kind: "onyx.Button",  content: ilibUtilities("Restore defaults"), ontap: "restoreDefaults"},
			{name: "change", kind: "onyx.Button", classes: "right", content: ilibUtilities("Save"), ontap: "saveSettings"}
		]}
	],
	/**
	 * @private
	 */
	
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.mainToolbarChanged();

		// clobbers this.settings from what's in local storage
		this.getValuesFromLocalStorage();

		this.$.highLightButton.value = this.settings.highlight;
		this.$.wordWrapButton.value = this.settings.wordwrap;
		this.$.rightPaneButton.value = this.settings.rightpane;
		this.$.heraButton.value = this.settings.hera;
		this.$.autoTraceButton.value = this.settings.autoTrace;
		this.$.autoTraceInputLine.setValue(this.settings.autoTraceLine);
		this.$.autoTraceInputBox.setShowing(this.settings.autoTrace);

		var themesControls = this.$.themes.getClientControls();
		enyo.forEach(themesControls, function(control) {
			if (control.content == this.settings.theme) {
				this.$.themes.setSelected(control);
			}
		}, this);

		var fontSizeControls = this.$.fontSizePicker.getClientControls();
		enyo.forEach(fontSizeControls, function(control) {
			if (control.content == this.settings.fontsize) {
				this.$.fontSizePicker.setSelected(control);
			}
		}, this);

		if(/Macintosh/.test(navigator.userAgent)){
			this.$.functionKeys.hide();
		}

		// serialize
		this.previewSettings = enyo.json.parse(enyo.json.stringify(this.settings));
	},

	mainToolbarChanged: function(){
		if(!this.mainToolbar){
			this.$.settingsToolbar.addClass("white");
		}
	},

	/**
	 * Load editorSettings values for local storage. Undefined (or
	 * missing) values are replaced with their default values
	 */
	getValuesFromLocalStorage:function(){
		var self = this;
		Ares.LocalStorage.get(this.SETTINGS_STORAGE_KEY, function(str) {
			self.trace("localStorage[", self.SETTINGS_STORAGE_KEY, "] = ", str);
			var def = self.defaultsSettings;
			var tmp;
			try {
				if(str !== null && str !== undefined){
					tmp = enyo.json.parse(str);
					enyo.forEach(Object.keys(def), function(k) {
						self.settings[k] = tmp[k] === undefined ? def[k] : tmp[k];
					});
				}else{
					self.settings = enyo.json.parse(enyo.json.stringify(self.defaultsSettings));
				}	
			} catch(e) {
				Ares.LocalStorage.remove(self.SETTINGS_STORAGE_KEY);
			}
		});
	},

	initSettings:function(){
		this.getValuesFromLocalStorage();
		this.initUI(this.settings);
		this.previewSettings = enyo.json.parse(enyo.json.stringify(this.settings));
		this.doApplySettings();
	},
	
	getSettingFromLS: function(){
		this.getValuesFromLocalStorage();
		return this.settings;
	},

	initUI:function(settings){
		//set UI items with values from localStorage
		//change value of toggle button programmaticaly fire event onChange
		//onyx toggle button API says that it not working when the value is changed programmatically
		this.$.highLightButton.setValue(settings.highlight);
		this.$.wordWrapButton.setValue(settings.wordwrap);

		this.$.autoTraceInputLine.setValue( settings.autoTraceLine );
		this.$.autoTraceButton.setValue( settings.autoTrace );
		this.$.autoTraceInputBox.setShowing( settings.autoTrace );

		var themesControls = this.$.themes.getClientControls();
		enyo.forEach(themesControls, function(control) {
			if (control.content == settings.theme) {
				this.$.themes.setSelected(control);
			}
		}, this);

		var fontSizeControls = this.$.fontSizePicker.getClientControls();
		enyo.forEach(fontSizeControls, function(control) {
			if (control.content == settings.fontsize) {
				this.$.fontSizePicker.setSelected(control);
			}
		}, this);

		this.$.rightPaneButton.setValue(settings.rightpane);
		this.$.heraButton.setValue( settings.hera);
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
		this.closeModalPopup();
	},

	closeModalPopup: function(inSender){
		this.$.textArea.setValue(""); //needs to be set here to avoid disappearance of placeholder in FF21
		this.disableKeys(false);
		this.$.modalPopup.hide();
		this.draggable = true;
	},

	restoreButton: function(inSender) {
		this.$[this.key].removeClass("active");
		return true;
	},

	disableKeys: function(disable){
		var i,key;
		for (i=1; i<13; i++) {
			key = 'F' + i;
			this.$[key].setAttribute("disabled", disable);
		}
		if(disable){
			this.$[this.key].setAttribute("disabled", !disable);
		}
	},

	showPopup: function(inSender) {
		this.key = inSender.name;
		if (/^F\d+/.test(this.key)) {
			if(this.previewSettings.keys[this.key] !== undefined){
				this.$.textArea.setValue(this.previewSettings.keys[this.key]);
			}
		}
		this.$[this.key].addClass("active");
		this.disableKeys(true);
		this.$.modalPopup.show();
		this.draggable = false;	
	},

	saveSettings: function() {
		Ares.LocalStorage.set(this.SETTINGS_STORAGE_KEY, enyo.json.stringify(this.previewSettings)); //push to ls 
		this.initUI(this.previewSettings);
		this.doCloseSettings();
	},

	resetSettings: function(){
		this.getValuesFromLocalStorage();
		this.initUI(this.settings);
		this.previewSettings = enyo.json.parse(enyo.json.stringify(this.settings));
		this.doApplySettings();
	},

	cancelSettings: function(){
		this.initUI(this.settings);
		this.previewSettings = enyo.json.parse(enyo.json.stringify(this.settings));
		this.doApplySettings();
		this.doCloseSettings();
	},

	restoreDefaults: function(){
		this.previewSettings = enyo.json.parse(enyo.json.stringify(this.defaultsSettings));
		this.initUI(this.defaultsSettings);
		this.doChangeSettings();
	},
	
	heraChanged: function(inSender, inEvent){
		this.log("sender:", inSender, ", event:", inEvent);
		this.previewSettings.hera = inEvent.value;
		this.doChangeSettings();
	},

	aTrace: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.previewSettings.autoTrace = inEvent.value;
		this.$.autoTraceInputBox.setShowing(this.previewSettings.autoTrace);
	},
	
	atraceline: function(inSender, inEvent){
		this.trace("sender:", inSender, ", event:", inEvent);
		this.previewSettings.autoTraceLine = inSender.value;
	}
});
