/*global ares, enyo */
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
            {name:"cancelButton", classes:"right", kind: "onyx.Button", content: $L("Cancel"), ontap: "actionCancel"}
        ]}
    ],
    /** @private */
    create: function() {
        ares.setupTraceLogger(this);
        this.inherited(arguments);

        this.titleChanged();
        this.messageChanged();
        this.actionButtonChanged();
	this.action1ButtonChanged();
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
        this.doConfirmActionPopup();
        return true;
    },
    /** @private */
    action1Confirm: function(inSender, inEvent) {
        this.hide();
        this.doConfirmAction1Popup();
        return true;
    },
    /** @private */
    actionCancel: function(inSender, inEvent) {
        this.hide();
        this.doCancelActionPopup();
        return true;
    }
});
