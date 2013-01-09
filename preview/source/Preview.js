enyo.kind(
	{
		name: "Preview",
		kind: "FittableColumns",
		classes: "enyo-fit enyo-border-box",
		style: "margin: 4px",

		components: [
			{
				style: "width: 150px; margin: 4px" ,
				components: [
					{content: "Orientation", style: "margin: 8px"},
					{
						kind: "onyx.PickerDecorator",
						onSelect: "resize",
						components:
						[
							{style: "width: 100%"}, // A content-less PickerButton
							{
								kind: "onyx.Picker", name: "orientation",
								components: [
									{content: "portrait", active: true, swap: false},
									{content: "landscape",              swap: true }
								]
							}
						]
					},
					{content: "Device", style: "margin: 8px"},
					{
						kind: "onyx.PickerDecorator",
						onSelect: "resize",
						components:
						[
							{style: "width: 100%"},
							{
								kind: "onyx.Picker", name: "device",
								components: [
									{content: "default",           value: { height:  800, width:  600, ppi: 163 }, active: true},
									{content: "iPhone\u2122",      value: { height:  480, width:  320, ppi: 163 }},
									{content: "iPhone\u2122 4",    value: { height:  940, width:  660, ppi: 326 }},
									{content: "iPhone\u2122 5",    value: { height: 1146, width:  640, ppi: 326 }},
									{content: "iPad\u2122 Retina", value: { height: 2048, width: 1536, ppi: 264 }},
									{content: "iPad\u2122 2",      value: { height: 1280, width:  800, ppi: 132 }},
									{content: "iPad\u2122 mini",   value: { height: 1024, width:  768, ppi: 163 }}
								]
							}
						]
					}
				]
			},
			{
				name: 'iframe',
				fit: true,
				kind: "ares.ScrolledIFrame"
			}
		],

		debug: true ,

		dlog: function() {
			if (this.debug) {
				this.log.apply(this, arguments) ;
			}
		},

		resize: function() {
			var device = this.$.device.selected ;
			var orientation = this .$.orientation.selected ;

			var dw = device.value.width ;
			var dh = device.value.height ;
			this.dlog("size for device " , device.content , " orientation " , orientation.content ) ;
			var swap = orientation.swap ;
			this.$.iframe.setGeometry( swap ? dh : dw, swap ? dw : dh) ;
			this.resized() ;
		},

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

			this.$.iframe.setUrl   (param.url) ;
		}
	}
);

