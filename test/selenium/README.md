## HOWTO execute the ARES TEST SUITE using Selenium IDE (selenese commands)

	
## Prerequisite

* Using Firefox, first, download the IDE from the SeleniumHQ downloads page <http://seleniumhq.org/download/>
* Firefox will protect you from installing addons from unfamiliar locations, so you will need to click ‘Allow’ to proceed with the installation
* When the download is complete, restart Firefox. After Firefox reboots you will find the Selenium-IDE listed under the Firefox Tools menu.

			
## Opening the IDE

* To run the Selenium-IDE, select it from the Firefox Tools menu. It opens with an empty script-editing window and a menu for loading, or creating new test cases.
* The toolbar contains buttons for controlling the execution of the test suite/test cases.
* The left-most button, Speed Control: controls how fast your test case runs. **This button needs to be positionned to slow**.


## How to run Selenium Ares Test Suite
* **Note:** Selenium distinguishes test cases and test suites. T
* When open an existing test case or suite, Selenium-IDE displays its Selenium commands in the Test Case Pane.

### Ares Test Suite

The selenium TestSuite for Ares is located `ares-project/test/selenium/xml-scripts`

	$ cd ./ares-project/test/selenium/xml-scripts
	$ ll
	total 120
	-rw-r--r--  1 mariandebonis  staff    495 29 jan 01:50 AresTestSuite
	-rw-r--r--  1 mariandebonis  staff  10438 29 jan 14:04 CheckTemplates
	-rw-r--r--  1 mariandebonis  staff   7998 29 jan 14:03 FileOps
	-rw-r--r--  1 mariandebonis  staff   4095 29 jan 14:03 HelloWorldPhoneGapSettings
	-rw-r--r--  1 mariandebonis  staff   2722 29 jan 14:03 HelloWorldPreview
	-rw-r--r--  1 mariandebonis  staff   4114 29 jan 14:03 NewProject
	
#### To run it

* Open under ares-project/test/selenium/xml-scripts/AresTestSuite file
  
  **Note: ** AresTestSuite is composed by the following TestCases; HelloWorldPreview, NewProject, FileOps, CheckTemplates and HelloWorldPhoneGapSettings.
  
* To run this AresTestSuite, click the Run All button (from the left of the IDE, 7th button) to run all the test cases in AresTestSuite, the currently loaded test suite.

## Contribution required to extend the Selenium TestSuite for Ares

Give to the Ares commiter(s) a chance to update the test wish list file (`ares-project/test/selenium/WISH-TESTS-LIST.md`) with new Test Case to implement.

The objective is to test the new controls coming with Ares commiter pull-requests.



