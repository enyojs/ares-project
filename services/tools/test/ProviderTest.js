enyo.kind({
	name: "ProviderTest",
	kind: enyo.TestSuite,
	timeout: 20 * 1000,
	components: [
		{name: "provider", kind: "AresProvider"}
	],
	// test requires a service, we assume 'dropbox'
	service: "dropboxNode",
	testServices: function() {
		this.finish(this.$.provider.services[this.service] ? "" : "no '" + this.service + "' service registered");
	},
	testCreateFolder: function() {
		this.$.provider.createFolder(this.service + "/", "testFolder")
			.response(this, testFolder)
			.error(this, error)
			;
		function error(inSender, inError) {
			this.finish(inError);
		}
		function testFolder(inSender, inFolderId) {
			this.$.provider.listFiles(this.service + "/" + inFolderId)
				.response(this, confirmFileList)
				.error(this, error)
				;
		}
		function confirmFileList(inSender, inResponse) {
			this.log(inResponse);
			if (inResponse.length !== 0) {
				this.finish("bad listing");
			}
			this.$.provider.deleteFolder(this.service + "/" + "testFolder")
				.response(this, folderDeleted)
				.error(this, error)
				;
		}
		function folderDeleted(inSender, inResponse) {
			this.finish();
		}
	},
	testCreateFile: function() {
		this.$.provider.createFile(this.service + "/", "testFile")
			.response(this, testFile)
			.error(this, error)
			;
		function error(inSender, inError) {
			this.finish(inError);
		}
		function testFile(inSender, inFileId) {
			this.$.provider.getFile(this.service + "/" + inFileId)
				.response(this, confirmFile)
				.error(this, error)
				;
		}
		function confirmFile(inSender, inResponse) {
			this.$.provider.deleteFile(this.service + "/" + "testFile")
				.response(this, fileDeleted)
				.error(this, error)
				;
		}
		function fileDeleted(inSender, inResponse) {
			this.finish();
		}
	}
});