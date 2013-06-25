enyo.kind({
        name: "Ares.ActionPopup",
        kind: "onyx.Popup",
        modal: true,
        centered: true,
        floating: true,
        autoDismiss: false,
        classes:"ares-classic-popup",
        published: {
            name: "",
            actionButton: "",
            message: ""
        },
        events: {
            onConfirmDeleteProject: "",
            onAbandonDocAction: ""
        },
        components: [
            {tag: "div", name: "title", classes:"title", content: " "},
            {kind: "enyo.Scroller",  classes:"ares-small-popup", fit: true, components: [
                {classes:"ares-small-popup-details", name:"popupContent", components:[
                    {name:"message"}
                ]}
            ]},
            {kind: "onyx.Toolbar", classes:"bottom-toolbar", name: "buttons", components: [
                {name:"cancelButton", kind: "onyx.Button", content: "Cancel", ontap: "actionCancel"},
                {name:"actionButton", classes:"right", kind: "onyx.Button", content: "Delete", ontap: "actionConfirm"}
            ]}

        ],
        create: function() {
                this.inherited(arguments);
        },
        nameChanged: function(oldVal) {
            this.$.title.setContent(this.name);
        },
        messageChanged:function(oldVal) {
            this.$.message.setContent(this.message);
        },
        actionButtonChanged: function(oldVal) {
            this.$.actionButton.setContent(this.actionButton);
        },
        actionCancel: function(inSender, inEvent) {
            this.hide();
        },
        actionConfirm: function(inSender, inEvent) {
            this.hide();
            this.doConfirmDeleteProject();
            this.doAbandonDocAction();
        }
});
