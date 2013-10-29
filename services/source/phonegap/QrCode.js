/*global qrcode*/
enyo.kind({
	name: "Phonegap.ProjectProperties.QrCode",
	published: {
		appId: null,
		qr_key: null
	},
	classes: "ares-project-properties-qrcode-image",


	/**@private*/
	appIdChanged: function() {
		if(this.appId !== null || this.appId !== undefined) {
			this.hasNode().innerHTML = this.generateQrCode();
		}		
	},

	/**@private*/
	generateQrCode: function()  {
		var qr, svgTags;
		
		// Qr Code size : 3
		// errorCorrectLevel : Low
		qr = qrcode(3, "L");
		
		qr.addData("https://build.phonegap.com/apps/" + this.appId + "/install");
		qr.make();

		// Create the svg path with a cell size of 4.
		qr = qr.createSVGPath(4);
		
		// append the Qr Code data to an SVG image.
		svgTags  = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="200" height="200">/';
		svgTags += '	<path d="'+ qr +'"/>';
		svgTags += '</svg>';
				
		return svgTags;
	}

});