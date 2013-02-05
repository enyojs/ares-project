
## Scenarii list which implement the Selenium Ares TestSuite.


**Note 1:** TestCases listed below are either already implemented or will be implemented using Selenium the FF plugin IDE. See the README.md for instructions.

**Note 2:** This wish list is still under construction and can be updated/completed by all Ares contributors.

## Selenium Test Cases wish-list

1. TestCase -  Import the HelloWorldProject and Preview it (see uder ares-project/test/selenium/xml-script/**HelloWorldPreview** xml script)

		- open the URL "ares test" with as parameters, debug=true & norunner=true
		- verify and assert on "Ares" text, is present
		- click on object id=ares_projectView_projectList_iconButton3 - Import Project button. Result; display the project wizard containing the provider list
		- verify and assert on "Ares Test - Home directory"" text is present. Represents the Ares Test service provider
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_providerList_name. Represents the Ares Test provider name. Result; display the hermes file tree associated to the provider selected.
		- verify and assert on "root" text, is present
		- verify and assert on "HelloWorld" text, is present
		- click on object id=ares_projectView_projectWizardScan_hermesFileTree_serverNode_$HelloWorld_caption which enables the caption on "HelloWorld" node into the herme file tree
		- click on object id=ares_projectView_projectWizardScan_confirm which is the associated OK button
		- click on object id=ares_projectView_projectList_projectList_ownerProxy_item. Represents the "helloWorld" entry into the project list
		- click on object id=ares_projectView_projectList_previewButton - Preview Project Button. Result; display the "HelloWorld" preview window according to the defaut preview settings.
		
1. 	TestCase -  Create a NewProject (see uder ares-project/test/selenium/xml-script/**NewProject** xml script)

		- open the URL "ares test" with as parameters, debug=true & norunner=true
		- verify and assert on "Ares" text, is present
		- click on object id=ares_projectView_projectList_iconButton2 - Create Project button. Result; display the project wizard containing the provider list
		- verify and assert on "Ares Test - Home directory"" text is present. Represents the Ares Test service provider
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_providerList_name. Represents the Ares Test provider name. Result; display the hermes file tree associated to the provider selected.
		- verify and assert on "root" text, is present
		- verify and assert on "NewProject" text, is present
		- click on object id= ares_projectView_projectWizardCreate_selectDirectoryPopup_hermesFileTree_serverNode_$NewProject_caption which enables the caption on "NewProject" node into the herme file tree
		- click on object id=ares_projectView_projectWizardCreate_selectDirectoryPopup_confirm which is the Ok button; Result; display project wizard create pop up
		- from the project wizard create pop up, put "projectSeleniumTest" into Title input field 
		- click on object id=ares_projectView_projectWizardCreate_propertiesWidget_ok which is the associated OK button
		- click on object id=ares_projectView_projectList_projectList_ownerProxy_item. Represents the NewProject entry in the project List. Result; expand and display the NewProject in the hermes file tree window.
				
		
1. 	Test -  Test all File Operations like New Folder, New File, Rename, Copy and Delete (see uder ares-project/test/selenium/xml-script/**FileOps** xml script)
        
        baseURL="http://127.0.0.1:9009/

        <command>open</command>
        <target><![CDATA[/ide/ares/test.html?debug=true&norunner=true]]></target>
        <value><![CDATA[]]></value>
        
        <command>verifyTextPresent</command>
        <target><![CDATA[Ares]]></target>
        <value><![CDATA[]]></value>

        <command>assertTitle</command>
        <target><![CDATA[Ares]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_projectList_iconButton3]]></target>
        <value><![CDATA[]]></value>

        <command>verifyTextPresent</command>
        <target><![CDATA[Ares Test - Home Directory]]></target>
        <value><![CDATA[]]></value>

        <command>assertTextPresent</command>
        <target><![CDATA[Ares Test - Home Directory]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_projectWizardScan_providerList_item]]></target>
        <value><![CDATA[]]></value>

        <command>assertTextPresent</command>
        <target><![CDATA[root]]></target>
        <value><![CDATA[]]></value>

        <command>assertTextPresent</command>
        <target><![CDATA[FileOps]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_projectWizardScan_hermesFileTree_serverNode_$FileOps_caption]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_projectWizardScan_confirm]]></target>
        <value><![CDATA[]]></value>

        <command>waitForText</command>
        <target><![CDATA[id=ares_projectView_projectList_projectList_ownerProxy_item]]></target>
        <value><![CDATA[FileOps]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_projectList_projectList_ownerProxy_item]]></target>
        <value><![CDATA[FileOps]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_caption]]></target>
        <value><![CDATA[FileOps]]></value>

        <command>waitForText</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_newFolderButton]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_newFolderButton]]></target>
        <value><![CDATA[]]></value>

        <command>waitForText</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFolderPopup_fileName]]></target>
        <value><![CDATA[]]></value>

        <command>type</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFolderPopup_fileName]]></target>
        <value><![CDATA[Source]]></value>

        <command>keyPress</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFolderPopup_fileName]]></target>
        <value><![CDATA[e]]></value>

        <command>keyUp</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFolderPopup_fileName]]></target>
        <value><![CDATA[e]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFolderPopup_confirmButton]]></target>
        <value><![CDATA[]]></value>

        <command>verifyElementPresent</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_$Source_caption]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_$Source_caption]]></target>
        <value><![CDATA[Source]]></value>

        <command>clickAt</command>
        <target><![CDATA[ares_projectView_harmonia_hermesFileTree_deleteFileButton]]></target>
        <value><![CDATA[]]></value>

        <command>waitForText</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_deletePopup_title]]></target>
        <value><![CDATA[exact:Delete folder: Source?]]></value>

        <command>clickAt</command>
        <target><![CDATA[ares_projectView_harmonia_hermesFileTree_deletePopup_button2]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_caption]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_newFileButton]]></target>
        <value><![CDATA[]]></value>

        <command>type</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFilePopup_fileName]]></target>
        <value><![CDATA[App1.js]]></value>

        <command>keyPress</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFilePopup_fileName]]></target>
        <value><![CDATA[s]]></value>

        <command>keyUp</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFilePopup_fileName]]></target>
        <value><![CDATA[s]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameFilePopup_confirmButton]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_caption]]></target>
        <value><![CDATA[]]></value>

        <command>waitForText</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_$App1.js_caption]]></target>
        <value><![CDATA[App1.js]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_$App1.js_caption]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_copyFileButton]]></target>
        <value><![CDATA[]]></value>

        <command>keyPress</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_copyFileButton]]></target>
        <value><![CDATA[s]]></value>

        <command>keyUp</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_copyFileButton]]></target>
        <value><![CDATA[s]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_nameCopyPopup_confirmButton]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_serverNode_$Copy of App1.js_caption]]></target>
        <value><![CDATA[]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_renameFileButton]]></target>
        <value><![CDATA[]]></value>

        <command>type</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_renamePopup_fileName]]></target>
        <value><![CDATA[App2.js]]></value>

        <command>keyPress</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_renamePopup_fileName]]></target>
        <value><![CDATA[s]]></value>

        <command>keyUp</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_renamePopup_fileName]]></target>
        <value><![CDATA[s]]></value>

        <command>clickAt</command>
        <target><![CDATA[id=ares_projectView_harmonia_hermesFileTree_renamePopup_confirmButton]]></target>
        <value><![CDATA[]]></value>
	
1. 	Test -  Check Templates format for index.html, package.js and App.js creation (see uder ares-project/test/selenium/xml-script/**CheckTemplates** xml script)

		- TBC
		
1. 	Test -  Test the HelloWorld PhoneGap Settings like PhoneGap build credentials (see uder ares-project/test/selenium/xml-script/**HelloWorldPhoneGapSettings** xml script)

		- TBC
		
1. 	Test -  Create a New HelloWorld Project using bootplate and Preview it (**Not yet developed**)

 		- TBC

1. 	Test -  Test that the root server as the same name as the one configured in ide-test.json (**Not yet developed**)

 		- TBC
		
		
## Selenium AresTestSuite

**Note 1:** The AresTestSuite is composed by all Test Cases described above.
**Note 2:** As intermediat results are created for subsequent test cases, the execution needs to follow a specific order. 


<head>
<title>Ares Test Suite - Functionality Tests</title>
</head>
<body>
<table>
  <tr><td><b>Suite Of Tests</b></td></tr>
  <tr><td><a href="./HelloWorldPreview">HelloWorldPreview</a></td></tr>
  <tr><td><a href="./NewProject">NewProject</a></td></tr>
  <tr><td><a href="./FileOps">FileOps</a></td></tr>
  <tr><td><a href="./CheckTemplates">CheckTemplates</a></td></tr>
  <tr><td><a href="./HelloWorldPhoneGapSettings">HelloWorldPhoneGapSettings</a></td></tr>
</table>
</body>
</html>