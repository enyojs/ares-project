enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	components: [
		{kind: "ProviderList", onSelectProvider: "selectProvider"},
		{kind: "HermesFileTree", fit: true}
	],
	selectProvider: function(inSender, inInfo) {
		//this.log(inInfo.service.auth);
		// super hack
		var auth = inInfo.service ? inInfo.service.auth : null;
		if (this.owner) {
			this.owner.$.service.auth = auth;
		}
		this.$.hermesFileTree.$.service.auth = auth;
		this.$.hermesFileTree.reset();
	}
});