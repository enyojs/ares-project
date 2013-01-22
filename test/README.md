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

Or (verbose)…

	$ ./ares.spec.js -v

Or (Windows)…

	C:\Users\fxk\GIT\ares-project\test\server> node ares.spec.js

## Components

See [TestRunner](testrunner/README.md).

## Controls

TBC (reference to a *Selenium* README.md).