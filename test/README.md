# Testing Ares

## Abstract

ARES2 is made of several compoennts, each of them needing a different test framework.  The objective of this page is to explain how each component is tested & how to enrich the test suite easily.

* **Ares IDE Server** is run in a nodejs process that forks several Node.js processes (also called services).
* Enyo **Components** are client side Javascript elements (Enyo Components kinds) without user interface.
* Enyo **Controls** are client-side UI elements

## Ares IDE Server test

We test *Server* elements using Node.js [Mocha](http://visionmedia.github.com/mocha/) test tool.  Several mocha test suites are aggregated into the top-level `ares.spec.js` script.

	$ cd ares-project/test/server
	$ ./ares.spec.js

Or (with `-v` or `--verbose`)…

	$ ./ares.spec.js -v

Or (Windows)…

	C:\Users\fxk\GIT\ares-project\test\server> node ares.spec.js

To run a specific test, use the `-g` (or `--grep`) command-line flag.  For example:

	$ ./ares.spec.js -g fsLocal

The complete set of flags is the sum of the `ares.spec.js`-specific flags and the `mocha` flags:

	$ ./ares.spec.js --help
	$ node_modules/mocha/bin/mocha --help

## Ares Components test

See [TestRunner](testrunner/README.md).

## Ares Controls test

See [Selenium](selenium/README.md).
