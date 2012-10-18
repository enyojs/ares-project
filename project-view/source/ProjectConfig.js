enyo.kind({
	name: "ProjectConfig",
	kind: "enyo.Component",
	published: {
		projectName: "",
		projectId: "",
		// others will come ...
	},
	components: [
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		],
	create: function() {
		this.inherited(arguments);
	},
	creationConfig: function(inData) {
		this.log(inData);
		var service = inData.service;
		var content = {
				format: 1,
				id: "com.example.myapp",	// default string id
				name: inData.name,
				version: "1.0"
		};
		var projectData = JSON.stringify(content);
		service.createFile(inData.folderId, "project.json", projectData)
			.response(this, function(inSender, inResponse) {
				this.log("Response: "+inResponse);
			})
			.error(this, function(inSender, inError) {
				this.log("Error: "+inError);
				this.showErrorPopup("Creating file project.json failed:" + inError);
		});
		
	},
	modifyConfigFile: function(projectData) {
		// TODO - ENYO-1222
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
});
