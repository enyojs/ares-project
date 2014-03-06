/*global enyo, ares, ilibAres */

enyo.path.addPaths({
	"assets"	: "$enyo/../assets"
});

enyo.kind(
	{
		name: "PreviewDevicePicker",
		kind: "onyx.Picker",
		components: [
			{content: ilibAres("default"),           value: { height:  800, width:  600, ppi: 163, dpr: 1 }, active: true},
			
			{content: "HP Slate 7",      value: { height:  1024, width:  600, ppi: 170, dpr: 1 }},
			
			{content: "iPhone\u2122",      value: { height:  480, width:  320, ppi: 163, dpr: 1 }},
			{content: "iPhone\u2122 4",    value: { height:  960, width:  640, ppi: 326, dpr: 2 }},
			{content: "iPhone\u2122 5",    value: { height: 1136, width:  640, ppi: 326, dpr: 2 }},

			{content: "iPad\u2122 Retina", value: { width: 2048, height: 1536, ppi: 264, dpr: 2 }},
			{content: "iPad\u2122 2",      value: { width: 1024, height:  768, ppi: 132, dpr: 1 }},
			{content: "iPad\u2122 mini",   value: { width: 1024, height:  768, ppi: 163, dpr: 1 }},
			{content: "HDTV",              value: { height: 1080, width: 1920, ppi: 163, dpr: 1 , landscapeOnly : true}}
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
							{kind: "onyx.GroupboxHeader", content: ilibAres("Project")},
							{name:"projectName"}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibAres("Device")},
							{
								kind: "Ares.PickerDecorator",
								onSelect: "resize",
								components:
								[
									{}, // A content-less PickerButton
									{
										kind: "PreviewDevicePicker",
										name: "device"
									}
								]
							},
							{content: ilibAres("width: 600 px"),  name: "devWidth"},
							{content: ilibAres("height: 800 px"), name: "devHeight"},
							{content: ilibAres("DPR: 1"),        name: "devDPR",
							 attributes: {title: ilibAres("display pixel ratio")} }
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibAres("Screen")},
							{
								kind: "Ares.PickerDecorator",
								onSelect: "resize",
								components:
								[
									{name:"screenPicker"}, // A content-less PickerButton
									{
										kind: "onyx.Picker",
										name: "orientation",
										components: [
											{name: "portrait", content: ilibAres("portrait"), active: true },
											{name: "landscape", content: ilibAres("landscape")              }
										]
									}
								]
							},
							{content: ilibAres("width: 600 px"),  name: "screenWidth",
							 attributes: { title: ilibAres("device width divided by DPR") }
							},
							{content: ilibAres("height: 800 px"), name: "screenHeight",
							 attributes: { title: ilibAres("device height divided by DPR") }
							}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibAres("Zoom")},
							{classes: "zoom-slider", components: [
								{kind: "onyx.RangeSlider", rangeMin: 0, rangeMax: 400, rangeStart: 0, rangeEnd: 100, interval: 1, onChange: 'zoom', onChanging: 'zoom'}
							]},
							{components: [
								{tag: "label", classes: "zoom-label", content: ilibAres("Applied zoom:")},
								{tag: "label", name: "zoomValue", content: "100%"}
							]}
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
						content: ilibAres("Detach test"),
						ontap:"detachIframe",
						classes: "ares-preview-buttons",
						attributes: { title: ilibAres("detach test device, then right click to enable Ripple emulator")}
					}
				]
			},
			{
				name: 'scrolledIframe',
				fit: true,
				kind: "ares.ScrolledIFrame"
			}
		],

		debug: false ,
		iframeUrl: null,

		// retrieve URL from window and setup iframe url
		create: function() {
			ares.setupTraceLogger(this);
			this.inherited(arguments);
			var param = this.getQueryParams(window.location.search) ;
			this.iframeUrl = param.url ;

			this.trace("preview url:", param.url);

			this.$.scrolledIframe.setUrl(param.url) ;
			this.$.projectName.setContent(param.name);

			//display project name in the window title according to the debug/test/minify mode
			var title = document.title.split(" ");
			if (title[title.length - 1] === "(Debug)") {
				document.title = ilibAres("{projectName} - Ares2 Project Preview (Debug)", {projectName: this.$.projectName.getContent()});
			} else if (title[title.length] === "(Test)") {
				document.title = ilibAres("{projectName} - Ares2 Project Preview (Test)", {projectName: this.$.projectName.getContent()});
			} else {
				document.title = ilibAres("{projectName} - Ares2 Project Preview", {projectName: this.$.projectName.getContent()});
			}
		},

		zoom: function(inSender, inEvent) {
			var zoom = Math.round(inEvent.value)+"%";
			this.$.zoomValue.setContent(zoom);
			this.scale = 0.3 + 0.7 * inEvent.value / 100 ;
			this.applyScale() ;
		},

		applyScale: function() {
			enyo.dom.transformValue(
				this.$.scrolledIframe.$.iframe, ilibAres("scale"), this.scale
			) ;
			this.resized() ;
		},

		resize: function() {
			var device = this.$.device.selected ;
			var orientation = this.$.orientation.selected ;

			this.trace("size for device " , device.content , " orientation " , orientation.content ) ;

			var dw  = device.value.width ;
			var dh  = device.value.height ;
			var dpr = device.value.dpr;
			var landscapeOnly = device.value.landscapeOnly; 

			this.$.devWidth .setContent(ilibAres("width: {width} px", {width: dw})) ;
			this.$.devHeight.setContent(ilibAres("height: {height} px", {height: dh})) ;
			this.$.devDPR.setContent(ilibAres("DPR: {dpr}", {dpr: dpr})) ;

			// there's no logical xor in javascript. Emulate one :-/
			var wantWide = orientation.content === 'landscape' || landscapeOnly;
			var isWide   = dw > dh ;
			var swap     = wantWide ^ isWide ; // bitwise xor works fine with boolean

			var targetW  = ( swap ? dh : dw ) / dpr ;
			var targetH  = ( swap ? dw : dh ) / dpr ;

			this.$.scrolledIframe.setGeometry( targetW , targetH) ;
			this.$.screenWidth.setContent(ilibAres("width: {dw} px", {dw: targetW})) ;
			this.$.screenHeight.setContent(ilibAres("height: {height} px", {height: targetH})) ;
			if(landscapeOnly){
				this.$.landscape.setActive(true);
				this.$.screenPicker.setDisabled(true);
			} else {
				this.$.screenPicker.setDisabled(false);
			}
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

