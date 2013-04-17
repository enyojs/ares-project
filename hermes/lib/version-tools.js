/*
	Stick to a synchronous version although this is not recommended.
	However this check is done only by the process ide.js at startup time.
 */

var  semver = require('semver'),
	fs = require('fs');

(function () {

	var vtools = {};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = vtools;
	}

	var pkgInfo = null;
	var loggr = null;

	vtools.setLogger = function(log) {
		logger = log;
	};

	vtools.showVersionAndExit = function() {
		console.log("Version: " + getPackageVersion());
		process.exit(0);
	};

	vtools.checkNodeVersion = function() {
		var range = getAllowedNodeVersion();
		var expectedRange = semver.validRange(range);
		if (expectedRange) {
			if (semver.satisfies(process.version, expectedRange)) {
				return;			// That's fine
			} else {
				logger.error("Ares ide.js only works on Node.js version: " + expectedRange);
				process.exit(1);
			}
		} else {
			logger.error("Invalid Node.js version range: " + range);
			process.exit(1);
		}
	};

	// Private methods

	function getAllowedNodeVersion() {
		if ( ! pkgInfo) {
			loadPackageJson();
		}
		return (pkgInfo && pkgInfo.engines && pkgInfo.engines.node) || "";
	}

	function loadPackageJson() {
		if ( ! pkgInfo) {
			var filename = 'package.json';
			try {
				var data = fs.readFileSync(filename);
				pkgInfo = JSON.parse(data);
			} catch(error) {
				logger.error("Unable to read " + filename);
				process.exit(1);
			}
		}
	}

	function getPackageVersion() {
		if ( ! pkgInfo) {
			loadPackageJson();
		}
		return (pkgInfo && pkgInfo.version) || "unknown";
	}

}());

