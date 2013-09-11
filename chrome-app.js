/* global chrome, console */
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
chrome.app.runtime.onLaunched.addListener(function(intent) {
	var file;

	// App Launched
	console.log("launched, intent=");
	console.dir(intent);
	if (intent) {
		file = intent.data;
		console.error("file intents not implemented");
	} else {
		console.log("stating from scratch...");
		chrome.tabs.create({
			url: "ares/index.html",
			active: true
		}, function(tab) {
			console.log("launched, tab=");
			console.dir(tab);
		});
	}
});

chrome.runtime.onInstalled.addListener(function() {
	// setup db
	console.log("installed");
});

chrome.runtime.onSuspend.addListener(function() {
	// close open connections
	console.log("page closing...");
});

