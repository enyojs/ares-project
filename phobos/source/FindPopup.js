enyo.kind({
	name: "FindPopup",
	kind: "Ares.Popup",
	classes:"ares-classic-popup",
	events: {
		onFindNext:"",
		onFindPrevious:"",
		onReplace:"",
		onReplaceAll:"",
		onReplaceFind: "",
		onClose: ""
	},
	published: {
		findValue:"",
		replaceValue: ""
	},
	handlers: {
		onShow: "shown"
	},
	components: [
		{classes: "title", content: "FIND/REPLACE"},
		{classes: "ace-find-popup", ondragstart:"drop", ondrag:"drop", ondragfinish:"drop", components: [
			{kind: "FittableRows", components: [
				{classes: "ares-row", components: [
					{tag:"label", classes: "ares-fixed-label ace-find-label", content: "Find:"},
					{kind: "onyx.InputDecorator", components: [
						{name: "find", kind: "onyx.Input", oninput: "findChanged"}
					]}
				]},
				{classes: "ares-row", components: [
					{tag:"label", classes: "ares-fixed-label ace-find-label",  content: "Replace:"},
					{kind: "onyx.InputDecorator", components: [
						{name: "replace", kind: "onyx.Input", onchange: "replaceChanged"}
					]}
				]},
				{classes: "ares-row", components: [
					{name:"message", classes: "ace-find-message", fit: true}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "findnext", kind: "onyx.Button", classes: "ace-find-button", content: "Find", ontap: "doFindNext"},
						{name: "findprevious", kind: "onyx.Button", classes: "ace-find-button", content: "Find Prev", ontap: "doFindPrevious"}
					]}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "replaceFind", kind: "onyx.Button", classes: "ace-find-button", content: "Replace/Find", ontap: "doReplaceFind"},			
						{name: "replaceOne", kind: "onyx.Button", classes: "ace-find-button", content: "Replace", ontap: "doReplace"}
					]}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "replaceAll", kind: "onyx.Button", classes: "ace-find-button", content: "Replace All", ontap: "doReplaceAll"}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", classes: "bottom-toolbar", components: [
			{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},
		]}
	],
	create: function(){
		this.inherited(arguments);
		this.findChanged();
	},
	findChanged: function(inSender, inEvent) {
		this.findValue = this.$.find.getValue();
		this.disableActionButtons(this.findValue === "");
	},
	replaceChanged: function(inSender, inEvent) {
		this.replaceValue = this.$.replace.getValue();
	},
	setFindInput: function(value){
		this.$.find.setValue(value);
		this.findChanged();
	},
	disableActionButtons: function(value){
		this.$.replaceOne.setDisabled(value);
		this.$.replaceAll.setDisabled(value);
		this.$.replaceFind.setDisabled(value);
		this.$.findprevious.setDisabled(value);
		this.$.findnext.setDisabled(value);
	},
	removeMessage: function(){
		this.$.message.setContent("");
	},
	updateMessage: function(inResult){
		if(!inResult){
			this.$.message.setContent(this.findValue+" not found");
		} else {
			this.removeMessage();
		}
		
	},
	shown: function(inSender, inEvent) {
		this.$.find.focus();
	},
	drop: function(inSender, inEvent){
		return true;
	}
});