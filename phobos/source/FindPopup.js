enyo.kind({
	name: "FindPopup",
	kind: "onyx.Popup",
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
		{kind: "FittableRows", classes:"ares_phobos_findpop", components: [
			{kind: "FittableColumns", style: "margin-bottom: 10px", components: [
				{fit: true, content: "Find:", classes: "phobos-find-label"},
				{kind: "onyx.InputDecorator", components: [
					{name: "find", kind: "onyx.Input", classes: "phobos-find-field", placeholder: "", onchange: "findChanged"}
				]}
			]},
			{kind: "FittableColumns", style: "margin-bottom: 10px", components:[
				{fit: true, content: "Replace:", classes: "phobos-find-label"},
				{kind: "onyx.InputDecorator", components: [
					{name: "replace", kind: "onyx.Input", classes: "phobos-find-field", placeholder: "", onchange: "replaceChanged"}
				]}
			]},
			{kind: "FittableColumns", style: "margin-bottom: 10px", components: [
				//{name: "replaceOne", kind: "onyx.Button", content: "Replace", ontap: "doReplace"},

				{fit: true},
				{name: "replaceAll", kind: "onyx.Button", disabled: true, style: "margin-right: 10px",
				 content: "Replace All", ontap: "doReplaceAll"},
				{name: "replaceFind", kind: "onyx.Button", disabled: true, content: "Replace & Find", ontap: "doReplaceFind"}
			]},
			{kind: "FittableColumns", style: "margin-bottom: 10px", components: [
				{fit: true},
				{name: "findprevious", kind: "onyx.Button", content: "Previous", style: "margin-right: 10px", ontap: "doFindPrevious"},
				{name: "findnext", kind: "onyx.Button", content: "Next", ontap: "doFindNext"}
			]},
			{kind: "FittableColumns", components: [
				{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},
				{fit: true}
			]}
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
	}
});
