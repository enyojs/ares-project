/* global Phonegap */

enyo.kind({
	name: "Phonegap.ProjectProperties.PlatformBuildStatus",
	kind: "onyx.IconButton",
	classes: "ares-project-properties-build-status-icon",
	ontap: "showStatusMessage",	
	published: {
		platform: undefined,
		buildStatusData: undefined,
	},
	buildStatusDataChanged: function() {
		if (this.buildStatusData && this.buildStatusData.status[this.platform] === "complete") {
			//Build status: complete
			this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-complete-32x32.png");
			
		} else {
			if (this.buildStatusData && this.buildStatusData.status[this.platform] === "error" || 
			    this.buildStatusData && this.buildStatusData.status[this.platform] === null){
				
				//Build status: error				
				this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-error-32x32.png");

			} else {
				if(this.buildStatusData === null) {
					
					//Build status: application not built
					this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-not-available-32x32.png");

				} else {					
					//Build status: pending
					this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-not-available-32x32.png");

				}		
			}
		}
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.BuildStatus",
	kind: "FittableRows",
	published: {
		appId: "",
		buildStatusData: undefined,
		phongapUrl: "https://build.phonegap.com",
		provider: undefined, 
		selectedPlatform: undefined
	},
	components: [
		{
			name: "buildStatusContainer", kind: "FittableRows", classes: "ares-project-properties-build-status-container",
			components: [
				{	
					name: "labelContainer",
					classes:"ares-project-properties-buildStatus-container",
					kind: "FittableColumns",					
					components:[						
						{ name: "androidButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "android" },
						{ name: "iosButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "ios" },
						{ name: "winphoneButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "winphone" },
						{ name: "blackberryButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "blackberry" },
						{ name: "webosButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform:"webos" }													
					]
				},
				{
					name: "messageContainer",
					kind: "onyx.Drawer",
					classes: "ares-project-properties-status-message-container",
					showing: false,
					components: [
						{name: "hideStatusContainer", kind: "onyx.IconButton", src: "$project-view/assets/images/close-button-16x16.png", classes: "ares-project-properties-hide-status-button", ontap:"hideMessageContainer"},
						{name: "downloadLink", content: "ddl link", tag: "a", shown: false, classes: "ares-project-properties-dl-link", ontap: "downloadPackage"},
						{name: "statusMessage", classes: "ares-project-properties-status-message"}
					]
				}
									
			]
		}
	],
	/**@private*/
	create: function() {
		this.inherited(arguments);		
		this.appIdChanged();
		this.setProvider(Phonegap.ProjectProperties.getProvider());
	},

	/**@private*/
	updateBuildStatusContainer: function(){
		
		if(this.appId === ""){
			this.setBuildStatusData(null);			
		} else {
			this.provider.getAppData(this.appId, enyo.bind(this, this.getBuildStatusData));
		} 

		this.buildStatusDataChanged();
		this.$.buildStatusContainer.render();
	},
	
	/**
	 * Charge the icon showing the build status of the application of a a given platform depending on 
	 * its status. the status is checked from the "buildStatusData" object.
	 * By clicking on the icon, the status message is displayed.
	 * 
	 * @private	 
	 */
	buildStatusDataChanged: function(){
		this.hideMessageContainer();
		this.$.downloadLink.hide();
		for(var key in this.$){
			// Get only the Enyo control that have the "platform" attribute 
			// => {Phonegap.ProjectProperties.PlatformBuildStatus} instance
			if(this.$[key].platform !== undefined) {
				this.$[key].setBuildStatusData(this.buildStatusData);
			}			
		}
	},

	/**@private*/
	showStatusMessage: function(inSender, inEvent){
		
		this.$.messageContainer.show();

		if (this.buildStatusData && this.buildStatusData.status[inSender.platform] === "complete") {
			this.$.statusMessage.setContent("");
			this.setSelectedPlatform(inSender.platform);

			if (this.buildStatusData.download[inSender.platform] !== undefined && 
				this.buildStatusData.title !== undefined) {
				
				this.$.downloadLink.setContent("Download application");
				this.$.downloadLink.show();
				this.$.downloadLink.render();
			} else {
				this.$.downloadLink.hide();
			}
		} else {
			if (this.buildStatusData && this.buildStatusData.status[inSender.platform] === "error" || 
				this.buildStatusData && this.buildStatusData.status[inSender.platform] === null){

				//Build status: error
				this.$.downloadLink.hide();
				this.$.statusMessage.setContent("Error: " + this.buildStatusData.error[inSender.platform]);				
			} else {
				
				if(this.buildStatusData === null) {
					
					//Build status: application not built
					this.$.downloadLink.hide();
					this.$.statusMessage.setContent("Build the application first");					

				} else {
					
					//Build status: pending
					this.$.downloadLink.hide();
					this.$.statusMessage.setContent("Build in progress");
				}		
			}
		}
	return true; //stop the propagation of the event

	},

	/**
	 * Listener to launch the download request form the Phonegap Build service manager.
	 * @param  {Object} inSender 
	 * @param  {Object} inEvent  
	 * @private
	 */
	downloadPackage: function(inSender, inEvent) {

		var projectConfig = this.owner.getProject();
		this.provider.downloadPackage(projectConfig, this.selectedPlatform, this.buildStatusData, enyo.bind(this, this.getPackage));
		this.$.statusMessage.setContent("Download on progress");
		this.$.statusMessage.show();
	},
	/**
	 * Callback used in the function "downloadPackage()"" in "Build.js"
	 * Update the status message to show the current status of the download request.
	 * 
	 * @param  {Object} err       error object
	 * @private
	 */
	getPackage: function(err) {
		if(err) {
			this.$.statusMessage.setContent("Download failed");
			this.$.statusMessage.show();

		} else {
			this.$.statusMessage.setContent("Download complete");
			this.$.statusMessage.show();
		}
	},	

	/**@private*/
	hideMessageContainer: function() {
		this.$.messageContainer.hide();
	},

	/**@private*/
	appIdChanged: function(){
		this.updateBuildStatusContainer();
	},

	/**
	 * Callback function to initialize the "buildStatusData" object. 
	 * 
	 * @param  {Object} err               error object
	 * @param  {Object} inBuildStatusData Object returned by Phonegap build, it contains several informations
	 *                                    about the built application.
	 * @private
	 */
	getBuildStatusData: function (err, inBuildStatusData) {
		if (err) {
			this.warn("err:", err);
		} else {
			this.setBuildStatusData(inBuildStatusData.user);
		}
	}
});