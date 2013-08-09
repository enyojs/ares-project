/* global ares */
enyo.kind({
	name: "Ares.ErrorPopup",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	published: {
		errorMsg: "unknown error",
		detailsHtml: "",
		detailsText: ""
	},
	classes:"ares-classic-popup",
	components: [
	    {tag: "div", classes:"title", content: "Error"},
			{classes:"ares-error-popup", fit: true, components: [
				{name: "msg"},
				{classes:"ares-error-details", components:[
					{classes:"button", components:[
						{tag:"label", classes:"label", name: "detailsBtn", content: "Details", ontap: "toggleDetails", showing: false},
						{name:"detailsArrow", classes:"optionDownArrow", ontap: "toggleDetails", showing: false},
						{name: "detailsDrw", kind: "onyx.Drawer", open: false, showing:false, classes:"ares-error-drawer", components: [
							{name: "detailsText", kind: "onyx.TextArea", disabled: true, fit:true, classes:"ares-error-text"},
							{name: "detailsHtml", allowHtml: true, fit:true}
						]}
					]}
				]}
			]},
			{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
				{name: "okButton", kind: "onyx.Button", content: "Close", ontap: "hideErrorPopup"}
			]}
	],
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	},
	errorMsgChanged: function (oldVal) {
		this.trace(oldVal, "->", this.errorMsg);
		this.$.msg.setContent(this.errorMsg);
	},
	detailsTextChanged: function() {
		this.updateDetailsDrw();
	},
	detailsHtmlChanged: function() {
		this.updateDetailsDrw();
	},
	updateDetailsDrw: function() {
		if (this.detailsText || this.detailsHtml) {
			this.$.detailsBtn.show();
			this.$.detailsArrow.show();
			this.$.detailsDrw.show();
			this.$.detailsDrw.setOpen(true);
			if (this.detailsHtml) {
				this.$.detailsHtml.setContent(this.detailsHtml);
				this.$.detailsHtml.show();
				this.$.detailsText.hide();
			} else {
				this.$.detailsText.setValue(this.detailsText);
				this.$.detailsText.show();
				this.$.detailsHtml.hide();
			}
		} else {
			this.$.detailsBtn.hide();
			this.$.detailsArrow.hide();
			this.$.detailsDrw.hide();
			this.$.detailsText.setValue("");
			this.$.detailsHtml.setContent("");
		}
	},
	toggleDetails: function() {
		this.$.detailsDrw.setOpen(!this.$.detailsDrw.open);
	},
	hideErrorPopup: function() {
		this.setErrorMsg();
		this.setDetailsText();
		this.setDetailsHtml();
		this.hide();
	},
	raise: function(evt) {
		var msg, err, text, html;
		if (typeof evt === 'object') {
			if (evt instanceof Error) {
				err = evt;
				msg = err.toString();
			} else {
				err = evt.err;
				msg = evt.msg || (err && err.toString());
			}
		}
		text = err && (err.text || err.stack);
		html = err && err.html;
		text = !html && text;
		this.setErrorMsg(msg);
		this.setDetailsHtml(html);
		this.setDetailsText(text);
		this.show();
	}
});
