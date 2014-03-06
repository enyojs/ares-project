/*global ares, Phonegap, enyo, ilibPGB */

/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.BuildStatusUI
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.PlatformBuildStatus",
	kind: "onyx.IconButton",
	ontap: "showStatusMessage",
	published: {
		platform: null,
		status: null
	},

	/**
	 * Update the image for the platform IconButton depending on the status of the related platform
	 * described in buildStatusData.
	 *
	 * @private
	 */
	statusChanged: function() {

		if (this.status === "complete") {

			this.setSrc("$assets/harmonia/services/images/platforms/" + this.platform + "-logo-complete-32x32.png");
			return;
		}

		if (this.status === "error") {
			this.show();
			this.setSrc("$assets/harmonia/services/images/platforms/" + this.platform + "-logo-error-32x32.png");
			return;
		}

		this.setSrc("$assets/harmonia/services/images/platforms/" + this.platform + "-logo-not-available-32x32.png");

	}
});

/**
 * The widget "Build status", show the building state of the application
 * for each platform.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.BuildStatus",
	kind: "FittableRows",
	buildStatusData: {},
	published: {
		appId: "",
		phongapUrl: "https://build.phonegap.com",
		provider: {},
		selectedPlatform: null
	},
	events: {
		onError: ""
	},
	handlers: {
		onUpdateStatusMessage: "updateDownloadMessageContent"
	},
	components: [{
		name: "buildStatusContainer",
		kind: "FittableRows",
		classes: "ares-project-properties-build-status-container",
		components: [{
			name: "platformIconContainer",
			classes: "ares-project-properties-platform-icon-container",
			kind: "FittableColumns",
		},

		{
			name: "downloadStatus",
			kind: "Phonegap.ProjectProperties.DownloadStatus"
		},
		{
			name: "messageContainer",
			classes: "ares-project-properties-status-message-container",
			showing: false,
			components: [{
				name: "hideStatusContainer",
				kind: "onyx.IconButton",
				src: "$assets/project-view/images/close-button-16x16.png",
				classes: "ares-project-properties-hide-status-button",
				ontap: "hideMessageContainer"
			},
			{
				name: "statusMessage",
				classes: "ares-project-properties-status-message"
			}]
		},
		{
			kind: "FittableColumns",
			style: "height: 32px; position: relative; top:-6em;",
			components: [{
				name: "separatorForDownloadButton"
			},
			{
				name: "downloadButton",
				kind: "onyx.IconButton",
				src: "$assets/harmonia/services/images/download-icon.png",
				showing: false,
				ontap: "downloadPackage"
			}]
		}

		]
	}],
	/**@private*/
	create: function() {

		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.createIconButtons();
		this.appIdChanged();
		this.setProvider(Phonegap.ProjectProperties.getProvider());
	},

	/**
	 * Create the IconButtons displaying the build state of the application
	 * for all platforms defined in the object {Phonegap.ProjectProperties.downloadStatus}
	 *
	 * @private
	 */
	createIconButtons: function() {

		for (var i = 0, length = Phonegap.UIConfiguration.platformDrawersContent.length; i < length; i++) {
			var p = Phonegap.UIConfiguration.platformDrawersContent[i].id;
			this.$.platformIconContainer.createComponent({
				name: p + "Decorator",
				classes: "ares-project-properties-build-status-icon",
				components: [{
					name: p + "Button",
					kind: "Phonegap.ProjectProperties.PlatformBuildStatus",
					platform: p
				}]
			},
			{
				owner: this
			});
		}
	},

	/**
	 * Charge the icon showing the build status of the application of a a given platform depending on
	 * its status. the status is checked from the "buildStatusData" object.
	 * By clicking on the icon, the status message is displayed.
	 *
	 * @private
	 */
	updateBuildStatusData: function(inBuildStatus) {
		this.buildStatusData = inBuildStatus;
		var pendingApplication = false;

		//Check if there is a pending build.
		for (var key1 in this.buildStatusData && this.buildStatusData.status) {
			if (this.buildStatusData.status[key1] === "pending") {
				pendingApplication = true;
			}
		}

		//If there is a pending build, another buildStatus Request is sent after 600 ms timeout.
		if (pendingApplication) {
			enyo.job("updateBuildStatus", function() {
				this.sendBuildStatusRequest();
			}.bind(this), 3000);
		}

		// Get only the Enyo control that have the "platform" attribute
		// => {Phonegap.ProjectProperties.PlatformBuildStatus} instance
		for (var key2 in this.$) {

			var platform = this.$[key2].platform;
			var status = this.buildStatusData && this.buildStatusData.status[platform];

			if (platform !== undefined) {
				this.$[key2].setStatus(status || "notAvailable");
			}
		}

		//Update to Status container if a platform is selected.
		if (this.selectedPlatform !== null) {
			this.showStatusMessage({
				platform: this.selectedPlatform
			});
		}
	},

	/**
	 * Use the phonegap service to request a {buildStatus} object from Phonegap build
	 * @private
	 */
	sendBuildStatusRequest: function() {

		if (this.appId === "" || this.appId === undefined) {
			this.updateBuildStatusData(null);
		} else {
			this.provider.getAppData(this.appId, enyo.bind(this, this.getBuildStatusData));
		}
	},

	/**
	 * Update the content of the statusMessage row.
	 * @protected
	 */
	updateDownloadMessageContent: function() {

		this.$.statusMessage.setContent(this.$.downloadStatus.getDownloadStatus(this.selectedPlatform));
		this.$.statusMessage.show();
		this.updateDownloadMessageDisplay(this.selectedPlatform);

		//stop the propagation of the bubble event
		return true;
	},

	/**
	 * Highlight the selected platform button by appling a css style on its decorator.
	 * @param {enyo.component} inIconButtonDecorator decorator of the button
	 * @private
	 */
	addHightlightIconButton: function(inIconButtonDecorator) {
		this.removeHightlightIconButton();
		inIconButtonDecorator.addClass("ares-project-properties-buildStatus-icon-highlight");

	},

	/**
	 * Remove the highlignt effect from all platform buttons.
	 * @private
	 */
	removeHightlightIconButton: function() {
		for (var i = 0, length = Phonegap.UIConfiguration.platformDrawersContent.length; i < length; i++) {
			var platform = Phonegap.UIConfiguration.platformDrawersContent[i].id;
			this.$[platform + "Decorator"].removeClass("ares-project-properties-buildStatus-icon-highlight");
		}
	},

	/**
	 *
	 * @param  {String} inPlatform Mobile platform supported by Phonegap.
	 * @private
	 */
	updateDownloadMessageDisplay: function(inPlatform) {
		var classAttribute = "ares-project-properties-buildStatus-download-button-" + inPlatform;
		this.$.separatorForDownloadButton.setClassAttribute(classAttribute);

		this.$.downloadButton.show();
		this.bubble("onShowMessageContainer");
	},

	/**@private*/
	showStatusMessage: function(inSender) {

		this.setSelectedPlatform(inSender.platform);
		this.$.messageContainer.show();
		this.addHightlightIconButton(this.$[inSender.platform + "Decorator"]);

		var status = this.buildStatusData && this.buildStatusData.status[inSender.platform];

		if (status === "complete") {
			this.updateDownloadMessageContent();
			this.updateDownloadMessageDisplay(inSender.platform);
			return true;
		}

		this.$.downloadButton.hide();
		this.bubble("onHideMessageContainer");

		if (status === "skip") {
			this.$.statusMessage.setContent(ilibPGB("Build skipped for this platform"));
			return true;
		}

		if (status === "pending") {
			this.$.statusMessage.setContent(ilibPGB("Build in progress"));
			return true;
		}

		if (status === "error") {
			this.$.statusMessage.setContent("Error: " + this.buildStatusData.error[inSender.platform]);
			return true;
		}

		this.$.statusMessage.setContent(ilibPGB("Application not built yet"));

		return true;

	},

	/**
	 * Listener to launch the download request form the Phonegap Build service manager.
	 * @param  {Object} inSender
	 * @param  {Object} inEvent
	 * @private
	 */
	downloadPackage: function(inSender, inEvent) {
		this.provider.downloadPackage(this.provider.getSelectedProject(), this.selectedPlatform, this.buildStatusData, enyo.bind(this, this.getPackage));

		//set the download status to "Download on progress"
		this.$.downloadStatus.setDownloadStatus(this.selectedPlatform, 2);
	},

	/**
	 * Callback used in the function "downloadPackage()"" in "Build.js"
	 * Update the status message to show the current status of the download request.
	 *
	 * @param  {Object} err error object
	 * @private
	 */
	getPackage: function(err) {
		if (err) {
			//set the download status to "Download failed"
			this.$.downloadStatus.setDownloadStatus(this.selectedPlatform, 0);
		} else {
			//set the download status to "Download complete"
			this.$.downloadStatus.setDownloadStatus(this.selectedPlatform, 1);
		}
	},

	/**@private*/
	hideMessageContainer: function() {
		//Unselect the focused platform
		this.setSelectedPlatform(undefined);
		this.removeHightlightIconButton();

		this.$.messageContainer.hide();
		this.$.downloadButton.hide();

		this.bubble("onHideMessageContainer");
	},

	/**@private*/
	hideMessageContent: function() {
		this.$.downloadButton.hide();
	},

	/**@private*/
	appIdChanged: function() {
		this.sendBuildStatusRequest();
	},

	/**
	 * Callback function to initialize the "buildStatusData" object.
	 *
	 * @param  {Object} err				  error object
	 * @param  {Object} inBuildStatusData Object returned by Phonegap build, it contains several informations
	 *									  about the built application.
	 * @private
	 */
	getBuildStatusData: function(err, inBuildStatusData) {
		if (err) {
			this.doError({
				msg: err.toString(),
				err: err
			});
		} else {
			this.updateBuildStatusData(inBuildStatusData.user);
		}
	}
});

/**
 * Model kind to keep track on the download status for each
 * mobile platform supported by Phonegap Build.
 *
 * Used only by the widget {Phonegap.ProjectProperties.BuildStatus}
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.DownloadStatus",
	provider: {},

	create: function() {
		this.inherited(arguments);
		this.set("provider", Phonegap.ProjectProperties.getProvider());
	},

	/**
	 * Set the download status for a platform defined in {this.downloadStatus}.
	 *
	 * @param {String} inPlatform platform defined in {this.downloadStatus}
	 * @param {integer} inDownloadStatus code status: 0 => failed, 1 => complete, other => on progress
	 * @public
	 */
	setDownloadStatus: function(inPlatform, inDownloadStatus) {
		/*
		 FIXME: ENYO-3687
		 This need further work to make sure that what we store in backbone is atomic data (not references/arrays)
		 However we'll need to revise the backbone store for Phonegap build as we transform it into a plugin
		 */

		this.provider.getSelectedProject().getDownloadStatus()[inPlatform] = inDownloadStatus === 1 ? ilibPGB("Download complete") : inDownloadStatus === 0 ? ilibPGB("Download failed") : ilibPGB("Download in progress");

		this.bubble("onUpdateStatusMessage");
	},

	/**
	 * Get the download status value by platform.
	 *
	 * @param  {String} inPlatform [description]
	 * @return {String} status message
	 * @public
	 */
	getDownloadStatus: function(inPlatform) {
		return this.provider.getSelectedProject().getDownloadStatus()[inPlatform];
	}

});
