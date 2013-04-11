# Testing Ares Components

## Objectives


Give to the Ares commiter(s) a quick & easy tool to evaluate regressions before commiting a pull-request.

## Usage

* Start the IDE server with following command: `node ide.js --runtest` or `node ide.js -T`
* Wait for the message:

		Ares IDE is now running at <http://127.0.0.1:9009/ide/ares/test.html> Press CTRL + C to shutdown

* Connect to the Ares IDE in mode test using Google Chrome or Chromium. The URL is: <http://127.0.0.1:9009/ide/ares/test.html> like on [Google](http://www.google.com).
* Wait for the Ares Test Reporter window,  __NB__: Check popup blocker setting if the Test reporter window does not appear.
* Text exchange between the `2 windows` Ares IDE and Ares Test Reporter is done using postMessage API.
* Click on start button to fire the execution of the available Test Suite.
* Tests are executed under a temporary directory. This directory is located under test/root.

## Adding new tests
* To implement a new test suite:
	1. Create a new subkind of Ares.TestSuite by copying the template file. See template file available, ares-project/test/testrunner/tests/TestSuiteTemplate.js 
	1. Add this new file into package.js.
	1. Any methods in your subkind must begin with 'test' and will be invoked as unit tests when the test runner executes.
	1. When each test is complete, it should call this.finish().  
	
## Notes
* The Test Suite groups currently available is; HermesFileSystemTest.
* The HermesFileSystemTest tests the HermesFileSystem API (API used for Heremes local File system). This test suite is composed by the following unit tests:
	1. testGetServicesFromRegistry - get the IDE configured services from the registry
	1. testGetHomeFromServices - get the IDE Home service from the list of services configured
	1. testPropfindOrCreateFolder - list and/or create directory from the test/root directory
	1. testPropfindAndCreateFile - list and file
	1. testDeleteFile - delete file
	1. testDeleteFolder - delete directory
	1. testSourceFolderRevial - recreate directory	

Tested sucessfully on Chrome/Chromium, and Firefox.

__NB__: 

* On IE, no Ares Test Reporter window is spawned. 
* The test reporting in done on the console. This is due to the postMessage lack of support on IE. See <http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx>



