/**
 * Enyo wrapper around client key-value stores
 * 
 * Wrapping API is a single single-key/single-value asynchronous API.
 * It wrapps the single-key/single-value synchronous HTML5 API and the
 * multi-key/multi-value Google Chrome / Chromium asynchronous API.
 * 
 * @see <a href="http://www.html5rocks.com/en/tutorials/offline/storage/"HTML5Rocks - Client-Side Storage</a>
 * @see <a href="http://developer.chrome.com/trunk/apps/storage.html">chrome.storage</a>
 */
enyo.kind({
	name: "LocalStorage",
	kind: enyo.Component,
	create: function() {
		this.inherited(arguments);
		this.isSupported();
		this.set = LocalStorage.storageArea.set;
		this.get = LocalStorage.storageArea.get;
		this.remove = LocalStorage.storageArea.remove;
	},
	//* @public
	isSupported: function() {
		if (!LocalStorage.storageArea) {
			if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
				LocalStorage.storageArea = LocalStorage.chromeStorageArea;
			} else if (window.localStorage) {
				LocalStorage.storageArea = LocalStorage.defaultStorageArea;
			} else {
				throw new Error("Ares demands some sort of localStorage");
			}
		}
		return LocalStorage.storageArea;
	},
	statics: {
		storageArea: null,
		defaultStorageArea: {
			get: function(inKey, inCallback) {
				inCallback(window.localStorage.getItem(inKey));
			},
			set: function(inKey, inValue, inCallback) {
				window.localStorage.setItem(inKey, inValue);
				if (inCallback) {
					inCallback();
				}
			},
			remove: function(inKey, inCallback) {
				window.localStorage.removeItem(inKey);
				if (inCallback) {
					inCallback();
				}
			}
		},
		chromeStorageArea: {
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
		}
	}
});
