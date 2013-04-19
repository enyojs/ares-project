enyo.kind({
        name: "Ares.ErrorPopup",
        kind: "onyx.Popup",
        modal: true,
        centered: true,
        floating: true,
        published: {
		errorMsg: "unknown error",
		details: ""
        },
        components: [
                {tag: "h3", content: "Error"},
                {name: "msg"},
                {tag: "br"},
                {name: "okButton", kind: "onyx.Button", classes: "onyx-affirmative", content: "Ok", ontap: "hideErrorPopup"},
                {name: "detailsBtn", kind: "onyx.Button", content: "Details...", ontap: "toggleDetails", showing: false},
                {tag: "br"},
		{name: "detailsDrw", kind: "onyx.Drawer", open: false, showing:false, components: [
			{name: "detailsTxt", kind: "onyx.TextArea", disabled: true, fit:true, classes:"ajax-sample-source"}
		]}
        ],
        create: function() {
                this.inherited(arguments);
        },
        errorMsgChanged: function (oldVal) {
		this.$.msg.setContent(this.errorMsg);
        },
	detailsChanged: function(oldVal) {
		if (this.details) {
			this.$.detailsBtn.show();
			this.$.detailsDrw.show();
			this.$.detailsDrw.setOpen(false);
			this.$.detailsTxt.setValue(this.details);
		} else {
			this.$.detailsBtn.hide();
			this.$.detailsDrw.hide();
			this.$.detailsTxt.setValue("");
		}
	},
	toggleDetails: function() {
		this.$.detailsDrw.setOpen(!this.$.detailsDrw.open);
	},
        hideErrorPopup: function(inSender, inEvent) {
		this.setErrorMsg();
		this.setDetails();
                this.hide();
        },
        raise: function(msg, details) {
		var evt;
		if (typeof msg === 'object') {
			evt = msg;
			msg = evt.msg || (evt.err && evt.err.toString());
			details = evt.details || (evt.err && evt.err.stack);
		}
		this.setErrorMsg(msg);
		this.setDetails(details);
		this.show();
	}
});
