
### Draft list of scenarii to implement for testing Ares UI using Selenium.


	Note: Tests will be implemented using Selenium the FF plugin IDE
		  This is not an exhaustive list.
		  Wish list can be updated by all contributors
		  Test 1 is a scenario description example (command, target, value)
	
		
### Wish list of selenium tests to implement

1. 	Test 1 -  NewProject scenario (see uder ares-project/test/selenium/xml-script/NewProject xml script)

		- open the URL "ares test" with as parameters, debug=true & norunner=true
		- verify and assert on "Ares" text, is present
		- click on object id=ares_projectView_projectList_iconButton2 - Create Project button. Result; display the project wizard containing the provider list
		- verify and assert on "Ares Test - Home directory"" text is present. Represents the Ares Test service provider
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_providerList_name. Represents the Ares Test provider name. Result; display the hermes file tree associated to the provider selected.
		- verify and assert on "Server" text, is present
		- verify and assert on "NewProject" text, is present
		- click on object id= ares_projectView_projectWizardCreate_selectDirectoryPopup_hermesFileTree_serverNode_$NewProject_caption which enables the caption on "NewProject" node into the herme file tree
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_confirm which is the Ok button; Result; display project wizard create pop up
		- from the project wizard create pop up, put "projectSeleniumTest" into Title input field 
		- click on object id=ares_projectView_projectWizardCreate_propertiesWidget_ok which is the associated OK button
		- click on object id=ares_projectView_projectList_projectList_ownerProxy_item. Represents the NewProject entry in the project List. Result; expand and display the NewProject in the hermes file tree window.
				
1. 	Test 2 -  Import the HelloProject and Preview (see uder ares-project/test/selenium/xml-script/HelloWorldPreview xml script)

		- open the URL "ares test" with as parameters, debug=true & norunner=true
		- verify and assert on "Ares" text, is present
		- click on object id=ares_projectView_projectList_iconButton3 - Import Project button. Result; display the project wizard containing the provider list
		- verify and assert on "Ares Test - Home directory"" text is present. Represents the Ares Test service provider
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_providerList_name. Represents the Ares Test provider name. Result; display the hermes file tree associated to the provider selected.
		- verify and assert on "Server" text, is present
		- verify and assert on "HelloWorld" text, is present
		- click on object id=ares_projectView_projectWizardScan_hermesFileTree_serverNode_$HelloWorld_caption which enables the caption on "HelloWorld" node into the herme file tree
		- click on object id=ares_projectView_projectWizardScan_confirm which is the associated OK button
		- click on object id=ares_projectView_projectList_projectList_ownerProxy_item. Represents the "helloWorld" entry into the project list
		- click on object id=ares_projectView_projectList_previewButton - Preview Project Button. Result; display the "HelloWorld" preview window according to the defaut preview settings.
		
1. 	Test 3 -  File Operations Tests (see uder ares-project/test/selenium/xml-script/FileOps xml script)

		- open the URL "ares test" with as parameters, debug=true & norunner=true
		- verify and assert on "Ares" text, is present
		- click on object id=ares_projectView_projectList_iconButton3 - Import Project button. Result; display the project wizard containing the provider list
		- verify and assert on "Ares Test - Home directory"" text is present. Represents the Ares Test service provider
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_providerList_name. Represents the Ares Test provider name. Result; display the hermes file tree associated to the provider selected.
		- verify and assert on "Server" text, is present

	
	
