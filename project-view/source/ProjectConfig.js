enyo.kind({
	name: "ProjectConfig",
	kind: "enyo.Component",
	published: {
		projectName: "",
		projectId: "",
		// others will come ...
	},
	events: {
		onInitConfigProject: "",
	},
	components: [
				 {name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
	],
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	createConfig: function(inData) {
		if (this.debug) this.log(inData);
		var service = inData.service;
		return service.listFiles(inData.folderId)
			.response(this, function(inSender, inResponse) {
					if (this.debug) this.log("Response: "+inResponse);
					var prj = inResponse.filter(function(node){
							return node.name === "project.json";
					});
					if (prj.length < 1) {
						// new project - basic project properties
						var projectData = {format: 1, 
									id: "com.example."+inData.name, 
									name: inData.name,
									version: "1.0",
									phonegapbuild: {target: "none", key: 0}
						};
						service.createFile(inData.folderId, "project.json", JSON.stringify(projectData))
							.response(this, function(inSender, inResponse) {
								if (this.debug) this.log("New Project Name: "+inData.name);
								if (this.debug) this.log("project.json created.");
							})
							.error(this, function(inSender, inError) {
								this.log("Error: "+inError);
							});
					} else {
						// open project - get basic project properties
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
										this.doInitConfigProject({name: inData.name, 
															folderId: inData.folderId, 
															properties: inResponse.content});
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
	fsUpdateFile: function(inData) {
		var service = inData.originator.serviceRegistry.services[0].impl;
		var props = inData.properties;
		service.listFiles(inData.folderId)
		.response(this, function(inSender, inResponse) {
				if (this.debug) console.dir(inResponse);
				var obj = {
					target: props.phonegapbuild.target,
					key: props.phonegapbuild.key,
				};
				var projectData = JSON.stringify({format: 1, id: props.id, name: props.name, version: "1.0", phonegapbuild: obj});
				service.createFile(inData.folderId, "project.json", projectData)
				.response(this, function(inSender, inResponse) {
					if (inResponse && inResponse.content !== "") {
						if (this.debug) this.log("project.json updated.");
					}
				})
				.error(this, function(inSender, inError) {
					this.log("Error: "+inError);
					this.showErrorPopup(inError);
				});
		})
		.error(this, function(inSender, inError) {
			this.log("Error: "+inError);
			this.showErrorPopup(inError);
		});
	},
	storeXml: function(inData) {
		var service = inData.service;
		service.listFiles(inData.folderId)
		.response(this, function(inSender, inResponse) {
				if (this.debug) console.dir(inResponse);
				service.createFile(inData.folderId, "config.xml", inData.xmlFile)
				.response(this, function(inSender, inResponse) {
					if (inResponse && inResponse.content !== "") {
						if (this.debug) this.log("config.xml saved.");
					}
				})
				.error(this, function(inSender, inError) {
					this.log("Error: "+inError);
					this.showErrorPopup(inError);
				});
		})
		.error(this, function(inSender, inError) {
			this.log("Error: "+inError);
			this.showErrorPopup(inError);
		});
	},
});
