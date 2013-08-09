/* global ares */
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
	debug: true,
	style:"width: 500px; height: 280px;",
	handlers: {
		onDismissPopup: "hidePopup"
	}, 
	components: [
		{kind:"BuildStatusTopToolBar", name: "TopTB"},
		{
			kind: "FittableRows",
			name:"AllStatus",
			components: [
				{kind: "StatusRow", name: "AndroidStatus"},				
				{kind: "StatusRow", name: "IosStatus"},
				{kind: "StatusRow", name: "BlackBerryStatus"},
				{kind: "StatusRow", name: "SymbianStatus"},
				{kind: "StatusRow", name: "WebosStatus"},
				{kind: "StatusRow", name: "WinphoneStatus"}
			]
		},
		{kind: "BuildStatusBotomToolBar", name: "BottomTB"}
	],

	/**
	 * Show the status informations about the selected project
	 * @param  {Object} inSender contain the status informations
	 * @return {boolean} show the pop-up
	 */
	
	create: function(){
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	
		this.$.AndroidStatus.setLabelValue("Android");
		this.$.IosStatus.setLabelValue("IOS");
		this.$.BlackBerryStatus.setLabelValue("BlackBerry");
		this.$.SymbianStatus.setLabelValue("Symbian");
		this.$.WebosStatus.setLabelValue("WebOS");
		this.$.WinphoneStatus.setLabelValue("Windows Phone 7");
	},

	
	hidePopup: function(){
		this.hide();
		return true; //stop the bubbling
	},

	showPopup: function(project, inUserData){
		this.setUpHeader(inUserData);
		this.setUpStatus(inUserData);
		this.log("BuildStatusUI#showPopup()#inUserData", inUserData.id);
		this.$.AndroidStatus.setAppId(inUserData.id);
		this.show();
	},

	setUpHeader: function(inData){
		this.$.TopTB.setTitle(inData.title);
		this.$.TopTB.setVersion(inData.phonegap_version);
		//this.$.TopTB.setOwner(inData.collaborators.active[0].person);
	},


	setUpStatus: function(inData){
		this.$.AndroidStatus.setStatusValue(inData.status["android"]);
		this.$.IosStatus.setStatusValue(inData.status["ios"]);
		this.$.BlackBerryStatus.setStatusValue(inData.status["blackberry"]);
		this.$.SymbianStatus.setStatusValue(inData.status["symbian"]);
		this.$.WebosStatus.setStatusValue(inData.status["webos"]);
		this.$.WinphoneStatus.setStatusValue(inData.status["winphone"]);
	},


 
	getBuildStatusData: function(inData){
		this.trace("the user data are : ", inData );
		this.trace("Phonegap version used for the build: ", 
			  'inData.phonegap_version');
		this.trace("Owned by: ",
			  'inData.collaborators.active[0].person');
		this.trace("The title is: ",'title');
		this.trace("Android download: ", this.url, inData.download.android);
		this.trace("IOS download: ",this.url, inData.download.ios);
		this.trace("BlackBerry download: ", this.url, inData.download.blackberry);
		this.trace("Symbian download: ", this.url, inData.download.symbian);
		this.trace("WebOS download: ", this.url, inData.download.webos);
		this.trace("Windows Phone 7 download: ", this.url, inData.download.winphone);
	}   
});


enyo.kind({
	name: "BuildStatusTopToolBar", 
	kind: "onyx.Toolbar",
	published: {
		title: "",
		version: "",
		owner: ""
	},

	components: [
		{content: "Application: "
		},

		{name: "TitleLabel"
		},
		
		

		{style: "font-size: 70%;", 
		 content:"Phonegap version : ",
		 tag: "br"
		},

		{name: "PhonegapVersionLabel",
		 style: "font-size: 70%;"
		},
		
		
	], 

	create: function(){
		this.inherited(arguments);
	},

	titleChanged: function(){
		this.$.TitleLabel.setContent(this.title);
	},

	versionChanged: function(){
		this.$.PhonegapVersionLabel.setContent(this.version);
	}
	
});


enyo.kind({
	name: "StatusRow",
	kind: "FittableColumns",
	style: "margin-top: 10px;",
	published: {
		labelValue: "Platform",
		statusValue: "Status",
		appId: "",
		pgUrl: ""
	},
	handlers: {
		ontap: "manageApps"
	},
	debug: true,
	components: [
			{name: "StatusRow_platform",
				style: "width: 150px;"
			},
			{name: "StatusRow_status",
				style: "width: 150px;"
			},
			{tag: "br"}
	 ],
	create: function(){
		ares.setupTraceLogger(this);
		this.inherited(arguments);

		this.labelValueChanged();
		this.statusValueChanged();
	},

	labelValueChanged: function(){
		this.$.StatusRow_platform.setContent(this.labelValue);
	},
	appIdChanged: function(){
		this.trace("BuildStatusUI#appIdChanged(): ", this.appId);
		this.pgUrl = "https://build.phonegap.com/apps/" + 
						this.appId + "/builds";
	},
	manageApps: function(inSender, inValue) {
		window.open(this.pgUrl,
			"PhoneGap Build Account Management",
			"resizeable=1,width=1024, height=600", 'self'
		);
	},
	statusValueChanged: function(){
		this.$.StatusRow_status.setContent(this.statusValue);
	}				
});

enyo.kind({
	name: "BuildStatusBotomToolBar", 
	classes: "ares-bordered-toolbar", 
	kind: "onyx.Toolbar",
	components: [
		{name: "ok", 
			kind: "onyx.Button", 
			content: "OK",
			handlers: { 
				ontap: 'tapped'
			}, 
			tapped: function(){
				this.bubble("onDismissPopup");
			}
		}
	]	 
});










  
