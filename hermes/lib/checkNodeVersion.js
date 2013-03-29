(function() {

	var version = process.version.match(/v([0-9]+).([0-9]+).([0-9]+)/);
	if (version[1] != 0 || version[2] < 8 || version[2] > 8 || version[3] < 21) {
		console.error("Ares ide.js only works on Node.js version 0.8.x >= 0.8.21");
		process.exit(1);
	}

})();
