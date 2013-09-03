enyo.kind(
	{
		name: "PreviewDevicePicker",
		kind: "onyx.Picker",
		components: [
			{content: "default",           value: { height:  800, width:  600, ppi: 163, dpr: 1 }, active: true},
			{content: "iPhone\u2122",      value: { height:  480, width:  320, ppi: 163, dpr: 1 }},
			{content: "iPhone\u2122 4",    value: { height:  960, width:  640, ppi: 326, dpr: 2 }},
			{content: "iPhone\u2122 5",    value: { height: 1136, width:  640, ppi: 326, dpr: 2 }},

			{content: "iPad\u2122 Retina", value: { width: 2048, height: 1536, ppi: 264, dpr: 2 }},
			{content: "iPad\u2122 2",      value: { width: 1024, height:  768, ppi: 132, dpr: 1 }},
			{content: "iPad\u2122 mini",   value: { width: 1024, height:  768, ppi: 163, dpr: 1 }}
		]
	}
);

enyo.kind(
	{
		name: "Preview",
		kind: "FittableColumns",
		classes: "enyo-fit enyo-border-box ares-preview-body",
		components: [
			{
				classes: "ares-preview-tools-panel",
				components: [
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: "Project"},
							{name:"projectName"}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: "Device"},
							{
								kind: "onyx.PickerDecorator",
								onSelect: "resize",
								components:
								[
									{}, // A content-less PickerButton
									{
										kind: "PreviewDevicePicker", name: "device"
									}
								]
							},
							{content: "width: 600 px",  name: "devWidth"},
							{content: "height: 800 px", name: "devHeight"},
							{content: "DPR: 1",        name: "devDPR",
							 attributes: {title: "display pixel ratio"} }
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: "Screen"},
							{
								kind: "onyx.PickerDecorator",
								onSelect: "resize",
								components:
								[
									{}, // A content-less PickerButton
									{
										kind: "onyx.Picker", name: "orientation",
										components: [
											{content: "portrait", active: true },
											{content: "landscape"              }
										]
									}
								]
							},
							{content: "width: 600 px",  name: "screenWidth",
							 attributes: { title: "device width divided by DPR" }
							},
							{content: "height: 800 px", name: "screenHeight",
							 attributes: { title: "device height divided by DPR" }
							}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: "Zoom"},
							{
								components: [
									{kind: "onyx.Slider", value: 100, onChange: 'zoom', onChanging: 'zoom' }
								]
							}
						]
					},
					{
						kind: "onyx.Button",
						ontap:"reload",
						classes: "ares-preview-buttons",
						components: [
							{tag: 'img', attributes: { src: "assets/images/preview_reload.png"} }
						]
					},
					{
						kind:"onyx.Button",
						content: "Detach test",
						ontap:"detachIframe",
						classes: "ares-preview-buttons",
						attributes: { title: "detach test device, then right click to enable Ripple emulator"}
					}
				]
			},
			{
				name: 'scrolledIframe',
				fit: true,
				kind: "ares.ScrolledIFrame"
			}
		],

		debug: true ,
		iframeUrl: null,

		dlog: function() {
			if (this.debug) {
				this.log.apply(this, arguments) ;
			}
		},

		zoom: function(inSender, inEvent) {

			this.scale = 0.3 + 0.7 * inSender.getValue() / 100 ;
			this.applyScale() ;
		},
		applyScale: function() {
			enyo.dom.transformValue(
				this.$.scrolledIframe.$.iframe, "scale", this.scale
			) ;
			this.resized() ;
		},

		resize: function() {
			var device = this.$.device.selected ;
			var orientation = this .$.orientation.selected ;

			this.dlog("size for device " , device.content , " orientation " , orientation.content ) ;

			var dw  = device.value.width ;
			var dh  = device.value.height ;
			var dpr = device.value.dpr ;
			this.$.devWidth .setContent("width: "  + dw + ' px') ;
			this.$.devHeight.setContent("height: " + dh + ' px') ;
			this.$.devDPR   .setContent("DPR: "    + dpr) ;

			// there's no logical xor in javascript. Emulate one :-/
			var wantWide = orientation.content === 'landscape' ;
			var isWide   = dw > dh ;
			var swap     = wantWide ^ isWide ; // bitwise xor works fine with boolean

			var targetW  = ( swap ? dh : dw ) / dpr ;
			var targetH  = ( swap ? dw : dh ) / dpr ;

			this.$.scrolledIframe.setGeometry( targetW , targetH) ;
			this.$.screenWidth .setContent("width: "  + targetW + 'px') ;
			this.$.screenHeight.setContent("height: " + targetH + 'px') ;
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

		// retrieve URL from window and setup iframe url
		create: function() {
			this.inherited(arguments);

			var param = this.getQueryParams(window.location.search) ;
			this.log("preview url " + param.url) ;
			this.iframeUrl = param.url ;

			this.$.scrolledIframe.setUrl   (param.url) ;
			this.$.projectName.setContent(param.name);
		},

		reload: function() {
			this.$.scrolledIframe.reload();
			this.applyScale() ;
		},

		detachIframe: function() {
			window.open(
				this.iframeUrl ,
				'_blank', // ensure that a new window is created each time preview is tapped
				'scrollbars=1,menubar=1,resizable=1',
				false
			);
			window.close();
		}
	}
);

