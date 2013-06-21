/* global chrome */

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
			var outValue = window.localStorage.getItem(inKey);
			if (inCallback) {
				var fn = (self ? enyo.bind(self, inCallback) : inCallback);
				fn(outValue);
			}
		},
		set: function(inKey, inValue, inCallback, self) {
			window.localStorage.setItem(inKey, inValue);
			if (inCallback) {
				var fn = (self ? enyo.bind(self, inCallback) : inCallback);
				fn();
			}
		},
		remove: function(inKey, inCallback, self) {
			window.localStorage.removeItem(inKey);
			if (inCallback) {
				var fn = (self ? enyo.bind(self, inCallback) : inCallback);
				fn();
			}
		}
	},
	chromeStorageArea: {
		get: function(inKey, inCallback, self) {
			var fn = (self ? enyo.bind(self, inCallback) : inCallback);
			chrome.storage.local.get(inKey, function(outObj) {
				fn(outObj[inKey]);
			});
		},
		set: function(inKey, inValue, inCallback, self) {
			var fn, inObj = {};
			if (inCallback) {
				fn = (self ? enyo.bind(self, inCallback) : inCallback);
			}
			inObj[inKey] = inValue;
			chrome.storage.local.set(inObj, fn);
		},
		remove: function(inKey, inCallback, self) {
			var fn;
			if (inCallback) {
				fn = (self ? enyo.bind(self, inCallback) : inCallback);
			}
			chrome.storage.local.remove(inKey, fn);
		}
	}
});
