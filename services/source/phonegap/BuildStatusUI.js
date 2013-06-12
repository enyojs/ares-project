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
	published: {
		pgUrl: "",
	},
	handlers: {
		onDismissPopup: "hidePopup"
	}, 

	components: [

			{kind:"BuildStatusTopToolBar",
			 name: "TopTB"
			},	   			

			{kind: "FittableRows",
    		name:"AllStatus",
    		components: [

    			{kind: "StatusRow",
    			 name: "AndroidStatus",
    			 ontap: "manageApps"
    			 },	    		
	    		
    			{kind: "StatusRow",
    			 name: "IosStatus",
    			 ontap: "manageApps"
    			 },

		    	{kind: "StatusRow",
    			 name: "BlackBerryStatus",
    			 ontap: "manageApps"
    			},

		    	{kind: "StatusRow",
    			 name: "SymbianStatus",
    			 ontap: "manageApps"
    			 },

		    	{kind: "StatusRow",
    			 name: "WebosStatus",
    			 ontap: "manageApps"
    			},

		    	{kind: "StatusRow",
    			 name: "WinphoneStatus",
    			 ontap: "manageApps"
    			},
		      ]
		},
			{kind: "BuildStatusBotomToolBar",
			name: "BottomTB"}
	],

	/**
	 * Show the status informations about the selected project
	 * @param  {JSON} inSender contain the status informations
	 * @return {boolean} show the pop-up
	 */
	
	create: function(){
		this.inherited(arguments);
	
		this.$.AndroidStatus.setLabelValue("Android");
		this.$.IosStatus.setLabelValue("IOS");
		this.$.BlackBerryStatus.setLabelValue("BlackBerry");
		this.$.SymbianStatus.setLabelValue("Symbian");
		this.$.WebosStatus.setLabelValue("WebOS");
		this.$.WinphoneStatus.setLabelValue("Windows Phone 7");
	},

	manageApps: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var accountPopup = window.open(this.pgUrl,
					       "PhoneGap Build Account Management",
					       "resizeable=1,width=1024, height=600", 'self');
	},

    hidePopup: function(){
    	this.hide();
    	return true; //stop the bubbling
    },

    showPopup: function(project, inUserData){
    	this.setUpHeader(inUserData);
    	this.setUpStatus(inUserData);
    	this.pgUrl = "https://build.phonegap.com/apps/"+inUserData.id+"/builds";
    	this.log("the user data are: ", inUserData);
    	this.show();
    },

    setUpHeader: function(inData){
    	this.$.TopTB.setTitle(inData.title);
    	this.$.TopTB.setVersion(inData.phonegap_version);
    	this.$.TopTB.setOwner(inData.collaborators.active[0].person);
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
		
		if(this.debug){

    		enyo.log("the user data are : ", inData );
    		enyo.log("Phonegap version used for the build: ", 
    		      'inData.phonegap_version');
    		//enyo.log("The AppID is: ", inData.id);
    		enyo.log("Owned by: ",
    			  'inData.collaborators.active[0].person');
    		enyo.log("The title is: ",'title');
    		
    		
    		
    		this.log("Android download: ", this.url + inData.download.android);
    		this.log("IOS download: ",this.url + inData.download.ios);
    		this.log("BlackBerry download: ", this.url + inData.download.blackberry);
    		this.log("Symbian download: ", this.url + inData.download.symbian);
    		this.log("WebOS download: ", this.url + inData.download.webos);
    		this.log("Windows Phone 7 download: ", this.url + inData.download.winphone);
		}
	},
    popupHidden: function(inSender, inEvent) {
        // do something
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

		{name: "TitleLabel",
		},
		
		{tag: "br"},

		{style: "font-size: 70%;", 
		 content:"Phonegap version : "
		},

		{name: "PhonegapVersionLabel",
		 style: "font-size: 70%;",
		},
		
		{tag: "br"},
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
		statusValue: "Status"
	},
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
	 	this.inherited(arguments);
	 	this.labelValueChanged();
	 	this.statusValueChanged();
	 },

	 labelValueChanged: function(){
	 	this.$.StatusRow_platform.setContent(this.labelValue);
	 	if(this.debug){
	 		this.log("Platform name is: ", this.labelValue);
	 	}
	 },

	 statusValueChanged: function(){
	 	this.$.StatusRow_status.setContent(this.statusValue);
	 	if(this.debug){
	 		this.log("status value is:", this.statusValue);
	 	}
	 }


		    	
});

enyo.kind({
	name: "BuildStatusBotomToolBar", 
	 classes: "ares-bordered-toolbar", 
	 kind: "onyx.Toolbar",
	 components: [
	   { name: "ok", 
	     kind: "onyx.Button", 
	     content: "OK",
	     handlers: { 
	     	ontap: 'tapped'
	      }, 
	     tapped: function(){
	 		this.bubble("onDismissPopup");
	 		//this.bubble("onHideWaitPopup");	
		 }
	    }
	 ],
	 
});










  
