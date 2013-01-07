enyo.kind(
	{
		name: "ares.IFrame",
		kind: 'Control',

		tag: 'iframe',
		attributes: {
			scrolling: 'no'
		},

		// FIXME: remove the red border line used for debug
		style: "border: solid 1px red; position: absolute; overflow: hidden;",

		published: {
			url: null
		},

		create: function() {
			this.inherited(arguments);
			this.urlChanged();
		},
		urlChanged: function() {
			if(this.url) this.setAttribute('src', this.url);
		}
	}
);