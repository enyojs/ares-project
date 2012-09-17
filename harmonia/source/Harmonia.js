enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	components: [
		{kind: "ProviderList", onSelectProvider: "selectProvider"},
		{kind: "HermesFileTree", fit: true, onFileClick: "selectFile", onFolderClick: "selectFolder"}
	],
	selectProvider: function(inSender, inInfo) {
		//this.log("service='"+JSON.stringify(inInfo.service)+"'");
		// super hack
		var auth = inInfo.service ? inInfo.service.auth : null;
		var url = inInfo.service ? inInfo.service.url : null;
		var jsonp = inInfo.service ? inInfo.service.useJsonp : false;

		//this.log("service: auth: "+auth+" url: "+url+" jsonp: "+jsonp);
		var serviceObj = {
			auth: auth,
			url: url,
			jsonp: jsonp
		};
		this.$.hermesFileTree.setServiceInformation(serviceObj);
		this.$.hermesFileTree.reset();
	},
	//TODO: How much of the file manipulation code lives here, vs. in HermesFileTree?
	selectFile: function(inSender, inEvent) {
		console.log("Selected file: "+inEvent.file.id);
		console.dir(inEvent.file);
	},
	selectFolder: function(inSender, inEvent) {
		console.log("Selected folder: "+inEvent.file.id);
		console.dir(inEvent.file);
	}
});
