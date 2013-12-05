/*global ares, qrcode, Phonegap*/
enyo.kind({
	name: "Phonegap.ProjectProperties.QrCode",
	published: {
		appId: undefined,
		token: undefined
	},
	classes: "ares-project-properties-qrcode-image",
	debug: false,
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.setToken(Phonegap.ProjectProperties.getProvider().config.auth.token);
	},

	/**@private*/
	appIdChanged: function() {
		this.displayQrCode();	
	},	

	/**@private*/
	tokenChanged: function() {	
		this.displayQrCode();	
	},

	/**@private*/
	displayQrCode: function() {
		
		if (this.appId !== undefined && this.token !== undefined) {
			this.trace("appid: ", this.appId, " token: ", this.token);
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
		svgTags  = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="132" height="132">/';
		svgTags += '	<path d="'+ qrPath +'"/>';
		svgTags += '</svg>';
				
		return svgTags;
	}

});