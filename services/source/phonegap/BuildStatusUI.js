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
	style:"width: 500px; height: 350px;",
	published: {
		url: "https://build.phonegap.com"
		
		},
	handlers: {
		onDismissPopup: "hidePopup"

	}, 

	/**
	 * Show the status informations about the selected project
	 * @param  {JSON} inSender contain the status informations
	 * @return {boolean} show the pop-up
	 */
	
	showPopup: function(inSender) {
		enyo.log("the pop up is shown :)");
		this.getBuildStatusData(inSender);
		this.show();
    },

    hidePopup: function(){
    	this.hide();
    	//return true; //stop the bubbling
    },
    
    
    
    getBuildStatusData: function(inData){

    	this.createComponent(
    		{name: "BuildStatusTopToolBar", 
    		kind: "onyx.Toolbar",


    		components: [
				{tag: "Status", 
				content: "Application: " + inData.title},
				{tag: "br"},

				{tag:"Owner",
	    		style: "font-size: 70%;",
	    		content:"Owned by : "+ inData.collaborators.
	    		active[0].person+"\n" },
	    		{tag: "br"},

	    		{tag:"PhonegapVersion",
	    		style: "font-size: 70%;", 
	    		content:"Phonegap version : "+ 
	    		inData.phonegap_version},
	    		{tag: "br"},
			]}
    	);
    	

    	this.createComponent(

    		{kind: "onyx.Groupbox", 
    		style: "margin-right: 5px; margin-left: 5px;", 
    		components: [
   			{kind: "onyx.GroupboxHeader",
   			//style: "float:left;", 
   			content: "Status"},

   			{kind: "onyx.Toolbar", 
   			components: [


    		{kind: "FittableRows",
    		name:"AllStatus",
    		components: [
	    		
	    		
    			{kind: "FittableColumns",
    			 style: "margin-top: 10px;",
				 components: [
		    		{style: "width: 150px;",
		    		content:"Android"},

		    		{style: "width: 150px;",
		    		content: inData.status.android},
		    		{tag: "br"}
	    		 ]
		    	},

		    	{kind: "FittableColumns",
		    	 style: "margin-top: 10px;",		    	
			 	 components: [

		    		{style: "width: 150px;",
		    		content:"IOS "},

		    		{style: "width: 150px;",
		    		content: inData.status.ios},
		    		{tag: "br"}
		    	 ]
		    	},

		    	{kind: "FittableColumns",
		    	style: "margin-top: 10px;",
		    	 components: [

		    		{style: "width: 150px;",
		    		content:"BlackBerry "},

		    		{style: "width: 150px;",
		    		content: inData.status.blackberry},
		    		{tag: "br"}
			     ]
		    	},

		    	{kind: "FittableColumns",
		    	style: "margin-top: 10px;",
		    	 	components: [
			    		{style: "width: 150px;",
			    		content:"Symbian"},

			    		{style: "width: 150px;",
			    		content: inData.status.symbian},
			    		{tag: "br"}
			    	]
		    	},

		    	{kind: "FittableColumns",
		    	style: "margin-top: 10px;",
		    	components: [
		    		{style: "width: 150px;",
		    		content:"WebOS"},

		    		{style: "width: 150px;",
		    		content: inData.status.webos},
		    		{tag: "br"}
			    ]
		    	},

		    	{kind: "FittableColumns",
		    	style: "margin-top: 10px;",
			 	components: [
		    		{style: "width: 150px;",
		    		content:"Windows Phone 7"},

		    		{style: "width: 150px;",
		    		content: inData.status.winphone},
		    		{tag: "br"}
		    	 ]
		    	},
		    ]}]}]}


	    		);

		this.createComponent(
		   {name: "BuildStatusBotomToolBar", 
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
			 		this.bubble("onHideWaitPopup");	
				 }
			    }
			 ],
			 
			}
		);
    	if(this.debug){
    		enyo.log("the user data are : ", inData );
    		enyo.log("Phonegap version used for the build: ", 
    		      inData.phonegap_version);
    		//enyo.log("The AppID is: ", inData.id);
    		enyo.log("Owned by: ",
    			  inData.collaborators.active[0].person);
    		enyo.log("The title is: ",inData.title);
    		
    		
    		
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

