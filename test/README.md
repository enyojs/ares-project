# Testing Ares

## Abstract

ARES2 is made of several element classes, each of them needing a different test framework.  The objective of this page is to explain how each of the classes are tested & how to enrich the test suite easily.

* **Server** elements run into the so-called *IDE Server* or one of its child Node.js processes (also called services).
* Enyo **Components** are head-less (chrome-less) client side Javascript elements (Enyo Components kinds)
* Enyo **Controls** are client-side UI elements

## Server

We test *Server* elements using the Node.js [Mocha](http://visionmedia.github.com/mocha/) test tool.  Several moch test suites are aggregated into the top-level `ares.spec.js` script.

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

## Components

See [TestRunner](testrunner/README.md).

## Controls

See [Selenium](selenium/README.md).