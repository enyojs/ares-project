enyo.kind({
	name: "ProjectConfig",
	kind: "enyo.Component",
	published: {
		projectName: "",
		projectId: "",
		// others will come ...
	},
	events: {
		onUploadProjectConfig: "",
	},
	components: [
	             {name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
	],
	debug: false,
	create: function() {
		this.inherited(arguments);
		this.configs = [];
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	createConfig: function(inData) {
		if (this.debug) this.log(inData);
		var service = inData.service;
		service.listFiles(inData.folderId)
        	.response(this, function(inSender, inResponse) {
                	if (this.debug) this.log("Response: "+inResponse);
                	var prj = inResponse.filter(function(node){
                        	return node.name === "project.json";
                	});
                	if (prj.length < 1) {
                		// new project
                		var projectData = JSON.stringify({format: 1, id: "com.example.myapp", name: inData.name, version: "1.0"});
                		service.createFile(inData.folderId, "project.json", projectData)
                			.response(this, function(inSender, inResponse) {
                				if (this.debug) this.log("New Project Name: "+inData.name);
                				if (this.debug) this.log("project.json created.");
                			})
                			.error(this, function(inSender, inError) {
                				this.log("Error: "+inError);
                			});
                	} else {
                		// open project
                		service.getFile(prj[0].id)
                			.response(this, function(inSender, inResponse) {
                				if (inResponse && inResponse.content !== "") {
                					if (this.debug) this.log("Open Project Name: "+inData.name);
                					if (this.debug) this.log("Properties: "+JSON.stringify(inResponse.content));
                				}
                			})
                			.error(this, function(inSender, inError) {
                				this.log("Error: "+inError);
                			});
                	}
             })
 			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
			});
	},
	checkConfig: function(inData) {
		//this.log(inData);
		var service = inData.service.impl;
		service.listFiles(inData.folderId)
    	.response(this, function(inSender, inResponse) {
            	if (this.debug) console.dir(inResponse);
            	var prj = inResponse.filter(function(node){
                    	return node.name === "project.json";
            	});
            	// check if project properties exists
            	if (prj.length < 1) {
            		this.log("No project config file!!");
            		this.showErrorPopup("No project config file!!");
            	} else {            		
            		service.getFile(prj[0].id)
            		.response(this, function(inSender, inResponse) {
            			if (inResponse && inResponse.content !== "") {
            				if (this.debug) this.log("Upload Project Config:");
            				if (this.debug) console.log(inResponse.content);
            				this.doUploadProjectConfig({name: inData.name, properties: inResponse.content});
            			}
            		})
            		.error(this, function(inSender, inError) {
            			this.log("Error: "+inError);
            			this.showErrorPopup(inError);
            		});
            	}
        })
		.error(this, function(inSender, inError) {
			this.log("Error: "+inError);
			this.showErrorPopup(inError);
		});
	},
});
