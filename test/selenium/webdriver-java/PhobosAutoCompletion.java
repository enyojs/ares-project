package AresTestSuite;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriverService;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.Select;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class PhobosAutoCompletion {
	private static ChromeDriverService service;
	private static WebDriver driver;
	private Actions action = null;
	private static String baseUrl = null;
	private WebElement element = null;
	private static StringBuffer verificationErrors = new StringBuffer();
	private static Properties props = new Properties();

	@BeforeClass(description = "Driver start and Server start which creates a service that manage the driver server.")
	public static void StartDriver() throws FileNotFoundException, IOException {
		// load a properties file
		props.loadFromXML(new FileInputStream(
				"resources/AresTestSuite/AresConfig.xml"));
		
		System.out.println(props.getProperty("AresConfig.xml file:"));
		System.out.println("-> browserDriverPath -> "
				+ props.getProperty("browserDriverPath"));
		System.out.println("-> browserDriverName -> "
				+ props.getProperty("browserDriverName"));
		System.out.println("-> os -> " + props.getProperty("os"));
		
		// TODO: review browser and platform testability
		// IE on Windows only, Chrome tested on mac, FF tested using xml-scripts
		if ((props.getProperty("browserDriverName").equals("IE"))) {
			File file = new File(props.getProperty("browserDriverPath"));
			System.setProperty("webdriver.ie.driver", file.getAbsolutePath());
			DesiredCapabilities capabilities = DesiredCapabilities
					.internetExplorer();
			capabilities
					.setCapability(
							InternetExplorerDriver.INTRODUCE_FLAKINESS_BY_IGNORING_SECURITY_DOMAINS,
							true);
			driver = new InternetExplorerDriver(capabilities);

		} 
		
		if ((props.getProperty("browserDriverName").equals("Chrome"))) {
			// createAndStartService
			service = new ChromeDriverService.Builder()
					.usingDriverExecutable(
							new File(props.getProperty("browserDriverPath")))
					.usingAnyFreePort().build();
			service.start();
			// createDriver
			driver = new RemoteWebDriver(service.getUrl(),
					DesiredCapabilities.chrome());
		}
	}

	@AfterClass(description = "Driver quit and Server stop")
	public static void StopDriver() throws InterruptedException {
		Thread.sleep(3000);
		driver.quit();
		String verificationErrorString = verificationErrors.toString();
		if (!"".equals(verificationErrorString)) {
			fail(verificationErrorString);
		}
		if ((props.getProperty("browserDriverName").equals("Chrome"))) {
			Thread.sleep(3000);
			service.stop();
		}
	}

	@Test(description = "Get Ares URL; http://127.0.0.1:9009/ide/ares/test.html?debug=true&norunner=true")
	public static void testGetAresUrl() throws IOException {
		baseUrl = "http://127.0.0.1:9009/";
		driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
		driver.get(baseUrl + "ide/ares/test.html?debug=true&norunner=true");
		try {
			assertTrue(driver.findElement(By.cssSelector("BODY")).getText()
					.matches("^[\\s\\S]*Ares[\\s\\S]*$"));
		} catch (Error e) {
			verificationErrors.append(e.toString());
		}
		assertEquals("Ares", driver.getTitle());
	}

	@Test(description = "Test inserting a line into Phobos editor which means modify the ace-content")
	public void testPhobosLineAddition() throws Exception {
		System.out.println("**** import HelloWorld project");
		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectList_importProjectButton | ]]
		if ((element = getObject(".//*[@id='ares_projectView_projectList_importProjectButton']")) != null) {
			element.click();
			try {
				// Assert Text is Present - Ares Test - Home Directory
				assertTrue(driver
						.findElement(By.cssSelector("BODY"))
						.getText()
						.matches(
								"^[\\s\\S]*Ares Test - Home Directory[\\s\\S]*$"));
			} catch (Error e) {
				verificationErrors.append(e.toString());
			}
			Thread.sleep(1000);
		}

		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectWizardScan_providerList_item | Ares Test -
		// Home Directory]]
		if ((element = getObject(".//*[@id='ares_projectView_projectWizardScan_providerList_item']")) != null) {
			element.click();
			for (int second = 0;; second++) {
				if (second >= 60)
					fail("timeout");
				try {
					if ("root"
							.equals(driver
									.findElement(
											By.id("ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption"))
									.getText()))
						break;
				} catch (Exception e) {
				}
				Thread.sleep(1000);
			}
		}

		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption
		// | root]]
		if ((element = getObject(".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")) != null) {
			element.click();
			getObject(
					".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")
					.getAttribute("root");
			getObject(
					".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")
					.click();
			try {
				assertTrue(driver.findElement(By.cssSelector("BODY")).getText()
						.matches("^[\\s\\S]*HelloWorld[\\s\\S]*$"));
			} catch (Error e) {
				verificationErrors.append(e.toString());
			}
			Thread.sleep(1000);
		}

		
		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption
		// | ]]
		if ((element = getObject(".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")) != null) {
			element.click();
			getObject(
					".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")
					.getAttribute("root");
			getObject(
					".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_caption']")
					.click();
			try {
				assertTrue(driver.findElement(By.cssSelector("BODY")).getText()
						.matches("^[\\s\\S]*HelloWorld[\\s\\S]*$"));
			} catch (Error e) {
				verificationErrors.append(e.toString());
			}
			Thread.sleep(1000);
		}
		
		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// ares_projectView_projectWizardScan_hermesFileTree_serverNode_$HelloWorld_caption
		// | HelloWorld]]
		if ((element = getObject(".//*[@id='ares_projectView_projectWizardScan_hermesFileTree_serverNode_$HelloWorld_caption']")) != null) {
			element.click();
			for (int second = 0;; second++) {
				if (second >= 60)
					fail("timeout");
				try {
					if ("OK".equals(driver
							.findElement(
									By.id("ares_projectView_projectWizardScan_confirm"))
							.getText()))
						break;
				} catch (Exception e) {
				}
				Thread.sleep(1000);
			}
		}

		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectWizardScan_confirm | OK]]
		if ((element = getObject(".//*[@id='ares_projectView_projectWizardScan_confirm']")) != null) {
			element.click();
			for (int second = 0;; second++) {
				if (second >= 60)
					fail("timeout");
				try {
					if ("HelloWorld"
							.equals(driver
									.findElement(
											By.id("ares_projectView_projectList_projectList_ownerProxy_item"))
									.getText()))
						break;
				} catch (Exception e) {
				}
				Thread.sleep(1000);
			}
		}
		
		assertTrue(isElementPresent(By.id("ares_projectView_projectList")));
		// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
		// id=ares_projectView_projectList_projectList_ownerProxy_item | ]]
		if ((element = getObject(".//*[@id='ares_projectView_projectList_projectList_ownerProxy_item']")) != null) {
			element.click();
			// ERROR: Caught exception [ERROR: Unsupported command [clickAt |
			// id=ares_projectView_harmonia_hermesFileTree_serverNode_$source_caption
			// | ]]
			if ((element = getObject(".//*[@id='ares_projectView_harmonia_hermesFileTree_serverNode_$source_caption']")) != null) {
				if (props.getProperty("browserDriverName").equals("Chrome")) {
					// Issue 2766:	https://code.google.com/p/selenium/issues/detail?id=2766; Chrome - Element is not clickable at point
					// with Chrome...clicking the element works fine in firefox but not in Chrome...
					// WA: scroll the element into view before clicking it
					((JavascriptExecutor) driver).executeScript("window.scrollTo(0,"+element.getLocation().y+")");
				}
				element.click();
				Thread.sleep(1000);
				// ERROR: Caught exception [ERROR: Unsupported command [doubleClick |
				// id=ares_projectView_harmonia_hermesFileTree_serverNode_$source_$App.js_caption
				// | ]]
				driver.findElement(
						By.id("ares_projectView_harmonia_hermesFileTree_serverNode_$source_$App.js_caption"))
						.click();
			}
		}
	
		Thread.sleep(1000);
		// ERROR: Caught exception [ERROR: Unsupported command [doubleClick
		// |
		// id=ares_projectView_harmonia_hermesFileTree_serverNode_$source_$App.js_caption
		// | ]]
		if ((element = getObject(".//*[@id='ares_projectView_harmonia_hermesFileTree_serverNode_$source_$App.js_caption']")) != null) {
			element.click();
			action = new Actions(driver);
			action.doubleClick(element);
			action.perform();
			assertTrue(isElementPresent(By.cssSelector("div.ace_content")));
		}

        if ((element = getObject(".//*[@id='ares_phobos_ace_aceEditor']/textarea")) != null) {
        	WebElement saveElt = element;
            String str = "this.$.";
            element.clear();
            element.sendKeys(str);
            action = new Actions(driver);
            
            if ((props.getProperty("browserDriverName").equals("Chrome"))) {
                    int len = str.length();
                    char lastChar = str.charAt(len - 1);
                    action.keyDown(Keys.CONTROL)
                    	.sendKeys(String.valueOf(lastChar))
                    	.keyUp(Keys.CONTROL)
                    	.build()
                    	.perform();         
            }

            if ((props.getProperty("browserDriverName").equals("IE"))) {
                    action.keyDown(Keys.CONTROL)
                    .keyUp(Keys.CONTROL)
                    .build()
                    .perform();
            }
            
            if ((element = getObject(".//*[@id='ares_phobos_autocomplete_autocompleteSelect']")) != null) {
            	Select select = new Select(element);
            	List <WebElement> options = select.getOptions(); 
            	for (WebElement option: options) { 
            		if (option.getText().equals("hello")){ 
            			option.click();
            			saveElt.sendKeys(";" + Keys.RETURN);
            			break; 
            		} 
            	} 
            }
        }
	}
	
	private boolean isElementPresent(By by) {
		try {
			driver.findElement(by);
			return true;
		} catch (NoSuchElementException e) {
			return false;
		}
	}

	public WebElement getObject(String xpathKey) {
		WebElement elt = null;
		try {
			elt = driver.findElement(By.xpath(xpathKey));
			System.out.println("**** element: "+elt);
			return elt;
		} catch (Throwable t) {
			System.out.println("**** cannot find object with key--" + xpathKey);
			return null;
		}
	}
	
	public void queryObjectVisible(String byName, String byCss, String byxPath) {
		
		 System.out.println("Je suis dans queryObjectVisible");
		
		// Enter the query string 
        WebElement query = driver.findElement(By.name(byName));
        System.out.println("byName: "+ query);
        
        // Sleep until the div we want is visible or 5 seconds is over
        long end = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < end) {
            WebElement resultsDiv = driver.findElement(By.className(byCss));
            // If results have been returned, the results are displayed in a drop down.
            if (resultsDiv.isDisplayed()) {
              System.out.println("byCss is Displayed: "+ resultsDiv);
              break;
            }
        }
        
        // And now list the suggestions
        List<WebElement> allSuggestions = driver.findElements(By.xpath(byxPath));	        
        for (WebElement suggestion : allSuggestions) {
            System.out.println("byxPath: "+ suggestion.getText());
        }
	}
}
