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
		{kind: "Control", classes: "ares_editorfont", content: "Editor Settings", name: "control33"},
		{kind: "Control", tag: "br", name: "control34"},
		{kind: "FittableColumns", classes: "ares_editorpopup", name: "fittableColumns9", components: [
				{kind: "Control", classes: "ares_editorfont", content: "High light active line", fit: true, name: "control35"},
				{kind: "Control", style: "width: 15px;", content: " ", name: "control36"},
				{kind: "onyx.ToggleButton", name: "highLightButton", onChange: "buttonToggle"}
			]},
		{kind: "Control", tag: "br", name: "control37"},
		{kind: "FittableColumns", classes: "ares_editorfont", name: "fittableColumns10", components: [
				{kind: "Control", classes: "ares_editorfont", content: "Word Wrap", fit: true, name: "control38"},
				{kind: "Control", style: "width: 65px;", content: " ", name: "control39"},
				{kind: "onyx.ToggleButton", name: "wordWrapButton", onChange: "wordWrapToggle"}
			]},
		{kind: "Control", content: " ", fit: true, name: "control40"},
		{kind: "Control", tag: "br", name: "control41"},
		{kind: "FittableColumns", classes: "ares_editorfont", name: "fittableColumns11", components: [
				{kind: "Control", classes: "ares_editorfont", content: "Font Size", fit: true, name: "control42"},
				{kind: "Control", style: "width: 90px;", content: " ", name: "control43"},
				{kind: "onyx.PickerDecorator", name: "pickerDecorator3", components: [
						{kind: "onyx.PickerButton", style: "min-width: 100px; font-size: 13px;", name: "pickerButton5"},
						{kind: "onyx.Picker", canGenerate: false, name: "fontSizePicker", onSelect: "fontSize"}
					]}
			]},
		{kind: "Control", content: " ", fit: true, name: "control44"},
		{kind: "Control", tag: "br", name: "control45"},
		{kind: "FittableColumns", classes: "ares_editorfont", name: "fittableColumns12", components: [
				{kind: "Control", classes: "ares_editorfont", content: "Editor Themes", fit: true, name: "control46"},
				{kind: "Control", style: "width: 15px;", content: " ", name: "control47"},
				{kind: "onyx.PickerDecorator", name: "themesPicker", components: [
						{kind: "onyx.PickerButton", style: "min-width: 150px;", content: "ambiance", name: "pickerButton6"},
						{kind: "onyx.Picker", canGenerate: false, name: "themes", components: [
								{kind: "onyx.MenuItem", content: "ambiance", name: "menuItem59"},
								{kind: "onyx.MenuItem", content: "chaos", name: "menuItem60"},
								{kind: "onyx.MenuItem", content: "chrome ", name: "menuItem61"},
								{kind: "onyx.MenuItem", content: "clouds", name: "menuItem62"},
								{kind: "onyx.MenuItem", content: "clouds_midnight", name: "menuItem63"},
								{kind: "onyx.MenuItem", content: "cobalt", name: "menuItem64"},
								{kind: "onyx.MenuItem", content: "crimson_editor", name: "menuItem65"},
								{kind: "onyx.MenuItem", content: "dawn", name: "menuItem66"},
								{kind: "onyx.MenuItem", content: "dreamweaver", name: "menuItem67"},
								{kind: "onyx.MenuItem", content: "eclipse", name: "menuItem68"},
								{kind: "onyx.MenuItem", content: "github", name: "menuItem69"},
								{kind: "onyx.MenuItem", content: "idle_fingers", name: "menuItem70"},
								{kind: "onyx.MenuItem", content: "kr_theme", name: "menuItem71"},
								{kind: "onyx.MenuItem", content: "merbivore", name: "menuItem72"},
								{kind: "onyx.MenuItem", content: "merbivore_soft", name: "menuItem73"},
								{kind: "onyx.MenuItem", content: "mono_industrial", name: "menuItem74"},
								{kind: "onyx.MenuItem", content: "monokai", name: "menuItem75"},
								{kind: "onyx.MenuItem", content: "pastel_on_dark", name: "menuItem76"},
								{kind: "onyx.MenuItem", content: "solarized_dark", name: "menuItem77"},
								{kind: "onyx.MenuItem", content: "solarized_light", name: "menuItem78"},
								{kind: "onyx.MenuItem", content: "textmate", name: "menuItem79"},
								{kind: "onyx.MenuItem", content: "tomorrow", name: "menuItem80"},
								{kind: "onyx.MenuItem", content: "tomorrow_night", name: "menuItem81"},
								{kind: "onyx.MenuItem", content: "tomorrow_night_blue", name: "menuItem82"},
								{kind: "onyx.MenuItem", content: "tomorrow_night_bright", name: "menuItem83"},
								{kind: "onyx.MenuItem", content: "tomorrow_night_eighties", name: "menuItem84"},
								{kind: "onyx.MenuItem", content: "twilight", name: "menuItem85"},
								{kind: "onyx.MenuItem", content: "vibrant_ink", name: "menuItem86"},
								{kind: "onyx.MenuItem", content: "xcode", name: "menuItem87"}
							], onSelect: "themeSelected"}
					]}
			]},
		{kind: "Control", tag: "br", name: "control56"},
		{kind: "onyx.Groupbox", name: "groupbox7", components: [
				{kind: "onyx.GroupboxHeader", content: "Programble buttons", fit: true, name: "groupboxHeader7", components: [
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-1", name: "F1", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-2", name: "F2", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-3", name: "F3", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-4", name: "F4", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-5", name: "F5", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-6", name: "F6", ontap: "showPopup"},
						{kind: "Control", tag: "br", name: "control5"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-7", name: "F7", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-8", name: "F8", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-9", name: "F9", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-10", name: "F10", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-11", name: "F11", ontap: "showPopup"},
						{kind: "onyx.Button", classes: "ares_phobos_esb", content: "F-12", name: "F12", ontap: "showPopup"}
					]}
			]},
		{kind: "Control", tag: "br", name: "control48"},
		{kind: "onyx.Button", content: "Close", name: "close", ontap: "doClose"},
		{kind: "onyx.Button", content: "OK/Save", name: "change", ontap: "oksave"},
		{kind: "onyx.Popup", modal: true, floating: true, centered: true, classes: "onyx-sample-popup", canGenerate: false, name: "modalPopup", components: [
			{classes: "onyx-toolbar-inline", components: [
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.TextArea", placeholder: "Enter text here", onchange:"inputChanged"}
				]},
				{kind: "Control", tag: "br", name: "control6"},
				{kind: "onyx.Button", content: "Close", name: "closeinput", ontap: "closeModalPopup"},
				{kind: "onyx.Button", content: "OK/Save", name: "oksave", ontap: "inputChanged"},
			]},
			{kind: "Control", tag: "br", name: "control7"},
	
		]},
			//onShow: "popupShown", onHide: "popupHidden"}
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
		//this.$.prof1 ="hello";
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
		var editorsettings = 
		{
			theme: this.theme,
			highlight: this.highlight,
			wordWrap: this.wordWrap,
			fSize: this.fSize,
		};
	//	localStorage.editorsettings = editorsettings;
		
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
    
    showPopup: function(inSender) {
		//console.log(inSender.name,	this.parent.f1key);
		this.key = inSender.name;
		this.$.modalPopup.show();
		this.$.inputDecorator3.setContent("john");
	},
	
	closeModalPopup: function(inSender) {
	//	console.log(this.$.proKey,inSender);
		this.$.modalPopup.hide();
	},
	
	inputChanged: function(inSender, inEvent) {
		var key = this.key;
		if(this.key === "F1"){
			localStorage.F1 = inSender.getValue();
		}
		
		if(this.key === "F2"){
			localStorage.F2 = inSender.getValue();
		}
		
		if(this.key === "F3"){
			localStorage.F3 = inSender.getValue();
		}
		
		if(this.key === "F4"){
			localStorage.F4 = inSender.getValue();
		}
		
		if(this.key === "F5"){
			localStorage.F5 = inSender.getValue();
		}
		
		if(this.key === "F6"){
			localStorage.F6 = inSender.getValue();
		}
		
		if(this.key === "F7"){
			localStorage.F7 = inSender.getValue();
		}
		
		if(this.key === "F8"){
			localStorage.F8 = inSender.getValue();
		}
		
		if(this.key === "F9"){
			localStorage.F9 = inSender.getValue();
		}
		
		if(this.key === "F10"){
			localStorage.F10 = inSender.getValue();
		}
		
		if(this.key === "F11"){
			localStorage.F11 = inSender.getValue();
		}
		
		if(this.key === "F12"){
			localStorage.F12 = inSender.getValue();
		}
			
		this.$.modalPopup.hide();
		
	}
	
});
