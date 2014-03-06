/*global AresPBGI18n */

/* ilibPGB covers PhoneGap Build specific translations */
var ilibPGB = AresPBGI18n.resolve.bind(null, AresPBGI18n.setBundle("$assets/harmonia/services/phonegap/resources"));

/**
 * Hold the needed data to create the UI Projet -> Edit. Actually it's used in : 
 * "ProjectProperties.js", "PhonegapUIRows.js" & "Build.js".
 * In this kind, the data are defined in the statics attribute and are structured this way : 
 * * Array of drawers : a drawer contain the following attributs  : 
 * - id : define the name of the drawer's component that will be created
 * - name: define the name of the drawer's label
 * - rows: define the content of the drawer, a drawer contains an array of rows and each row contain the following attributs : 
 * -- name: used to create the UI widget that hold the name of the row, this name is exactely the name of the xml tag of the file 
 *          config.xml that will be generated (except for splashScreen row)
 * -- label : the content of the label of the row
 * -- content: the content of the row, the format of this content can change depending on the type of the UI widget used (picker, input, ...)
 * -- defaultValue: the default value displayed in the widget
 * -- defaultHeight: the default icon/splash screen height
 * -- defaultWidth: the default icon/splash screen Width
 * -- type: contain the last part of the name of the kind that will be used to define a row, these kinds are defined in
 *          the "PhonegapUIRows.js"
 * -- jsonSection: a subsection of "providers.phonegap" in the file "project.json"
 * @type {String}
 */
enyo.kind({
	name: "Phonegap.UIConfiguration",
	statics: {
		androidSdkVersions: {"19": ["Android 4.4"], "18": ["Android 4.3"], "17": ["Android 4.2, 4.2.2"], "16": ["Android 4.1, 4.1.1"], 
		"15": ["Android 4.0.3, 4.0.4"], "14": ["Android 4.0, 4.0.1, 4.0.2"], "13": ["Android 3.2"], 
		"12": ["Android 3.1.x"], "11": ["Android 3.0.x"], "10": ["Android 2.3.4, 2.3.3"], "9": ["Android 2.3.2, 2.3.1, 2.3"],
		"8": ["Android 2.2.x"], "7": ["Android 2.1.x"]},

		commonDrawersContent: [
			{
				id: "buildOption",
				name: ilibPGB("Build Options"),
				type: "Drawer",
				rows: [
					{name: "autoGenerateXML", label: ilibPGB("Generate config.xml file when building"), content: "", defaultValue: "true", type: "BuildOption"},
					{name: "minification", label: ilibPGB("Activate the build minification"), content:"", defaultValue: "true", type: "BuildOption"}
				]
			},
			{
				id: "applicationPermissions",
				name: ilibPGB("Application permissions"),
				type: "PanelInDrawer",
				rows: [
					{name: "battery", label: ilibPGB("Battery"), content: "",defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"},
					{name: "camera", label: ilibPGB("Camera"), content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "contact", label: ilibPGB("Contact"), content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "file", label: ilibPGB("File"), content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "media",	label: ilibPGB("Media"), content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "geolocation", label: ilibPGB("Geolocation"), content: "", defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "network", label: ilibPGB("Network"), content: "",defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"},
					{name: "notification", label: ilibPGB("Notification"), content: "", defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "device", label: ilibPGB("Device"), content: "", defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"}		
				]
			},
			{
				id: "sharedConfiguration",
				name: ilibPGB("Shared configuration"),
				type: "Drawer",
				rows: [
					{
						name: "phonegap-version",
						label:"Phonegap version",
						content:["3.1.0", "3.0.0", "2.9.0", "2.7.0", "2.5.0"],
						defaultValue: "3.1.0", // As recommended by PGB [doc|https://build.phonegap.com/docs/config-xml] see Multi-platform
						type: "PickerRow", 
						jsonSection: "preferences"
					},
					{name: "orientation", label: ilibPGB("Orientation"), content:["both", "landscape", "portrait"], defaultValue: "both", type: "PickerRow", jsonSection: "preferences"},
					{name: "target-device",	label: ilibPGB("Target device"), content: ["universal", "handset", "tablet"], defaultValue: "universal", type: "PickerRow", jsonSection: "preferences"},
					{name: "fullscreen", label: ilibPGB("Fullscreen mode"), content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},					
					{name: "access", label: ilibPGB("Access origin"), content: "", defaultValue: "http://127.0.0.1", type: "AccessRow", jsonSection: "preferences"},
					{name: "icon", label: ilibPGB("Icon"), content: "icon.png", defaultValue: "/icon.png", defaultWidth: "32", defaultHeight: "32", type: "ImgRow", description: "(px)"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", defaultWidth: "60", defaultHeight: "60", type: "ImgRow", description: "(px)"}
				]		
			}
		],

		platformDrawersContent: [
			{
				id: "android",
				name: ilibPGB("Google Android"),
				type: "Target",
				rows: [
					{name: "android-installLocation", label: ilibPGB("Install Location"), content: ["internalOnly", "preferExternal", "auto"], defaultValue: "internalOnly", type: "PickerRow", jsonSection: "preferences"},
					{name: "android-minSdkVersion", label: ilibPGB("Min. API Level/Android Version "), content: [], defaultValue: "7", type: "SDKVersionRow", jsonSection: "preferences"},
					{name: "android-targetSdkVersion", label: ilibPGB("Target API Level/Android Version "), content: [], defaultValue: "None", type: "SDKVersionRow", jsonSection: "preferences", none: ""},
					{name: "android-maxSdkVersion", label: ilibPGB("Max. API Level/Android Version "), content: [], defaultValue: "None", type: "SDKVersionRow", jsonSection: "preferences", none: ""},
					{name: "android-windowSoftInputMode", label: ilibPGB("Window SoftInput Mode "), content: ["stateVisible", "adjustResize"], defaultValue: "stateVisible", type: "PickerRow", jsonSection: "preferences"},
					{name: "splash-screen-duration", label: ilibPGB("Splash screen Duration (ms)"), content: "5000", defaultValue: "5000", type: "NumberInputRow", jsonSection: "preferences", description: "Time in milliseconds"},
					{name: "load-url-timeout", label: ilibPGB("Load URL timeout (ms)"), content: "20000", defaultValue: "20000", type: "NumberInputRow", jsonSection: "preferences", description: "Time in milliseconds"},
					{name: "icon", label: ilibPGB("Icon"), content: "", defaultValue: "/icon.png", type: "AndroidImgRow"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", type: "AndroidImgRow"},
					{name: "signingKey", label: ilibPGB("Signing Key"), content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]				
			}, 
			{
				id: "ios",
				name: ilibPGB("Apple iOS"),
				type: "Target",
				rows: [
					{name: "webviewbounce", label: ilibPGB("Web view bounce"), content:  ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "prerendered-icon", label: ilibPGB("Prerendred icon"), content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "ios-statusbarstyle", label: ilibPGB("Status Bar style"), content: ["black-opaque", "black-translucent", "default"], defaultValue: "black-opaque",  type: "PickerRow", jsonSection: "preferences"},
					{name: "detect-data-types", label: ilibPGB("Detect Data type"), content: ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "exit-on-suspend", label: ilibPGB("Exit on suspend"), content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "show-splash-screen-spinner", label: ilibPGB("Show splash screen spinner"), content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "auto-hide-splash-screen", label: ilibPGB("Auto-hide splash screen"), content: ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "icon", label: ilibPGB("Icon"), content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow", description: "(px)"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow", description: "(px)"},
					{name: "signingKey", label: ilibPGB("Signing Key"), content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]
			},
			{
				id: "winphone",
				name: ilibPGB("Microsoft Windows Phone 7"),
				type: "Target",
				rows: [
					{name: "icon", label: ilibPGB("Icon"), content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow", description: "(px)"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow", description: "(px)"}
				]				
			},  
			{
				id: "blackberry",
				name: ilibPGB("RIM Blackberry"),
				type: "Target",
				rows: [
					{name: "disable-cursor", label: ilibPGB("Disable Cursor"), content:  ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "icon", label: ilibPGB("Icon"), content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow", description: "(px)"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow", description: "(px)"},
					{name: "signingKey", label: ilibPGB("Signing Key"), content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]
			}, 
			{
				id: "webos",
				name: ilibPGB("HP webOS 2"),
				type: "Target",
				rows: [
					{name: "icon", label: ilibPGB("Icon"), content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow", description: "(px)"},
					{name: "splashScreen", label: ilibPGB("Splash screen"), content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow", description: "(px)"}
				]
			}
			
		]
	}
});
