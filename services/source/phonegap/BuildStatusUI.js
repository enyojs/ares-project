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
		selectedPlatform: undefined,
		extensions: {
			"android": "apk",
			"ios": "ipa",
			"webos": "ipk",
			"winphone": "xap",
			"blackberry": "jad"
		}
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
						{ name: "blackberryButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "blackberry" },
						{ name: "webosButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform:"webos" },
						{ name: "winphoneButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "winphone" }							
					]
				},
				{
					name: "messageContainer",
					kind: "onyx.Drawer",
					classes: "ares-project-properties-status-message-container",
					showing: false,
					components: [
						{name: "hideStatusContainer", kind: "onyx.IconButton", src: "$project-view/assets/images/close-button-16x16.png", classes: "ares-project-properties-hide-status-button", ontap:"hideMessageContainer"},
						{name: "statusMessage"},
						{name: "downloadLink", content: "ddl link", tag: "a", shown: false, classes: "ares-project-properties-dl-link", ontap: "checkDownload"},
						{
							name: "downloadStatusContainer", kind: "FittableColumns", 
							components: [
								{name: "statusRow02", content: "Download confimation"},
								{name: "launchDownload", kind: "onyx.Button", content: "Yes", showing: false},
								{name: "cancelDownload", kind: "onyx.Button", content: "No", showing: false},
							]
						},
						
						{name: "statusRow03", content: "Download Progress", showing: false}
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
		this.$.downloadStatusContainer.hide();


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
	 * 
	 * @private
	 */
	checkDownload: function(inSender, inEvent) {

		var childrenList, phonegapFolderContent;

		// Reconstruct the name of the package in the same way as done in bdPhonegap.
			var packageName = this.buildStatusData.package + "_" + this.buildStatusData.version + "." + (this.extensions[this.selectedPlatform] || "bin");
		

		// get the instance describing the project root node.
		var projectConfig = this.owner.getProject();

		/**
		 * Return the list of the built applications in the file '$/target/phonegap'
		 * @param  {Array} inArray contains instances of the sub-nodes of the selected project
		 * @return {Array}         list of the files contained in the project folder '$/target/phonegap'
		 * @private
		 */
		var getPhonegapFolderContent = function (inArray) {
			var phonegapFolderContent; 
			enyo.forEach(inArray, function(child){
				if (child.isDir && child.name === "target") {
					phonegapFolderContent = child.children[0].children;					
				}
			}, this);

			return phonegapFolderContent;
		};

		/**
		 * @param  {Array} inArray meta-data on the files existing in the folder "$/target/phonegap"
		 * @return {boolean}         "true" if the package for the selected platfrom existe in "$/target/phonegap", false otherwise.
		 * @private
		 */
		var verifyPackage = function(inArray) {

			var packageAlreadyExist = false;
			enyo.forEach(inArray, function (packageInstance) {
				if (packageInstance.name === packageName) {
					packageAlreadyExist = true;
				}				
			}, this);

			return packageAlreadyExist;
		};
		
		
		// Test if a project is selected from the project list
		if (projectConfig !== undefined) {
			
			var req = projectConfig.service.propfind(projectConfig.folderId, 3);			
			req.response(this, function(inSender, inFile) {
				childrenList = inFile.children;				
				phonegapFolderContent = getPhonegapFolderContent.call(this, childrenList);

				if(verifyPackage.call(this, phonegapFolderContent)) {
				
					this.$.downloadStatusContainer.show();
					this.$.statusRow02.setContent("Override the package " + packageName);
					
					this.$.launchDownload.show();
					this.$.cancelDownload.show();

				} else {
					
					this.$.downloadStatusContainer.show();

					this.$.statusRow02.setContent("Downloading the package" + packageName + "");
					this.$.launchDownload.hide();
					
					this.$.cancelDownload.hide();
					this.$.downloadLink.render();
				}
			});			
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