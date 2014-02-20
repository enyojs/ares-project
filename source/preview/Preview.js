/*global enyo, ares, ilib */

enyo.path.addPaths({
	"assets"	: "$enyo/../assets"
});

var ilibPreview = function(msg, params) {
	var resolveString = function(string) {
		var str;
		if (!ilibPreview.rb) {
			ilibPreview.setLocale();
		}
		if (typeof(string) === 'string') {
			if (!ilibPreview.rb) {
				return string;
			}
			str = ilibPreview.rb.getString(string);
		} else if (typeof(string) === 'object') {
			if (typeof(string.key) !== 'undefined' && typeof(string.value) !== 'undefined') {
				if (!ilibPreview.rb) {
					return string.value;
				}
				str = ilibPreview.rb.getString(string.value, string.key);
			} else {
				str = "";
			}
		} else {
			str = string;
		}
		return str.toString();
	};

	var stringResolved = resolveString(msg);
	if (params) {
		var template = new ilib.String(stringResolved);
		return template.format(params);
	} 

	return stringResolved;
};

ilibPreview.setLocale = function (spec) {
	var locale = new ilib.Locale(spec);
	if (!ilibPreview.rb || spec !== ilibPreview.rb.getLocale().getSpec()) {
		ilibPreview.rb = new ilib.ResBundle({
			locale: locale,
			type: "html",
			name: "strings",
			sync: true,
			lengthen: true,		// if pseudo-localizing, this tells it to lengthen strings
			loadParams: {
				root: "$assets/preview/resources"
			}
		});
	}
};

ilibPreview.setLocale(navigator.language);

enyo.kind(
	{
		name: "PreviewDevicePicker",
		kind: "onyx.Picker",
		components: [
			{content: ilibPreview("default"),           value: { height:  800, width:  600, ppi: 163, dpr: 1 }, active: true},
			
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
							{kind: "onyx.GroupboxHeader", content: ilibPreview("Project")},
							{name:"projectName"}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibPreview("Device")},
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
							{content: ilibPreview("width: 600 px"),  name: "devWidth"},
							{content: ilibPreview("height: 800 px"), name: "devHeight"},
							{content: ilibPreview("DPR: 1"),        name: "devDPR",
							 attributes: {title: ilibPreview("display pixel ratio")} }
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibPreview("Screen")},
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
											{name: "portrait", content: ilibPreview("portrait"), active: true },
											{name: "landscape", content: ilibPreview("landscape")              }
										]
									}
								]
							},
							{content: ilibPreview("width: 600 px"),  name: "screenWidth",
							 attributes: { title: ilibPreview("device width divided by DPR") }
							},
							{content: ilibPreview("height: 800 px"), name: "screenHeight",
							 attributes: { title: ilibPreview("device height divided by DPR") }
							}
						]
					},
					{
						kind: 'onyx.Groupbox',
						classes : "ares-preview-groupbox",
						components: [
							{kind: "onyx.GroupboxHeader", content: ilibPreview("Zoom")},
							{classes: "zoom-slider", components: [
								{kind: "onyx.RangeSlider", rangeMin: 0, rangeMax: 400, rangeStart: 0, rangeEnd: 100, interval: 1, onChange: 'zoom', onChanging: 'zoom'}
							]},
							{components: [
								{tag: "label", classes: "zoom-label", content: ilibPreview("Applied zoom:")},
								{tag: "label", name: "zoomValue", content: "100%"}
							]}
						]
					},
					{
						kind: "onyx.Button",
						ontap:"reload",
						classes: "ares-preview-buttons",
						components: [
							{tag: 'img', attributes: { src: "assets/preview/images/preview_reload.png"} }
						]
					},
					{
						kind:"onyx.Button",
						content: ilibPreview("Detach test"),
						ontap:"detachIframe",
						classes: "ares-preview-buttons",
						attributes: { title: ilibPreview("detach test device, then right click to enable Ripple emulator")}
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

			//display project name in the window title
			document.title = ilibPreview("{projectName} - Ares project preview", {projectName: this.$.projectName.getContent()});
		},

		zoom: function(inSender, inEvent) {
			var zoom = Math.round(inEvent.value)+"%";
			this.$.zoomValue.setContent(zoom);
			this.scale = 0.3 + 0.7 * inEvent.value / 100 ;
			this.applyScale() ;
		},

		applyScale: function() {
			enyo.dom.transformValue(
				this.$.scrolledIframe.$.iframe, ilibPreview("scale"), this.scale
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

			this.$.devWidth .setContent(ilibPreview("width: {width} px", {width: dw})) ;
			this.$.devHeight.setContent(ilibPreview("height: {height} px", {height: dh})) ;
			this.$.devDPR.setContent(ilibPreview("DPR: {dpr}", {dpr: dpr})) ;

			// there's no logical xor in javascript. Emulate one :-/
			var wantWide = orientation.content === 'landscape' || landscapeOnly;
			var isWide   = dw > dh ;
			var swap     = wantWide ^ isWide ; // bitwise xor works fine with boolean

			var targetW  = ( swap ? dh : dw ) / dpr ;
			var targetH  = ( swap ? dw : dh ) / dpr ;

			this.$.scrolledIframe.setGeometry( targetW , targetH) ;
			this.$.screenWidth.setContent(ilibPreview("width: {dw} px", {dw: targetW})) ;
			this.$.screenHeight.setContent(ilibPreview("height: {height} px", {height: targetH})) ;
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

