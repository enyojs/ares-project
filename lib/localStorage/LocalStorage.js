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
enyo.singleton({
	name: "Ares.LocalStorage",
	kind: enyo.Component,
	create: function() {
		this.inherited(arguments);
		this.isSupported();
		this.set = this.storageArea.set;
		this.get = this.storageArea.get;
		this.remove = this.storageArea.remove;
	},
	//* @public
	isSupported: function() {
		if (! this.storageArea) {
			if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
				this.storageArea = this.chromeStorageArea;
			} else if (window.localStorage) {
				this.storageArea = this.defaultStorageArea;
			} else {
				throw new Error("Ares demands some sort of localStorage");
			}
		}
		return this.storageArea;
	},
	storageArea: null,
	defaultStorageArea: {
		get: function(inKey, inCallback, self) {
			inCallback.bind(self)(window.localStorage.getItem(inKey));
		},
		set: function(inKey, inValue, inCallback, self) {
			window.localStorage.setItem(inKey, inValue);
			inCallback && inCallback.bind(self)();
		},
		remove: function(inKey, inCallback, self) {
			window.localStorage.removeItem(inKey);
			inCallback && inCallback.bind(self)();
		}
	},
	chromeStorageArea: {
		get: function(inKey, inCallback, self) {
			chrome.storage.local.get(inKey, function(outObj) {
				inCallback.bind(self)(outObj[inKey]);
			});
		},
		set: function(inKey, inValue, inCallback, self) {
			var inObj = {};
			inObj[inKey] = inValue;
			chrome.storage.local.set(inObj, function() {
				inCallback && inCallback.bind(self)();
			});
		},
		remove: function(inKey, inCallback, self) {
			chrome.storage.local.remove(inKey, function() {
				inCallback && inCallback.bind(self)();
			});
		}
	}
});
