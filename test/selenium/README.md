
**PAGE STILL UNDER CONSTRUCTION**

## 1- HOWTO execute the ARES TEST SUITE using Selenium IDE 

**FYI:** The ARES TEST SUITE is written using IDE-API XML Formatter and Selenese commands.
	
### Firefox Prerequisites

* First, download the Selenium IDE Plugin (Record, edit and play Selenium tests) from the SeleniumHQ; <http://seleniumhq.org/projects/ide>
* Second, download the Selenium XML Formatter-IDE API (custome XML Formatter for Selenium-IDE) from; <https://addons.mozilla.org/en-US/firefox/addon/selenium-xml-formatter/?src=api>
* Firefox will protect you from installing addons from unfamiliar locations, so you will need to click ‘Allow’ to proceed with the installation
* When the download is complete, restart Firefox. After Firefox reboots you will find the Selenium-IDE listed under the Firefox Tools menu.

			
### Opening And Configuring the IDE

* To run the Selenium-IDE, select it from the Firefox Tools menu. It opens with an empty script-editing window and a menu for loading, or creating new test cases.
* Check "Enable experimental features" in Options > General, in order to be able to select Options > Formatter > XML Formatter (See **Note:** below)
* The toolbar contains buttons for controlling the execution of the test suite/test cases.
* The left-most button, Speed Control: controls how fast your test case runs. **This button needs to be positionned to slow**.

* **Note:** The Options > Formatter menu links to this article, describing why changing formats is disabled by default: <http://blog.reallysimplethoughts.com/2011/06/10/does-selenium-ide-v1-0-11-support-changing-formats>

### How to run Selenium IDE Ares Test Suite
* **Note:** Selenium distinguishes test cases and test suites.
* When open an existing test case or suite, Selenium-IDE displays its Selenium commands in the Test Case Pane.

#### Ares Test Suite

The selenium TestSuite for Ares is located `./ares-project/test/selenium/xml-scripts`

	$ cd ./ares-project/test/selenium/xml-scripts
	$ ll
	total 120
	-rw-r--r--  1 mariandebonis  staff    495 29 jan 01:50 AresTestSuite
	-rw-r--r--  1 mariandebonis  staff  10438 29 jan 14:04 CheckTemplates
	-rw-r--r--  1 mariandebonis  staff   7998 29 jan 14:03 FileOps	
	-rw-r--r--  1 mariandebonis  staff   4095 29 jan 14:03 HelloWorldPhoneGapSettings
	-rw-r--r--  1 mariandebonis  staff   2722 29 jan 14:03 HelloWorldPreview
	-rw-r--r--  1 mariandebonis  staff   4114 29 jan 14:03 NewProject
	
##### To run it

* Before the teste execution, start the Ares IDE node server: `node ide.js -T`
* Open under ares-project/test/selenium/xml-scripts/AresTestSuite file
  
  **Note: ** AresTestSuite is composed by the following TestCases; HelloWorldPreview, NewProject, FileOps, CheckTemplates and HelloWorldPhoneGapSettings.
  
* To run this AresTestSuite, click the Run All button (from the left of the IDE, 7th button) to run all the test cases in AresTestSuite, the currently loaded test suite.
* To run individually each TestCase, open it and click the "Play current testcase" (from the left of the IDE, 8th button).

### Your Contribution is required to extend the Selenium TestSuite for Ares

Give to the Ares committer(s) a chance to update the test wish list file (`./ares-project/test/selenium/WISH-TESTS-LIST.md`) with new Test Case to implement.

The objective is to test the new controls coming with Ares committer pull-requests.

## 2- HOWTO execute the ARES TEST SUITE using Selenium 2.0 WEBDRIVER API

* The Ares Test Suite xml-scripts will be converted into java files to use either Chrome or IE Selenium 2.0 webdriver APIs. 
* A patch java will be applied to obtain the final Ares Test Suite java code.
* It will be found in the patch, the upload of AresConfig.xml file where are declared properties the Test Suite is executed (i.e. webdriver name, webdriver path, os …) as this code which is not generated automatically by the formatter.

**WARNING:**

* Only xml-scripts, AresTestCasesSha1 and AresTestJava.patch files are pushed on gitHub. 
* The Java code will not.
* Reasons are; expecting to find an XML to javascript Formatter and avoid two source code for the same test.

### XML to JAVA conversion 

* Open the xml-scripts in Selenium IDE (**Back to:**  Opening And Configuring the IDE),
* From the xml-scripts;

 
	apply the JAVA/Junit 4/WEbDriver formatter conversion. 
	
	store java converted file under a temporary directory `./ares-project/test/selenium/webdriver-java-diff-patch/java-ref`
	
	**Note:** For example, the XML NewProject file be converted into NewProject.java … etc.

* The `./ares-project/test/selenium/webdriver-java-diff-patch/AresTestCasesSha1` file contains the SHA1 signature to validate the xml-scripts java converted.

### Apply AresTestJava.patch 

* To verify the SHA1 against the xml-scripts java converted found under the temporary directory `./ares-project/test/selenium/webdriver-java-diff-patch/java-ref` (either using `inhas.exe` or `/usr/bin/shasum`).

Apply the patch:

	$ cd ./ares-project/test/selenium/test/selenium/webdriver-java-diff-patch/java-ref
	$ patch -p1 < ../AresTestJava.patch
	


### Eclipse Ares Test Suite project setup

#### Eclipse Project Pre-requisites

* Eclipse IDE for JAVA EE (<http://www.eclipse.org/downloads/>)
* JAVA sdk 1.6 (or upper) (<http://www.oracle.com/technetwork/java/javase/downloads/index.html>)
* TestNG plugin within eclipse (<http://testng.org/doc/download.html>)
* InternetExplorerDriver standalone server for 64-bit IE (<http://code.google.com/p/selenium/downloads/list>)
* Selenium-java-2.30.0.zip java bindings (<http://code.google.com/p/selenium/downloads/list>)

#### Eclipse project setup
* To create the Selenium Ares TestSuite java project
* To create the AresTestSuite package,
* To create src (java code) and resources (AresConfig.xml) sub-folders
* To configure build-path; JRE system library and TestNG eclipse plugin
* To configure the libraries build-path; add external jars retrieved from selenium-java-2.30.0.zip java bindings

##### Under src/AresTestSuite

* To import the patched java code located under `./ares-project/test/selenium/test/selenium/webdriver-java-diff-patch/java-ref` into the Ares TestSuite project

##### Under resources/AresTestSuite

* To create and AresConfig.xml file
* Here is one example of the AresConfig.xml.


 .

	<?xml version="1.0" encoding="UTF-8"?>`
	<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
	<properties>
	<comment>AresTestSuite Configuration file</comment>
	<entry key="browserDriverName">IE</entry>
	<entry key="browserDriverPath">C:\\Users\\marian\\Downloads\\IEDriverServer_x64_2.29.1\\IEDriverServer.exe</entry>
	<entry key="os">windows</entry>
	<entry key="phoneGap.username">jdoe@hp.com</entry>
	<entry key="phoneGap.password">xxxxx</entry>
	</properties>

**Note:** acceptable values are:

* for `browserDriverName` key are either `Chrome` or `IE`
* for `os` key are either `mac` or `windows`


##### src/testng.xml 
To create the TestNG AresTestSuite, a testng.xml needs to be created;

	<!DOCTYPE suite SYSTEM "http://testng.org/testng-1.0.dtd">
	<suite name="AresTestSuite">
	<test name="AresTestSuite.HelloWorldPreview">
        <classes>
                <class name="AresTestSuite.HelloWorldPreview"></class>
        </classes>
	</test>
	<test name="AresTestSuite.NewProject">
        <classes>
                <class name="AresTestSuite.NewProject"></class>
        </classes>
	</test>
	<test name="AresTestSuite.FileOps">
        <classes>
                <class name="AresTestSuite.FileOps"></class>
        </classes>
	</test>
	<test name="AresTestSuite.CheckTemplates">
        <classes>
                <class name="AresTestSuite.CheckTemplates"></class>
        </classes>
	</test>
	<test name="AresTestSuite.HelloWorldPhoneGapSettings">
        <classes>
                <class name="AresTestSuite.HelloWorldPhoneGapSettings"></	class>
    </classes>
	</test>
	</suite>

##### To execute the Ares TestNG TestCase

* To run TestCases, start the Ares IDE node server: `node ide.js -T`
* Click right on src/AresTestSuite java file > run as> TestNG Test

##### To execute the TestNG AresTesSuite

* To run TestSuite, start the Ares IDE node server: `node ide.js -T`
* Click right on src/testng.xml > run as > TestNG Suite
* The src/test-output/index.html shows the results of the TestNG Test Suite execution after a refresh on src/test-output.


**Note:** IE was tested on Windows, Chrome was tested on mac.