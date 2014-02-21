/*global ilibPhobos */
enyo.kind({
	name: "FindPopup",
	kind: "onyx.Popup",
	classes: "ares-classic-popup",
	events: {
		onFindNext: "",
		onFindPrevious: "",
		onReplace: "",
		onReplaceAll: "",
		onReplaceFind: "",
		onClose: ""
	},
	published: {
		findValue: "",
		replaceValue: ""
	},
	handlers: {
		onShow: "shown"
	},
	components: [
		{classes: "title draggable", kind: "Ares.PopupTitle", content: ilibPhobos("FIND/REPLACE")},
		{classes: "ace-find-popup", components: [
			{kind: "FittableRows", components: [
				{classes: "ares-row", components: [
					{tag: "label", classes: "ares-fixed-label ace-find-label", content: ilibPhobos("Find:")},
					{kind: "onyx.InputDecorator", components: [
						{name: "find", kind: "onyx.Input", oninput: "findChanged"}
					]}
				]},
				{classes: "ares-row", components: [
					{tag: "label", classes: "ares-fixed-label ace-find-label",  content: ilibPhobos("Replace:")},
					{kind: "onyx.InputDecorator", components: [
						{name: "replace", kind: "onyx.Input", oninput: "replaceChanged"}
					]}
				]},
				{classes: "ares-row", components: [
					{name: "message", classes: "ace-find-message", fit: true}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "findnext", kind: "onyx.Button", classes: "ace-find-button", content: ilibPhobos("Find"), ontap: "doFindNext"},
						{name: "findprevious", kind: "onyx.Button", classes: "ace-find-button", content: ilibPhobos("Find Prev"), ontap: "doFindPrevious"}
					]}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "replaceFind", kind: "onyx.Button", classes: "ace-find-button", content: ilibPhobos("Replace/Find"), ontap: "doReplaceFind"},			
						{name: "replaceOne", kind: "onyx.Button", classes: "ace-find-button", content: ilibPhobos("Replace"), ontap: "doReplace"}
					]}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes: "ace-find-left", fit: true, components: [
						{name: "replaceAll", kind: "onyx.Button", classes: "ace-find-button", content: ilibPhobos("Replace All"), ontap: "doReplaceAll"}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", classes: "bottom-toolbar", components: [
			{name: "close", kind: "onyx.Button", content: ilibPhobos("Close"), ontap: "doClose"},
		]}
	],
	create: function(){
		this.inherited(arguments);
		this.findChanged();
	},
	findChanged: function(inSender, inEvent) {
		this.findValue = this.$.find.getValue();
		this.disableActionButtons(this.findValue === "");
		this.disableReplaceButtons(true);
	},
	replaceChanged: function(inSender, inEvent) {
		this.replaceValue = this.$.replace.getValue();
	},
	setFindInput: function(value){
		this.$.find.setValue(value);
		this.findChanged();
	},
	disableActionButtons: function(value){
		this.$.replaceAll.setDisabled(value);
		this.$.findprevious.setDisabled(value);
		this.$.findnext.setDisabled(value);
		this.disableReplaceButtons(value);
	},
	disableReplaceButtons:function(value){
		this.$.replaceOne.setDisabled(value);
		this.$.replaceFind.setDisabled(value);
	},
	removeMessage: function(){
		this.$.message.setContent("");
	},
	updateMessage: function(inResult, occurences){
		if(!inResult || occurences === 0){
			this.$.message.setContent(ilibPhobos("'{value}' not found", {value: this.findValue}));
		} else if(occurences > 0) {
			this.$.message.setContent(ilibPhobos("{occurences} matches replaced"), {occurences: occurences});
		} else {
			this.removeMessage();
		}
		
	},
	updateAfterFind: function(value){
		this.updateMessage(value);
		this.disableReplaceButtons(value === "");
	},
	shown: function(inSender, inEvent) {
		this.$.find.focus();
	}
});