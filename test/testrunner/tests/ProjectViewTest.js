enyo.kind({
	name: "ProjectViewTest",
	kind: "Ares.TestSuite",
	debug: true,
	registry: null,
	home: null,

	create: function () {
		this.inherited(arguments);
		this.services = ProjectViewTest.services;
		this.home = ProjectViewTest.home;
	},
	/**
	* onCreateProject event is fired onclick: "doCreateProject" in ProjectList.js
	*/
	testDoCreateProjectAction: function() {
		var pList = this.aresObj.$.projectView.$.projectList;
		if (pList) {
			pList.doCreateProject();
			this.finish();
		} else {
			this.finish("ProjectList Object: "+pList+ " is not found!");
		}
	},
	/**
	* handleSelectProviderAndCreateProjectjson
	*/
	testHandleSelectProviderAndCreateProjectjson: function(){
		enyo.log("Begin called in testHandleSelectProvider.");

		var dirPopup =  this.aresObj.$.projectView.$.projectWizardCreate.$.selectDirectoryPopup;
		var pWizard = this.aresObj.$.projectView.$.projectWizardCreate;

		if (dirPopup) {
			// retrieve the service
			var pList = dirPopup.$.providerList;
			var that = this;
			var myService = pList.services[0];
			if (this.debug) enyo.log(myService);

			var userPushOk = function() {
				if (this.debug) enyo.log("testHandleSelectProvider: user push ok") ;
				// simulate on projectWizardProperties the Ok event which is handled by createProject
				pWizard.$.propertiesWidget.confirmTap(
					that, {
						service: myService,
						callBack: function(){that.finish() ;}
					}
				);
			};

			var userSelectDir = function() {
				var hFileTree = dirPopup.$.hermesFileTree;
				var nodes = hFileTree.getNodeFiles();

				if (this.debug) enyo.log("testHandleSelectProvider: user select dir") ;

				// simulate nodeTap & selectFolder
				hFileTree.doFolderClick(nodes[3]);
				nodes[3].doNodeTap();

				if (this.debug) enyo.log("testHandleSelectProvider: user confirms dir") ;
				// simulate confirmTap
				dirPopup.doDirectorySelected({serviceId: dirPopup.selectedDir.id, directory: dirPopup.selectedDir, testCallBack: userPushOk});
			};
			// selectProvider
			if (this.debug) enyo.log("testHandleSelectProvider: handleSelectProvider called") ;
			dirPopup.handleSelectProvider(this, {service: myService, callBack: userSelectDir});
		} else {
			this.finish("SelectDirectoryPopup: "+this.aresObj.$.projectView.$.projectWizardCreate.$.SelectDirectoryPopup+ " is not available!");
		}
	},
	statics: {
		services: null,
		home: null
	}
});