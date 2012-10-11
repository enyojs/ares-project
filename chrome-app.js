/**
 * chrome-app.js
 */
document.addEventListener('DOMContentLoaded', function() {
	console.log('DOMContentLoaded');
	var iframe = document.getElementById('aresFrame');
	iframe.contentWindow.postMessage({hello: "chrome-app says hello!"}, '*');
	window.addEventListener('message', function(msg) {
		console.dir(msg);
	});
});

var storageArea = {
	get: function(inKey, inCallback) {
		chrome.storage.local.get(inKey, function(outObj) {
			inCallback(outObj[inKey]);
		});
	},
	set: function(inKey, inValue, inCallback) {
		var inObj = {};
		inObj[inKey] = inValue;
		chrome.storage.local.set(inObj, inCallback);
	},
	remove: function(inKey, inCallback) {
		chrome.storage.local.remove(inKey, inCallback);
	}
};

var fileSystem = {};

