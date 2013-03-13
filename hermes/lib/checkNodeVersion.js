(function() {

	var version = process.version.match(/v([0-9]+).([0-9]+)/);
	if (version[1] != 0 || version[2] < 8 || version[2] > 8) {
		console.error("Ares ide.js is only supported on Node.js version 0.8.x");
		process.exit(1);
	}

})();
