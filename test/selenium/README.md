
## 1- HOWTO execute the ARES TEST SUITE using Selenium 2.0 IDE and XML-API 

**FYI:** The ARES TEST SUITE is written using IDE-API XML Formatter and Selenese commands

### Firefox Prerequisites

* First, download the Selenium IDE Plugin (Record, edit and play Selenium tests) from the SeleniumHQ: <http://seleniumhq.org/projects/ide>
* Second, download the Selenium XML Formatter-IDE API (custome XML Formatter for Selenium-IDE) from: <https://addons.mozilla.org/en-US/firefox/addon/selenium-xml-formatter/?src=api>
* Firefox will protect you from installing addons from unfamiliar locations, so you will need to click ‘Allow’ to proceed with the installation
* When the download is complete, restart Firefox. Once restarted, Firefox will list Selenium-IDE under Firefox Tools menu.

			
### Opening And Configuring the IDE

* To run the Selenium-IDE, select it from the Firefox Tools menu (or Web developer menu). It opens with an empty script-editing window and a menu for loading, or creating new test cases.
* Check "Enable experimental features" in Options > General, te enable next step
* select Options &rarr; Formatter &rarr; XML Formatter (See **Note:** below)
* The toolbar contains buttons for controlling the execution of the test suite/test cases.
* The left-most button, Speed Control, controls how fast your test case runs. **This button needs to be positionned to slow**.

* **Note:** The Options &rarr; Formatter menu links to this article, describing why changing formats is disabled by default: <http://blog.reallysimplethoughts.com/2011/06/10/does-selenium-ide-v1-0-11-support-changing-formats>

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
	-rw-r--r--  1 mariandebonis  staff   2909 21 fév 19:06 PhobosDocumentLabel
	-rw-r--r--  1 mariandebonis  staff   5810 21 fév 11:36 PhobosEditorSettings
	-rw-r--r--  1 mariandebonis  staff   3458 21 fév 18:02 PhobosNewKind
	-rw-r--r--  1 mariandebonis  staff   3380 25 fév 08:52 PhobosSaveAndQuit
	
##### To run it

* Before the teste execution, start the Ares IDE node server: `node ide.js -T`
* Open ares-project/test/selenium/xml-scripts/AresTestSuite file *with* "Open Test Suite" menu entry
  
  **Note: ** AresTestSuite is composed by the following TestCases; HelloWorldPreview, NewProject, FileOps, CheckTemplates and HelloWorldPhoneGapSettings.
  
* To run AresTestSuite, click the `Run All` button (from the left of the IDE, 7th button) to run all the test cases in AresTestSuite, the currently loaded test suite.
* To run individually each TestCase, open it and click the "Play current testcase" (from the left of the IDE, 8th button).

### Your Contribution is required to extend the Selenium TestSuite for Ares

Give to the Ares committer(s) a chance to update the test wish list file (`./ares-project/test/selenium/WISH-TESTS-LIST.md`) with new Test Case to implement.

The objective is to test new controls coming with Ares pull-requests.

## 2- HOWTO execute the ARES TEST SUITE using Selenium 2.0 WEBDRIVER API

Main tasks:
* Ares Test Suite xml-scripts will be converted into Java files to use either Chrome or IE Selenium 2.0 webdriver APIs. 
* A patch needs to be applied to Java files to obtain the final Ares Test Suite java code. This patch is archived on Github
* Create AresConfig.xml to declare the Test Suite properties (i.e. webdriver name, webdriver path, os …). This XML file is not generated automatically by the formatter.

**WARNING:**

* Only xml-scripts, md5sum-file and AresTestJava.patch file are pushed on gitHub. 
* The Java code is not.
* Reasons are; expecting to find an XML to javascript Formatter and avoid two source code for the same test.

### XML to JAVA conversion 

* Open the xml-scripts in Selenium IDE (**Back to:**  Opening And Configuring the IDE),

* Export _each_ test case with JAVA/Junit 4/WEbDriver formatter and save the file under `./ares-project/test/selenium/webdriver-java-diff-patch/java-ref`
	
**Note:** For example, the NewProject test case will be converted into NewProject.java … etc.

The `.../webdriver-java-diff-patch/AresTestCases.md5` file contains the digests to validate the java files converted from XML scripts.

### Verify generated Java files

Depending on your system, use either `md5sum` to verify the md5 digests against the Java files converted from the XML scripts. This files are found under the temporary directory `./ares-project/test/selenium/webdriver-java-diff-patch/java-ref`.

### Apply AresTestJava.patch 

	$ cd ./ares-project/test/selenium/test/selenium/webdriver-java-diff-patch/java-ref
	$ patch -p1 < ../AresTestJava.patch


### Eclipse Ares Test Suite project setup

#### Eclipse Project Pre-requisites

Install the following softwares:

* JAVA jdk 1.6 (or upper) (<http://www.oracle.com/technetwork/java/javase/downloads/index.html>)
* Eclipse IDE for JAVA EE (<http://www.eclipse.org/downloads/>)
* TestNG plugin within eclipse (<http://testng.org/doc/download.html>)
* Chromedriver standalone server (<http://code.google.com/p/chromedriver/downloads/list>)
* InternetExplorerDriver standalone server for 64-bit IE (<http://code.google.com/p/selenium/downloads/list>)
* Selenium-java-2.30.0.zip java bindings (<http://code.google.com/p/selenium/downloads/list>)

#### Eclipse project setup

In Eclipse:

* create the Selenium Ares TestSuite java project
* create the AresTestSuite package,
* create src (java code) and resources (AresConfig.xml) sub-folders
* configure build-path; JRE system library and TestNG eclipse plugin
* configure the libraries build-path; add external jars retrieved from selenium-java-2.30.0.zip java bindings
* In `src/AresTestSuite`, import the patched java code located under `./ares-project/test/selenium/webdriver-java-diff-patch/java-ref` into the Ares TestSuite project
* In `resources/AresTestSuite`, create `AresConfig.xml` file. 

Here is one example of the AresConfig.xml, modify it to suit your setup:

	<?xml version="1.0" encoding="UTF-8"?>
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

#### TestNG suite setup

Create `testng.xml` file directly user AresTestSuite project:

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
                <class name="AresTestSuite.HelloWorldPhoneGapSettings">                </	class>
    </classes>
	</test>	
	<test name="AresTestSuite.PhobosDocumentLabel">
        <classes>
                <class name="AresTestSuite.PhobosDocumentLabel"></class>
        </classes>
	</test>
	<test name="AresTestSuite.PhobosEditorSettings">
        <classes>
                <class name="AresTestSuite.PhobosEditorSettings"></class>
        </classes>
	</test>
	<test name="AresTestSuite.PhobosNewKind">
        <classes>
                <class name="AresTestSuite.PhobosNewKind"></class>
        </classes>
	</test>
	<test name="AresTestSuite.PhobosSaveAndQuit">
        <classes>
                <class name="AresTestSuite.PhobosSaveAndQuit"></class>
        </classes>
	</test>
	</suite>

##### Execute the Ares TestNG TestCase

* In a terminal, start the Ares IDE node server: `node ide.js -T`
* Click right on src/AresTestSuite java file, &rarr; run as &rarr; TestNG Test

##### Execute the TestNG AresTesSuite

* In a terminal, start the Ares IDE node server: `node ide.js -T`
* Click right on src/testng.xml &rarr; run as &rarr; TestNG Suite
* The src/test-output/index.html file shows the results of the TestNG Test Suite execution after a refresh on src/test-output.


**Note:** 

* IE was tested on Windows, 
* Chrome was tested either on Windows and mac.


## Future Plan

* Switch on WebDriverJS (<https://code.google.com/p/selenium/wiki/WebDriverJs#WebDriverJS_User’s_Guide>)