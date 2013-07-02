enyo.kind(
	{
		name: "ares.IFrame",
		kind: 'Control',

		tag: 'iframe',
		attributes: {
			scrolling: 'no',
			width: '600px', // must match the default value provided in Preview
			height: '800px'
		},

		classes: "ares-preview-device",

		//style: " overflow: hidden;",

		published: {
			url: null
		},

		create: function() {
			this.inherited(arguments);
			this.urlChanged();
		},
		urlChanged: function() {
			if (this.url) {
				this.setAttribute('src', this.url);
			}
		},
		setGeometry: function(width, height) {
			this.setAttribute( 'width',  width) ;
			this.setAttribute( 'height', height) ;
		}
	}
);

enyo.kind(
	{
		name: "ares.ScrolledIFrame",
		kind: "Scroller",

		classes: "enyo-border-box",

		components: [
			{
				kind: "ares.IFrame",
				name: 'iframe'
			}
		],

		reload: function() {
			this.$.iframe.destroy();
			this.createComponent({name: 'iframe', kind: 'ares.IFrame'}) ;
			if (this.width) {
				this.$.iframe.setGeometry( this.width, this.height) ;
			}
			this.setUrl(this.url) ;
			this.render() ;
		},
		setUrl: function(url) {
			this.url = url ;
			this.$.iframe.setUrl(url);
		},
		setGeometry: function(width, height) {
			this.width = width;
			this.height = height ;
			this.$.iframe.setGeometry( width, height) ;
			this.resized() ;
		}

	}
);
