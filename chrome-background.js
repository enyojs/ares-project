/**
 * Ares Chrome Packaged Application Background Page
 * 
 * ares/ares-chrome-background.js
 */

/**
 * Start and Open file handler
 * 
 * http://developer.chrome.com/trunk/apps/app_intents.html#launching
 * 
 * % chrome.exe --app-id [app_id] [path_to_file]
 * 
 * This will implicity launch your application with an intent payload
 * populated with the action set to "http://webintents.org/view", the
 * type set to the mime-type of the file and the data as a FileEntry
 * object.
 */
chrome.app.runtime.onLaunched.addListener(function(launchIntent) {
	console.log("launched, intent=");
	console.dir(launchIntent);
	chrome.app.window.create(/*"chrome-app.html"*/ "ares/index.html", {
		id: 'Ares',
		width: 1024,
		height: 600
	}, function(win) {
		console.log("window created, win=");
		console.dir(win);
		win.contentWindow.chromeApp = {
			launchIntent: launchIntent,
			window: window
		};
	});
});

chrome.runtime.onInstalled.addListener(function() {
	// setup db
	console.log("installed");
});

chrome.runtime.onSuspend.addListener(function() {
	// close open connections
	console.log("page closing...");
});
