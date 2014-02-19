/*global ares, enyo, ilibUtilities */

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
		action1Button: "",
		cancelButton: "",
		allowHtmlMsg: false,
		message: ""
	},
	events: {
		onConfirmActionPopup: "",
		onConfirmAction1Popup: "",
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
			{name:"actionButton", kind: "onyx.Button", content: "Action", ontap: "actionConfirm"},
			{name:"action1Button", kind: "onyx.Button", content: "Action1", ontap: "action1Confirm", showing: false},
			{name:"cancelButton", classes:"right", kind: "onyx.Button", content: ilibUtilities("Cancel"), ontap: "actionCancel"}
		]}
	],
	callbacks: {},
	/** @private */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);

		this.titleChanged();
		this.messageChanged();
		this.actionButtonChanged();
		this.action1ButtonChanged();
		this.cancelButtonChanged();
		this.$.message.setAllowHtml(this.allowHtmlMsg);
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
	action1ButtonChanged: function(oldVal) {
		if (this.action1Button !== "") {
			this.$.action1Button.setContent(this.action1Button);
			this.$.action1Button.show();
		} else {
			this.$.action1Button.hide();
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
		this.trace('actionConfirm tapped', inSender, inEvent);
		this.runCallbackOrBubbleUp('action', 'onConfirmActionPopup');
		return true;
	},
	/** @private */
	action1Confirm: function(inSender, inEvent) {
		this.hide();
		this.runCallbackOrBubbleUp('action1', 'onConfirmAction1Popup');
		return true;
	},
	/** @private */
	actionCancel: function(inSender, inEvent) {
		this.hide();
		this.runCallbackOrBubbleUp('cancel', 'onCancelActionPopup');
		return true;
	},
	/** @private */
	runCallbackOrBubbleUp: function(cbName, fallbackEvent) {
		var theCb = this.callbacks[cbName];

		// to be re-entrant, all callbacks must be deleted before
		// calling the the relevant callback (and not
		// after). Otherwise, the code used in callback may reuse and
		// set its own callback before the end fo runCallBack function
		this.callbacks = {};

		if (typeof theCb === 'function') {
			this.trace("Running callback " + cbName);
			theCb();
		} else {
			this.trace("Bubbling fallback event " , fallbackEvent);
			this.bubble(fallbackEvent);
		}
	},
	setActionCallback: function(cb) {
		this.callbacks.action = cb;
	},
	setAction1Callback: function(cb) {
		this.callbacks.action1 = cb;
	},
	setCancelCallback: function(cb) {
		this.callbacks.cancel = cb;
	},
	setCallbacks: function(allCbs) {
		this.callbacks = allCbs;
	}
});
