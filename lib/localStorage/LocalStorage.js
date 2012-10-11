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
		console.dir(chrome);
		if (!LocalStorage.storageArea) {
			LocalStorage.storageArea = LocalStorage.selectStorageArea();
			// window.addEventListener('message', function(event) {
			// 	console.dir(event);
			// });
			this.log(LocalStorage.storageArea);
		}
		return LocalStorage.storageArea;
	},
	statics: {
		storageArea: null,
		selectStorageArea: function() {
			var sa;
			if (window.location.protocol.match('^http')) {
				// Hosted application: our page is
				// served over http*
				if (window.localStorage) {
					sa = new LocalStorage.factory.Html5;
				} else {
					throw new Error("No HTML5 localStorage:  Your browser is too old to run Ares");
				}
			} else if (window.location.protocol ==='chrome-extension:') {
				// Chrome extension or packaged-app
				if (chrome && chrome.storage && chrome.storage.local) {
					// In an extension page or a
					// non-sandboxed page of a
					// packaged-app
					sa = new LocalStorage.factory.Chrome();
				} else if (chrome && !chrome.storage) {
					// In a sandboxed page of a
					// packaged app
					sa = new LocalStorage.factory.ChromeSandbox();
				} else {
					this.error("No usable Chrome localStorage");
				}
			}
			if (!sa) {
				throw new Error("No usable localStorage");
			} else {
				return sa;
			}
		},
		factory: {
			Html5: function() {
				this.type = "html5";
				this.get = function(inKey, inCallback) {
					inCallback(window.localStorage.getItem(inKey));
				};
				this.set = function(inKey, inValue, inCallback) {
					window.localStorage.setItem(inKey, inValue);
					if (inCallback) {
						inCallback();
					}
				};
				this.remove = function(inKey, inCallback) {
					window.localStorage.removeItem(inKey);
					if (inCallback) {
						inCallback();
					}
				};
			},
			ChromeSandbox: function() {
				var app;
				window.addEventListener('message', function(msg) {
					console.dir(msg);
					if (msg.data && msg.data.area) {
						app = msg.source;
					}
				});
				this.type = "chromeSandbox";
				this.get = function(inKey, inCallback) {
					app && app.postMessage({area: "storageArea", op: "get"}, '*');
				};
				this.set = function(inKey, inValue, inCallback) {
					app && app.postMessage({area: "storageArea", op: "set"}, '*');
				};
				this.remove = function(inKey, inCallback) {
					app && app.postMessage({area: "storageArea", op: "remove"}, '*');
				};
			},
			Chrome: function() {
				this.type = "chrome";
				this.get = function(inKey, inCallback) {
					chrome.storage.local.get(inKey, function(outObj) {
						inCallback(outObj[inKey]);
					});
				};
				this.set = function(inKey, inValue, inCallback) {
					var inObj = {};
					inObj[inKey] = inValue;
					chrome.storage.local.set(inObj, inCallback);
				};
				this.remove = function(inKey, inCallback) {
					chrome.storage.local.remove(inKey, inCallback);
				};
			}
		}
	}
});
