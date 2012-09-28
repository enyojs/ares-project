/**
 * Ares Chrome Packaged Application Background Page
 * 
 * ares/ares-chrome-background.js
 */

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.tabs.create({
		url: "ares/index.html",
		active: true
	}, function(tab) {
		console.dir(tab);
	});
});
