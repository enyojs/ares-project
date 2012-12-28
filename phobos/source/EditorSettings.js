// Copyright 2012, $ORGANIZATION
// All rights reserved.
enyo.kind({
	name: "EditorSettings",
	kind: "onyx.Popup",
	events: {
		onChangeHighLight: "",
		onChangeTheme: "",
		onWordWrap: "",
		onClose: ""
	},
	handlers: {
        onSelect: "itemSelected"
    },
	components: [
		{content: "Editor Settings"},
		{tag: "br"},
		{ kind: "FittableColumns", classes:"ares_editorpopup",components: [			
			{classes: "onyx-sample-divider", content: "High light active line"},
			{style: "width: 15px;", content: " "},
			{name: "highLightButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "buttonToggle"},			
		]},
		{tag: "br"},
		{ kind: "FittableColumns", classes:"ares_editorfont",components: [
			{classes: "onyx-sample-divider", content: "Word Wrap"},
			{style: "width: 60px;", content: " "},
			{name: "wordWrapButton", kind: "onyx.ToggleButton", onContent: "On", offContent: "Off", onChange: "wordWrapToggle"},
		
		]},
		
		{fit: true, content: " "},
		{tag: "br"},
		{ kind: "FittableColumns", classes:"ares_editorfont",components: [
			{content: "Editor Themes"},
			{style: "width: 15px;", content: " "},
			{name : "themesPicker", kind: "onyx.PickerDecorator",
	
			components: [
				{style: "min-width: 150px;"},
					{name: "themes", kind: "onyx.Picker", components: [
					{content: "ambiance", active: true},
					{content: "chaos"},
					{content: "chrome "},
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
		{tag: "br"},
		{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},		
		{name: "change", kind: "onyx.Button", content: "OK/Save", ontap: "oksave"}
	],
	create: function() {
		this.inherited(arguments);
		
		this.theme = localStorage.theme;
		this.highlight = localStorage.highlight;
		this.wordWrap = localStorage.wordwrap;
	
		this.$.highLightButton.value = this.highlight;
		this.$.wordWrapButton.value = this.wordWrap;
		
		// initialization code goes here
		// lock thems Button's width, so it doesn't move when the caption changes		
		this.$.themes.setBounds({width: 100 });
		
	},

	itemSelected: function(inSender, inEvent) {
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
		this.doClose();
	}
    
});
