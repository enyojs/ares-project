enyo.kind({
	name: "FindPopup",
	kind: "Ares.Popup",
	classes:"ares-classic-popup",
	events: {
		onFindNext:"",
		onFindPrevious:"",
		//onReplace:"",
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
		{classes:"title", content: "FIND/REPLACE"},
		{classes:"ace-find-popup", ondragstart:"drop", ondrag:"drop", ondragfinish:"drop", components: [
			{kind: "FittableRows", components: [
				{classes: "ares-row", components: [
					{tag:"label", classes: "ares-fixed-label ace-find-label", content: "Find:"},
					{kind: "onyx.InputDecorator", components: [
						{name: "find", kind: "onyx.Input", onchange: "findChanged"}
					]}
				]},
				{classes: "ares-row", components: [
					{tag:"label", classes: "ares-fixed-label ace-find-label",  content: "Replace:"},
					{kind: "onyx.InputDecorator", components: [
						{name: "replace", kind: "onyx.Input", onchange: "replaceChanged"}
					]}
				]},
				{tag:"p", classes:"break"},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes:"ace-find-left", fit: true, components: [
						{name: "findnext", kind: "onyx.Button", classes:"ace-find-button", content: "Find", ontap: "doFindNext"},
						{name: "findprevious", kind: "onyx.Button", classes:"ace-find-button", content: "Find Prev", ontap: "doFindPrevious"}
					]}
				]},
				{classes: "ares-row", components: [
					{kind: "FittableColumns", classes:"ace-find-left", fit: true, components: [
						{name: "replaceFind", kind: "onyx.Button", classes:"ace-find-button", disabled: true, content: "Replace/Find", ontap: "doReplaceFind"},
						//DO NOT REMOVE replaceOne button, it is not implemented for the moment, why?
						//{name: "replaceOne", kind: "onyx.Button", classes:"ace-find-button", content: "Replace", ontap: "doReplace"},
						//]},
						{name: "replaceAll", kind: "onyx.Button", classes:"ace-find-button", disabled: true, content: "Replace All", ontap: "doReplaceAll"}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},
		]}
	],
	findChanged: function(inSender, inEvent) {
		this.findValue = this.$.find.getValue();
	},
	replaceChanged: function(inSender, inEvent) {
		this.replaceValue = this.$.replace.getValue();
		this.$.replaceFind.setDisabled(false);
		this.$.replaceAll.setDisabled(false);
	},
	shown: function(inSender, inEvent) {
		this.$.find.focus();
	},
	drop: function(inSender, inEvent){
		return true;
	}
});