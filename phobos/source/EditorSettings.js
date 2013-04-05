enyo.kind({
	name: "EditorSettings",
	kind: "onyx.Popup",
	events: {
		onChangeHighLight: "",
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
					{content: "ambiance", active: true},
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
		{name: "change", kind: "onyx.Button", content: "OK/Save", ontap: "oksave"},		
		
		{kind: "onyx.Popup", modal: true, floating: true, centered: true, canGenerate: false, name: "modalPopup", components: [
			{kind: "Control", classes: "onyx-toolbar-inline", name: "altInputbox", components: [
					{kind: "onyx.InputDecorator", classes: "phobos_editorsettings_buttoninput", name: "inputDecorator", components: [
							{kind: "onyx.TextArea", placeholder: "Enter text here", classes: "alt_button_input", name: "textArea", onchange: "inputChanged"}
						]},
					{kind: "Control", tag: "br"},
					{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
					{kind: "onyx.Button", content: "OK/Save", name: "oksave", ontap: "inputChanged"}
				]},
			{kind: "Control", tag: "br"}
		]}
	],
	create: function() {
		this.inherited(arguments);

		this.theme = localStorage.theme;
		if(this.theme === undefined){
			this.theme = "clouds";
		}
		this.fSize = localStorage.fontsize;

		this.highlight = localStorage.highlight;
		if(!this.highlight || this.highlight.indexOf("false") != -1){
			this.highlight = false;
		}
		this.$.highLightButton.value = this.highlight;

		this.wordWrap = localStorage.wordwrap;
		if(!this.wordWrap || this.wordWrap.indexOf("false") != -1){
			this.wordWrap = false;
		}
		this.$.wordWrapButton.value = this.wordWrap;

		// lock thems Button's width, so it doesn't move when the caption changes
		this.$.themes.setBounds({width: 100 });
		var sizes = [6, 8, 10, 12, 13, 16, 20, 24, 30, 36];
		for (var i=1; i<sizes.length; i++) {
			this.$.fontSizePicker.createComponent({content: sizes[i], active: (i==this.fSize)});
		}
	},

	themeSelected: function(inSender, inEvent) {
        this.theme = inEvent.originator.content;
        this.doChangeTheme();
    },

	buttonToggle: function(inSender, inEvent) {
		this.highlight = inEvent.value;
		this.doChangeHighLight();
	},

	wordWrapToggle: function(inSender, inEvent){
		this.wordWrap = inEvent.value;
		this.doWordWrap();
	},

	oksave: function() {
		localStorage.theme = this.theme;
		localStorage.highlight = this.highlight;
		localStorage.wordwrap = this.wordWrap;
		localStorage.fontsize = this.fSize;
		this.doClose();
	},

	fontSize: function(inSender, inEvent) {
		this.fSize = inEvent.selected.content + "px";
		this.doFontsizeChange();
	},	
	
	inputChanged: function(inSender, inEvent) {
		var key = this.key;	
		if (/^F\d+/.test(key)) {
			localStorage[key] = inSender.getValue();
		}			
		this.$.modalPopup.hide();		
	},
	
	showPopup: function(inSender) {
		this.key = inSender.name;
		this.$.modalPopup.show();
	},

});
