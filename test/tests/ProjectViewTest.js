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
	* handleSelectProvider
	*/
	testHandleSelectProvider: function(){
		var dirPopup =  this.aresObj.$.projectView.$.projectWizardCreate.$.selectDirectoryPopup;
		var pWizard = this.aresObj.$.projectView.$.projectWizardCreate;
		if (dirPopup) {
			// retrieve the service
			var pList = dirPopup.$.providerList;
			var that = this;
			var myService = pList.services[0];
			this.log(myService);

			var userPushOk = function() {
				// simulate on projectWizardProperties the Ok event which is handled by createProject
				pWizard.createProject(that,{service: myService });
				pWizard.$.propertiesWidget.confirmTap(that, {service: myService, callBack: that.finish });
	
			};

			var userSelectDir = function() {
				var hFileTree = dirPopup.$.hermesFileTree;
				var nodes = hFileTree.getNodeFiles();
					
				// simulate nodeTap & selectFolder
				hFileTree.doFolderClick(nodes[0]);
				nodes[0].doNodeTap();

				// simulate confirmTap
				dirPopup.doDirectorySelected({serviceId: dirPopup.selectedDir.id, directory: dirPopup.selectedDir, testCallBack: userPushOk});
			};
			// selectProvider
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