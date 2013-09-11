/* jshint node:true */
/*
	Stick to a synchronous version although this is not recommended.
	However this check is done only by the process ide.js at startup time.
 */

var  semver = require('semver'),
	path = require('path'),
	fs = require('fs');

(function () {

	var vtools = {};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = vtools;
	}

	var pkgInfo = null;
	var logger = null;

	/**
	 * Set the npmlogger for the module
	 * @param log: an npm logger
	 */
	vtools.setLogger = function(log) {
		logger = log;
	};

	/**
	 * Display the version extracted from the
	 * property "version" of the package.json.
	 * Perform a process.exit()
	 * @public
	 */
	vtools.showVersionAndExit = function() {
		console.log("Version: " + getPackageVersion());
		process.exit(0);
	};

	/**
	 * Checks the version of nodejs against the allowed
	 * version in package.json in property "engines".
	 * 
	 * @return none
	 * @public
	 */
	vtools.checkNodeVersion = function() {
		var range = getAllowedNodeVersion();
		logger.info("Allowed Node.js version range:", range);
		var expectedRange = semver.validRange(range);
		logger.info("Interpreted Node.js version range:", expectedRange);
		logger.info("Actual Node.js version:", process.version);
		if (expectedRange) {
			if (semver.satisfies(process.version, expectedRange)) {
				return;			// That's fine
			} else {
				logger.error("Ares ide.js only works on Node.js version:", expectedRange);
				process.exit(1);
			}
		} else {
			logger.error("Invalid Node.js version range:", range);
			process.exit(1);
		}
	};

	/**
	 * Get the allowed nodejs 
	 * version in package.json in property "engines".
	 * @return the range of allowed nodejs versions
	 * @private
	 */
	function getAllowedNodeVersion() {
		if ( ! pkgInfo) {
			loadPackageJson();
		}
		return (pkgInfo && pkgInfo.engines && pkgInfo.engines.node) || "";
	}

	/**
	 * Load and parse the package.json from
	 * the current working directory.
	 * 
	 * @return nothing but the variable pkgInfo is set
	 * @private
	 */
	function loadPackageJson() {
		if ( ! pkgInfo) {
			var filename = path.resolve(__dirname, "..", "..", "package.json");
			try {
				var data = fs.readFileSync(filename);
				pkgInfo = JSON.parse(data);
			} catch(error) {
				logger.error("Unable to read " + filename);
				process.exit(1);
			}
		}
	}

	/**
	 * Get the version from the package.json file
	 * in the current working directory.
	 * @return version
	 * @private
	 */
	function getPackageVersion() {
		if ( ! pkgInfo) {
			loadPackageJson();
		}
		return (pkgInfo && pkgInfo.version) || "unknown";
	}

}());

