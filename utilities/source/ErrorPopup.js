enyo.kind({
        name: "Ares.ErrorPopup",
        kind: "onyx.Popup",
        modal: true,
        centered: true,
        floating: true,
        published: {
        	errorMsg: "unknown error",
        },
        components: [
                {tag: "h3", content: "Oh, no!?"},
                {name: "msg"},
                {tag: "br"},
                {name: "okButton", kind: "onyx.Button", classes: "onyx-affirmative", content: "Ok", ontap: "hideErrorPopup"}
        ],
        create: function() {
                this.inherited(arguments);
        },
        errorMsgChanged: function (oldVal) {
        	this.$.msg.setContent(this.errorMsg);
        },
        hideErrorPopup: function(inSender, inEvent) {
                this.hide();
        },
        raise: function(msg) { 
			this.setErrorMsg(msg);
			this.show();
		}
});
