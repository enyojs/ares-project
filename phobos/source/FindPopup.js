enyo.kind({
	name: "FindPopup",
	kind: "onyx.Popup",
	events: {
		onFindNext:"",
		onFindPrevious:"",
		//onReplace:"",
		onReplaceAll:""
	},
	published: {
		findValue:"",
		replaceValue: ""
	},
	components: [
		{kind: "FittableRows", classes:"ares_phobos_findpop", components: [
			{kind: "ToolDecorator", components: [
				{tag: "b", content: "Find:", classes: "ares-label"},
				{kind: "onyx.InputDecorator", components: [{name: "find", kind: "onyx.Input", placeholder: "Finding?..", onchange: "findChanged"}]},
			]},
			{tag: "p"},
			{kind: "ToolDecorator", components:[
				{content: "Replace:", classes: "ares-label"},
				{kind: "onyx.InputDecorator", components: [{name: "replace", kind: "onyx.Input", placeholder: "Replacing with..", onchange: "replaceChanged"}]},
			]},
			{kind: "FittableColumns", components: [
				//{name: "replaceOne", kind: "onyx.Button", content: "Replace", ontap: "doReplace"},
				{name: "replaceAll", kind: "onyx.Button", content: "Replace All", ontap: "doReplaceAll"},
				{style: "width: 20px"},
				{name: "findprevious", kind: "onyx.Button", content: "Previous", ontap: "doFindPrevious"},
				{name: "findnext", kind: "onyx.Button", content: "Next", ontap: "doFindNext"},
			]}
		]}
	],
	findChanged: function(inSender, inEvent) {
		this.findValue = this.$.find.getValue();
	},
	replaceChanged: function(inSender, inEvent) {
		this.replaceValue = this.$.replace.getValue();
	}
});
