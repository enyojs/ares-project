/*global enyo, ilibDeimos */
enyo.kind({
	name: "PaletteComponentActionPopup",
	kind: "onyx.Popup",
	published:{
		configComponent:"",
		targetComponent:""
	},
	components:[
		{name:"title", content: ilibDeimos("Select one action")},
		{name:"body", kind: "FittableRows", noStretch: true, components: [
			{name: "vtAction", kind: "ViewTemplateAction", showing:false },
			{name: "close", kind: "onyx.Button", content: ilibDeimos("Cancel"), centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"}	
		]}
	],
	events: {
		onPaletteComponentAction : ""
	},

	setActionShowing: function(actionName){
		for(var n in this.$){
			this.$[n].setShowing(false);
		}
		this.$.title.setShowing(true);
		this.$.body.setShowing(true);
		this.$[actionName].setShowing(true);
		this.$.close.setShowing(true);
	}
});

enyo.kind({
	name: "ViewTemplateAction",
	kind: "FittableRows",
	noStretch:true,
	components: [
		{name: "addtoKind", kind: "onyx.Button",  content: ilibDeimos("Add to current kind"), style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"},
		{name: "replaceKind", kind: "onyx.Button", content: ilibDeimos("Replace current kind"), centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"},
		{name: "addNewKind", kind: "onyx.Button", content: ilibDeimos("Add new kind to current file"), centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"}
	],
	events: {
		onPaletteComponentAction : ""
	}
});
