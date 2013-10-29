/*global qrcode, Phonegap*/
enyo.kind({
	name: "Phonegap.ProjectProperties.QrCode",
	published: {
		appId: null,
		token: null
	},
	classes: "ares-project-properties-qrcode-image",

	create: function () {
		this.inherited(arguments);
		this.setToken(Phonegap.ProjectProperties.getProvider().config.auth.token);

	},

	/**@private*/
	appIdChanged: function() {
		if(this.appId !== null || this.appId !== undefined) {
			this.hasNode().innerHTML = this.generateQrCode();
		}		
	},

	/**@private*/
	generateQrCode: function()  {
		var qr, svgTags, qrPath;
		
		// Qr Code size : 4
		// errorCorrectLevel : Low
		qr = qrcode(4, "L");
		qr.addData("https://build.phonegap.com/apps/" + this.appId + "/install?auth_token=" + this.token);
		qr.make();

		// Create the svg path with a cell size of 4.
		qrPath = qr.createSVGPath(4);
		
		// append the Qr Code data to an SVG image.
		svgTags  = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="200" height="200">/';
		svgTags += '	<path d="'+ qrPath +'"/>';
		svgTags += '</svg>';
				
		return svgTags;
	}

});