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
			{kind: "FittableColumns", components: [
				{fit: true, content: "Find:", classes: "phobos-find-label"},
				{kind: "onyx.InputDecorator", components: [
					{name: "find", kind: "onyx.Input", classes: "phobos-find-field", placeholder: "", onchange: "findChanged"}
				]},
			]},
			{tag: "br"},
			{kind: "FittableColumns", components:[
				{fit: true, content: "Replace:", classes: "phobos-find-label"},
				{kind: "onyx.InputDecorator", components: [
					{name: "replace", kind: "onyx.Input", classes: "phobos-find-field", placeholder: "", onchange: "replaceChanged"}
				]},
			]},
			{tag: "br"},
			{kind: "FittableColumns", components: [
				//{name: "replaceOne", kind: "onyx.Button", content: "Replace", ontap: "doReplace"},
				
				{style: "width: 97px"},
				{name: "replaceAll", kind: "onyx.Button", disabled: true, content: "Replace All", ontap: "doReplaceAll"},
				{style: "width: 10px"},
				{name: "replaceFind", kind: "onyx.Button", disabled: true, content: "Replace & Find", ontap: "doReplaceFind"},
				{tag: "br"},
				{tag: "br"},
				{style: "width: 177px"},
				{name: "findprevious", kind: "onyx.Button", content: "Previous", ontap: "doFindPrevious"},
				{style: "width: 10px"},
				{name: "findnext", kind: "onyx.Button", content: "Next", ontap: "doFindNext"},
				{tag: "br"},
				{name: "close", kind: "onyx.Button", content: "Close", ontap: "doClose"},
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
