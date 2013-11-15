/*global ares, enyo, $L */

// Action popup now accept call back that will be run when user click
// on ok or cancel. Note that events are not fired when callback are
// defined

enyo.kind({
	name: "Ares.ActionPopup",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	classes:"ares-classic-popup",
	published: {
		title: "",
		actionButton: "",
		cancelButton: "",
		actionCallback: null,
		cancelCallback: null,
		message: ""
	},
	events: {
		onConfirmActionPopup: "",
		onCancelActionPopup: ""
	},
	components: [
		{tag: "div", name: "title", classes:"title", content: ""},
		{kind: "enyo.Scroller",  classes:"ares-small-popup", fit: true, components: [
			{classes:"ares-small-popup-details", name:"popupContent", components:[
				{name:"message"}
			]}
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", name: "buttons", components: [
			{name:"cancelButton", kind: "onyx.Button", content: $L("Cancel"), ontap: "actionCancel"},
			{name:"actionButton", classes:"right", kind: "onyx.Button", content: $L("Delete"), ontap: "actionConfirm"}
		]}
	],
	/** @private */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);

		this.titleChanged();
		this.messageChanged();
		this.actionButtonChanged();
		this.cancelButtonChanged();
	},
	/** @private */
	titleChanged: function(oldVal) {
		this.$.title.setContent(this.title);
	},
	/** @private */
	messageChanged:function(oldVal) {
		this.$.message.setContent(this.message);
	},
	/** @private */
	actionButtonChanged: function(oldVal) {
		if (this.actionButton !== "") {
			this.$.actionButton.setContent(this.actionButton);
		}
	},
	/** @private */
	cancelButtonChanged: function(oldVal) {
		if (this.cancelButton !== "") {
			this.$.cancelButton.setContent(this.cancelButton);
		}
	},
	/** @private */
	actionConfirm: function(inSender, inEvent) {
		this.hide();
		if (this.actionCallback) {
			this.actionCallback();
		}
		else {
			this.doConfirmActionPopup();
		}
		return true;
	},
	/** @private */
	actionCancel: function(inSender, inEvent) {
		this.hide();
		if (this.cancelCallback) {
			this.cancelCallback();
		}
		else {
			this.doCancelActionPopup();
		}
		return true;
	}
});
