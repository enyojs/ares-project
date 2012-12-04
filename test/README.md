


# Ares Test Suite Environment

## Objectives

* To set up an isolated Ares Test Suite environement,
* To execute all available Test Suites,
* to create new Test Suites,
* To collapse the Test Suite Results like follow; yellow for running state, green for success, red for failure, expandable stack trace and logging for failures,
* To display these results. The display is done by the Ares Test Reporter window. 

## Usage

* Start the IDE server with the argument 'runtest'. The command is: 'node ide.js runtest'
* Wait for the message:
Ares IDE is now running at <http://127.0.0.1:9009/ide/ares/test.html> Press CTRL + C to shutdown
* Connect to the Ares IDE in mode test using Google Chrome or Chromium. The URL is: <http://127.0.0.1:9009/ide/ares/test.html>
* Wait for the Ares Test Reporter window,
* Click on start button to fire the execution of the available Test Suites.

## Adding new tests
* To add a test case:
	1. Create a subclass of AresTestCase
	2. Add file to package.js.
* To implement the suite of unit tests:
	1. Create a subkind of ares.TestSuite.
	2. Any methods in your subkind must begin with 'test' and will be invoked as unit tests when the test runner executes.
	3. When each test is complete, it should call this.finish().  
* The code must be located under ares-project/test/tests
	
## Notes
One Test Suite group is currently available; HermesFileSystemTest. The HermesFileSystemTest is composed by the following unit tests:

1. testGetServicesFromRegistry
2. testGetHomeFromServices
3. testPropfindAndCreateFolder
4. testPropfindAndCreateFile
5. testDeleteFile
6. testDeleteFolder

Tested sucessfully on Chrome/Chromium.

## TODO
 
* Will be tested later on Safari, Firefox, Opera, IE


