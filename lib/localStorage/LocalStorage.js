enyo.kind({
	name: "LocalStorage",
	kind: enyo.Component,
	//* @public
	isSupported: function() {
		return window.localStorage;
	},
	get: function(inKey) {
		return window.localStorage.getItem(inKey);
	},
	put: function(inKey, inValue) {
		window.localStorage.setItem(inKey, inValue);
	},
	remove: function(inKey) {
		window.localStorage.removeItem(inKey);
	}
});
