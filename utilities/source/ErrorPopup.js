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
        classes:"ares-classic-popup",
        components: [
            {tag: "div", classes:"title", content: "Error"},
			{kind: "enyo.Scroller", classes:"ares-small-popup", fit: true, components: [
				{name: "msg"},
				{classes:"ares-small-popup-details", components:[
					{classes:"button", components:[
						{tag:"label", classes:"label", name: "detailsBtn", content: "Details", ontap: "toggleDetails", showing: false},
						{name:"detailsArrow", classes:"optionDownArrow", ontap: "toggleDetails", showing: false},
						{name: "detailsDrw", kind: "onyx.Drawer", open: false, showing:false, classes:"ares-error-drawer", components: [
							{name: "detailsTxt", kind: "onyx.TextArea", disabled: true, fit:true, classes:"ares-error-text"}
						]}
					]}
				]}
			]},
			{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
				{name: "okButton", kind: "onyx.Button", content: "Close", ontap: "hideErrorPopup"}
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
			this.$.detailsArrow.show();
			this.$.detailsDrw.show();
			this.$.detailsDrw.setOpen(false);
			this.$.detailsTxt.setValue(this.details);
		} else {
			this.$.detailsBtn.hide();
			this.$.detailsArrow.hide();
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
