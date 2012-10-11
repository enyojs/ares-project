/**
 * Ares index.js
 */

console.log("chromeApp=");
console.dir(window.chromeApp);

// enyo.script("package.js", function(src) {
//         console.log("async-loaded: '" + src + "'");
// 	enyo.load(["package.js"] /*depends*/, function(dep) {
// 		console.log("Finished loading..." + dep);
// 		new Ares().renderInto(document.body);
// 	});
// });

if (window.chrome) {
	console.log("Using async Enyo loader");
	enyo.load(["package.js"] /*depends*/, function(dep) {
		console.log("Finished loading..." + dep);
		new Ares().renderInto(document.body);
	});
} else {
	console.log("Using sync Enyo loader");
	new Ares().write();
}
