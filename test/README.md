


# Ares Test Suite Environment

## Objectives

* To set up an isolated Ares Test Suite environement,
* To execute all available Test Suites,
* to create new Test Suites,
* To collapse the Test Suite Results like follow; yellow for running state, green for success, red for failure, expandable stack trace and logging for failures,
* To display these results. The display is done by the Ares Test Reporter window. 

## Usage

* Start the IDE server with the argument `runtest`. The command is: `node ide.js --runtest` or `node ide.js -T runtest`
* Wait for the message:

		Ares IDE is now running at <http://127.0.0.1:9009/ide/ares/test.html> Press CTRL + C to shutdown

* Connect to the Ares IDE in mode test using Google Chrome or Chromium. The URL is: <http://127.0.0.1:9009/ide/ares/test.html> like on [Google](http://www.google.com).
* Wait for the Ares Test Reporter window,
* Click on start button to fire the execution of the available Test Suites.

## Adding new tests
* To implement a new test suite:
	1. Create a new subkind of Ares.TestSuite. See template file available, ares-project/test/tests/TestSuiteTemplate.js 
	1. Add this new file into package.js.
	1. Any methods in your subkind must begin with 'test' and will be invoked as unit tests when the test runner executes.
	1. When each test is complete, it should call this.finish().  
	
## Notes
* One Test Suite group is currently available; HermesFileSystemTest. The HermesFileSystemTest is composed by the following unit tests:
	1. testGetServicesFromRegistry
	1. testGetHomeFromServices
	1. testPropfindAndCreateFolder
	1. testPropfindAndCreateFile
	1. testDeleteFile
	1. testDeleteFolder

Tested sucessfully on Chrome/Chromium.

## TODO
 
* Will be tested later on Safari, Firefox, Opera, IE


