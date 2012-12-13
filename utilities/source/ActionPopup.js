enyo.kind({
        name: "Ares.ActionPopup",
        kind: "onyx.Popup",
        modal: true,
        centered: true,
        floating: true,
        autoDismiss: false,
        classes: "ares-actionpopup",
        published: {
        	name: "",
        	actionButton: ""
        },
    	events: {
    		onConfirmDeleteProject: "",
    		onAbandonDocAction: "",
    	},
        components: [
                {name: "title", classes: "ares-title", content: " "},
                {tag: "br", classes: "ares-message"},
                {name: "buttons", kind: "FittableColumns", components: [
                        {name: "cancelButton", kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "actionCancel"},
						{fit: true},
        	            {name: "actionButton", kind: "onyx.Button", classes: "onyx-affirmative", content: "Delete", ontap: "actionConfirm"}
                ]}

        ],
        create: function() {
                this.inherited(arguments);
        },
    	nameChanged: function(oldVal) {
    		this.$.title.setContent(this.name);
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