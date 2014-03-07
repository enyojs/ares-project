/* global ares, ilibUtilities */
enyo.kind({
	name: "Ares.ErrorTooltip",
	kind: "onyx.Tooltip",
	allowHtml: true,
	published: {
		errorTooltip: ilibUtilities("unknown error"),
		error: ""
	},
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.setContent("");
	},    
	raise: function(evt) {
		this.error = evt;
		var err;
		if (typeof evt === 'object') {
			if (evt instanceof Error) {	
				err = evt;
				this.errorTooltip = err.toString();
			} else {
				err = evt.err;
				this.errorTooltip = evt.msg || (err && err.toString());				
			}
		} else {
			this.errorTooltip = evt.toString();
		}

		this.setContent(this.errorTooltip);
		this.show();
	},
	reset: function(value) {
		this.setContent(value);
		this.hide();
	}
});	
