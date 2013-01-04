enyo.kind(
	{
		name: "ares.IFrame",
		kind: 'Control',

		tag: 'iframe',
		attributes: {
			scrolling: 'no',
			src: "http://www.hp.org" ,
			width: '1400px',
			height: '1600px'
		},

		//style: "border: none;",
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