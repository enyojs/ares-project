enyo.kind(
	{
		name: "ares.Preview",
		kind: "Scroller",
		fit: true,
		layoutKind: "FittableColumnsLayout",

		// FIXME: remove the red border line used for debug
		style: "border: solid 1px blue; " ,

		getQueryParams: function(qs) {
			qs = qs.split("+").join(" ");

			var params = {}, tokens, re = /[?&]?([^=&]+)=?([^&]*)/g;

			while ((tokens = re.exec(qs))) {
				params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
			}

			return params;
		},

		// retrieve URL from windown and setup iframe url
		create: function() {
			this.inherited(arguments);

			var param = this.getQueryParams(window.location.search) ;
			this.log("preview url " + param.url
					 + " w " + param.width + " h " + param.height) ;

			this.createComponent(
				{
					kind:"ares.IFrame",
					name: 'iframe'
				}
			) ;

			this.$.iframe.setUrl   (param.url) ;

			this.$.iframe.setAttribute( 'width',  param.width) ;
			this.$.iframe.setAttribute( 'height', param.height) ;

			this.render() ;
		}

	}
);

