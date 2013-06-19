/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.BuildStatusUI
 */
enyo.kind({
	name: "Phonegap.BuildStatusUI",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	debug: false,
	classes: "ares-BuildStatusUI",
	published: {
		pgUrl: ""
	},
	handlers: {
		onDismissPopup: "_hidePopup"
	},
	components: [
		// Header displaying :
		// * The application name
		// * Phonegap version used for the build
		// * The owner of the application
		{
			kind: "onyx.Toolbar",
			components: [{
					kind: "FittableRows",
					name: "HeaderRows"
				}
			]
		},
		//this component contains the status information 
		//for each target platform supported by Phonegap.
		{
			kind: "FittableRows",
			name: "AllStatus",
			style: "padding-left: 60px;"
		},

		//Footer containing the "Ok" button to dismiss the Pop-up
		{
			kind: "BuildStatusBotomToolBar",
			name: "BottomTB"
		}
	],

	/**
	 * Hide the Pop-up when the ok button is clicked.
	 * @private
	 */
	_hidePopup: function () {
		this.hide();
		return true; //stop the bubbling
	},

	/**
	 * Setup the content of the pop-up and display it.
	 *
	 * @param  {Object} project   contain a description of the current selected
	 *                          project
	 * @param  {Object} inAppData contains detailed informations relative to the built
	 *                           application on Phonegap
	 * @public
	 */
	showPopup: function (project, inAppData) {

		//Setting to pop-up content.
		this._setUpHeader(inAppData);
		this._setUpRows(inAppData);

		//Display the pop-up.
		this.show();

		// Setting the target URL of the webview opened when 
		// an instance of "DataRow" is clicked.
		this.pgUrl = "https://build.phonegap.com/apps/" + inAppData.id + "/builds";
		if (this.debug) {
			this.log("The url to Phonegap build web page: ", this.pgUrl);
		}
	},

	/**
	 * Create the status rows.
	 *
	 * @param  {Object} inAppData contains detailed informations relative to the built
	 *                           application on Phonegap
	 * @private
	 */
	_setUpRows: function (inAppData) {
		//Creating the array containing the status's data.
		var platforms = enyo.keys(inAppData && inAppData.status);
		if (this.debug) {
			this.log("Application Data: ", inAppData);
			this.log("platforms list: ", platforms);
		}

		// Instanciate the status rows.
		enyo.forEach(platforms, function (platform) {
			this.$.AllStatus.createComponent({
				kind: "DataRow",
				name: platform,
				label: platform,
				value: inAppData && inAppData.status[platform] || "error",
				url: this.pgUrl
			});
		}, this);
	},

	/**
	 * Create the header's rows of the Pop-up.
	 *
	 * @param  {Object} inAppData contains detailed informations relative to the built
	 *                           application on Phonegap
	 * @private
	 */
	_setUpHeader: function (inAppData) {

		var inUrl = this.pgUrl;

		//Creating the array containing the header's data.
		var headerData = [
			["Application", inAppData && inAppData.package],
			["Phonegap version", inAppData && inAppData.phonegap_version],
			["Owner", inAppData &&
					inAppData.collaborators &&
					inAppData.collaborators.active[0] &&
					inAppData.collaborators.active[0].person
			]
		];

		// Instanciate the header's rows.
		enyo.forEach(headerData, function (row) {
			this.$.HeaderRows.createComponent({
				kind: "DataRow",
				label: row[0],
				value: row[1],
				url: inUrl
			});
		}, this);
	}
});

/**
 * A DataRow is a UI component of the BuildStatusUI containing two labels:
 * - The first label is the title of the row
 * - The second label is the content displayed for an appData sent by Phonegap
 */
enyo.kind({
	name: "DataRow",
	kind: "FittableColumns",
	classes: "ares-BuildStatusUI-row",
	published: {
		url: "",
		label: "",
		value: ""
	},
	handlers: {
		ontap: "manageApps"
	},
	components: [{
			name: "Label",
			classes: "ares-BuildStatusUI-row-label"
		},

		{
			name: "Value",
			classes: "ares-BuildStatusUI-row-label"
		}, {
			tag: "br"
		}
	],
	debug: false,

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	labelChanged: function () {
		this.$.Label.setContent(this.label);
		if (this.debug) {
			this.log("Label is: ", this.label);
		}
	},

	valueChanged: function () {
		this.$.Value.setContent(this.value);
		if (this.debug) {
			this.log("Value is:", this.value);
		}
	},

	manageApps: function (inSender, inValue) {
		if (this.debug) {
			this.log("the url of the phonegap build web page: ", this.url);
		}
		window.open(this.url, "PhoneGap Build Account Management",
			"resizeable=1,width=1024, height=600", 'self');
	}
});

enyo.kind({
	name: "BuildStatusBotomToolBar",
	classes: "ares-bordered-toolbar",
	kind: "onyx.Toolbar",
	components: [{
			name: "ok",
			kind: "onyx.Button",
			content: "OK",
			handlers: {
				ontap: 'tapped'
			},
			tapped: function () {
				this.bubble("onDismissPopup");
			}
		}
	]
});