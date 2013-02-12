# Selenium Exploration for Ares
## Introduction
* Selenium is a suite of tools to automate web browsers across different platforms; <http://http://seleniumhq.org/>
* Test scripts written with Selenium are portable. They can be run from browsers (using Selenium IDE) or from TestNG (using Selenium RC).
* Selenium is composed by the following main components:
	1. Selenium IDE (FF plugin) which is used to record testcase, based on manual interactions with the browser; <http://seleniumhq.org/download/>
	2. Selenium Remote Controler (RC) which executes instructions fired by the Selenium testcases against the native browsers (IE, FF, Safari …); <http://seleniumhq.org/download/>
	3. TestNG (Junit/Nunit based) which is a unit testing framwwork toolkit; <http://testng.org/doc/index.html>
	4. JDK (as Selenium is not sticked to one programing language - testcases can be written in .net, perl, java …); <http://www.oracle.com/technetwork/java/javase/downloads/index.html>
	
## Prerequisite

* Selenium IDE FF plugin
* Eclipse IDE; <http://www.eclipse.org/downloads/>
* Sun JDK 1.6 or above
* TestNG 5
* Eclipse TestNG plugin

##### Selenium IDE FireFox plugin

* Under FF>Tools>Add-ons; Search and install for available Selenium IDE add-ons.

##### Eclipse IDE
* Create an eclipse java project to run Selenium TestSuites. 
* Configure build path with the following external jars:

		selenium-java-client-driver-1.0.1.jar (interact with the Selenium Server RC)
		testng-5.jar
		selenium-java-testng-helper-1.0.1.jar

##### TestNG 5
* ant installation as prerequisite

		$ sudo port install apache-ant		
* TestNG is hosted on GitHub

		$ git clone git://github.com/cbeust/testng.git
		$ cd testng
		$ cp ivy-2.1.0.jar ~/.ant/lib
		$ ant
The testng-5.jar file in the target director.

##### Eclipse TestNG plugin
* Eclipse plug-in

		Select Help / Install New Software ...
		Enter http://beust.com/eclipse.
		Eclipse will then guide through the process.
		
##### selenium-java-client-driver
* Provides the Selenium Java Client Driver classes.These classes are intended to be used together with the Selenium Server.
* To download from Maven Central Repository

		<http://search.maven.org/#search%7Cga%7C1%7C
		
##### 

* To download from Maven Central Repository

		<http://search.maven.org/#search%7Cga%7C1%7C>
			
## How to build a testcase scenario

##### Ares URL launch Example
* The following 4 testcases represent 1 Test Suite

		1. Launches the http://127.0.0.1:9009/ide/ares/index.html?debug=true"
		2. Wait for Page Load
		3. Get the Title of the Page loaded
		4. Assert the title is Ares

##### Script created using Selenium IDE
* Open <http://127.0.0.1:9009/ide/ares/index.html?debug=true">
* Start Selenium IDE from Firefox Tools->Selenium IDE. 
* Click red button to start recording
* Scripting is a pair of command/target

		1. open /ide/ares/index.html?debug=true
		2. waitForPageToLoad 30000
		3. verifyTextPresent Ares
		4. assertTextPresent Ares
* Now click red button to stop recording.
* Export the test script as java file by Selenium IDE File->Export Test As->Java - Selenium RC 
* Then close your Firefox Selenium ID.

##### Run the generated TestNG Java code in Eclipse IDE
###### PreReq: start Selenium RC server
* Allows to develop test cases and test suites in Java (supports JUnit & NGUnit), PHP, Ruby, Python, Perl and even .NET. 
* Downloaded from Maven Central Repository	
* Start Selenium RC server

		java -jar selenium-server-standalone-2.25.0.jar

		Output:
			Dec 20, 2012 6:43:41 AM org.openqa.grid.selenium.GridLauncher main
			INFO: Launching a standalone server
			06:43:46.794 INFO - Java: Apple Inc. 20.12-b01-434
			06:43:46.796 INFO - OS: Mac OS X 10.8.2 x86_64
			06:43:46.803 INFO - v2.25.0, with Core v2.25.0. Built from revision 17482
			06:43:46.915 INFO - RemoteWebDriver instances should connect to: http://127.0.0.1:4444/wd/hub
			06:43:46.916 INFO - Version Jetty/5.1.x
			06:43:46.917 INFO - Started HttpContext[/selenium-server/driver,/selenium-server/driver]
			06:43:46.917 INFO - Started HttpContext[/selenium-server,/selenium-server]
			06:43:46.918 INFO - Started HttpContext[/,/]
			06:43:46.968 INFO - Started org.openqa.jetty.jetty.servlet.ServletHandler@6542bece
			06:43:46.969 INFO - Started HttpContext[/wd,/wd]
			06:43:46.977 INFO - Started SocketListener on 0.0.0.0:4444
			06:43:46.977 INFO - Started org.openqa.jetty.jetty.Server@690da5eb

###### Java code generated 
* Create a TESTNG class with 

			@Test (description="Launches the http://127.0.0.1:9009/ide/ares/index.html?debug=true")
			public void launchAresTestCase() throws Exception {
				selenium.open("http://127.0.0.1:9009/ide/ares/index.html?debug=true");
				selenium.waitForPageToLoad("30000");
				assertEquals(selenium.getTitle(), "Ares");
			}
* Click right run as TestNG
* Console output: 

			[TestNG] Running:
  			/private/var/folders/bs/kh34y13d0p7d1hjf0v1d_9zh0000gq/T/testng-eclipse-187538220/testng-customsuite.xml
 			PASSED: launchAresTestCase
        	Launches the http://127.0.0.1:9009/ide/ares/index.html?debug=true
        	

* Tests ares executed against FF browser
* Selenium RC server output:

		15:00:00.355 INFO - Command request: getNewBrowserSession[*firefox, http://localhost:4444, ] on session null
		15:00:00.356 INFO - creating new remote session
		15:00:00.356 INFO - Allocated session 2a63d984795c4349883847c7908ef4fd for http://localhost:4444, launching...
		jar:file:/Users/mariandebonis/Desktop/GIT/ares-project/selenium/utils/selenium-server-standalone-2.25.0.jar!/customProfileDirCUSTFFCHROME
		15:00:00.403 INFO - Preparing Firefox profile...
		15:00:01.468 INFO - Launching Firefox...
		15:00:04.426 INFO - Got result: OK,2a63d984795c4349883847c7908ef4fd on session 2a63d984795c4349883847c7908ef4fd
		15:00:04.439 INFO - Command request: setContext[TipCalcTestCase.launchAresTestCase, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:04.448 INFO - Got result: OK on session 2a63d984795c4349883847c7908ef4fd
		15:00:04.477 INFO - Command request: open[http://127.0.0.1:9009/ide/ares/index.html?debug=true, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.734 INFO - Got result: OK on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.736 INFO - Command request: waitForPageToLoad[30000, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.765 INFO - Got result: OK on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.767 INFO - Command request: getTitle[, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.776 INFO - Got result: OK,Ares on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.789 INFO - Command request: selectWindow[null, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.817 INFO - Got result: OK on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.820 INFO - Command request: testComplete[, ] on session 2a63d984795c4349883847c7908ef4fd
		15:00:05.820 INFO - Killing Firefox...
		15:00:05.936 INFO - Got result: OK on session 2a63d984795c4349883847c7908ef4fd