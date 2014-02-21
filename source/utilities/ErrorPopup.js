/*global enyo, ilibUtilities */


/* global ares */
enyo.kind({
	name: "Ares.ErrorPopup",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: true,
	published: {
		title: ilibUtilities("Error"),
		errorMsg: ilibUtilities("unknown error"),
		actionMsg: undefined,
		detailsHtml: "",
		detailsText: "",
		callback: null,
		okButton: ilibUtilities("Close")
	},
	classes: "ares-classic-popup",
	components: [
	    {tag: "div", name: "title", classes: "title"},
		{classes:"ares-error-popup", fit: true, components: [
			{name: "msg", allowHtml:true},
			{name: "action", showing: false},
			{classes: "ares-error-details", components: [
				{classes: "button", components: [
					{tag: "label", classes:" label", name: "detailsBtn", content: ilibUtilities("Details"), ontap: "toggleDetails", showing: false},
					{name: "detailsArrow", classes: "optionDownArrow", ontap: "toggleDetails", showing: false},
					{name: "detailsDrw", kind: "onyx.Drawer", open: false, showing: false, classes: "ares-error-drawer", components: [
						{name: "detailsText", kind: "onyx.TextArea", disabled: true, fit: true, classes: "ares-error-text"},
						{name: "detailsHtml", allowHtml: true, fit: true}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", name: "bottomToolbar",  classes: "bottom-toolbar", components: [
			{name: "okButton", kind: "onyx.Button", ontap: "hideErrorPopup"}
		]}
	],
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.titleChanged();
		this.errorMsgChanged();
		this.detailsHtmlChanged();
		this.detailsTextChanged();
		this.okButtonChanged();
	},
	titleChanged: function (oldVal) {
		this.trace(oldVal, "->", this.title);
		this.$.title.setContent(this.title);
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
	actionMsgChanged: function() {
		if (this.actionMsg) {
			this.$.action.setContent(this.actionMsg);
			this.$.action.setShowing(true);
		} else {
			this.$.action.setShowing(false);
		}
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
	okButtonChanged: function(oldVal) {
		this.trace(oldVal, "->", this.okButton);
		this.$.okButton.setContent(this.okButton);
	},
	toggleDetails: function() {
		this.$.detailsDrw.setOpen(!this.$.detailsDrw.open);
	},
	hideErrorPopup: function() {
		this.reset();
		this.hide();
		if (this.callback) {
			var cb = this.callback;
			this.callback = null;
			try {
				cb();
			} catch(error) {
				var errMsg = "An unexpected exception occured in callback:" + ( typeof error === 'object' ? error.message : error );
				var errStack = typeof error === 'object' ? error.stack : '' ;
				this.error(errMsg, errStack );
				this.raise({msg: errMsg, err: {stack: errStack}});
			}
		}
	},
	raise: function(evt) {
		var msg, err, text, html;

		if (evt.callback) {
			if (this.callback) {
				this.error("Previous callback was not fired ! Bug?");
			}
			this.callback = evt.callback;
			this.setAutoDismiss(false);
		} else {
			this.setAutoDismiss(true);
		}

		if (typeof evt === 'object') {
			if (evt instanceof Error) {
				err = evt;
				msg = err.toString();
			} else {
				err = evt.err;
				msg = evt.msg || (err && err.toString());

				if(evt.title !== undefined) {
					this.$.title.setContent(evt.title);
				}
			}
		} else {
			msg = evt.toString();
		}
		text = err && (err.text || err.stack);
		html = err && err.html;
		text = !html && text;
		this.setErrorMsg(msg);
		this.setDetailsHtml(html);
		this.setDetailsText(text);
		this.setActionMsg(evt.action);
		this.show();
	},
	reset: function() {
		this.set("title", ilibUtilities("error"));
		this.set("errorMsg", ilibUtilities("unknown error"));
		this.set("actionMsg", undefined);
		this.set("detailsHtml", "");
		this.set("detailsTxt", "");
		this.set("okButton", ilibUtilities("Close"));
	}
});
