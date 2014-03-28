Contribute to Ares
==================

The master version of this page is located [here](https://github.com/enyojs/ares-project/blob/master/CONTRIBUTE.md).

Basic architecture
------------------

The Ares project architecture is divided into several main pieces:

* **Ares** - The front-end designer/editor web application, with the following main components:
	* **Harmonia** - Client-side Ares system layer, communicating with the server-side _Hermes_ components.
	* **Phobos** - Code editor
	* **Deimos** - Visual designer
    * **Hermes** - Server-side Ares system layer.  Pluggable server-side components that provide interfaces to Ares clients for cloud-based services such as file storage and build services.  We're using node.js, but Hermes components can use any server-side technology.
* **Ares plugins** - Based on Hermes pluggable server-side components, Ares plugins can bring:  
  * New server-side services with their own configuration
  * The corresponding browser side code that will be loaded into the Ares IDE  
See [Ares plugins](README.md#ares-plugins) for more details.

```
source/*            Multi-Project View
├── enyo-editor     File Editor
│   ├── deimos      Drag-n-Drop Designer
│   └── phobos      Code Editor
├── harmonia        Access to Ares Server (ide.js) Services
│   └── services
├── project-view    Single-Project View
└── utilities       As it says...
```

Real stuff - Code
-----------------

### Setup a developement environment

1. Install Node.js & NPM 0.10.x.  Preferably from the [Official Download Page](http://nodejs.org/#download).
1. Install git (or a graphical git client).  See the [Github.com help](https://help.github.com/articles/set-up-git) for hints
1. Pick a GitHub account

**Fresh workspace**, in case you do not yet have a development environment:

1. Clone the ares-project repository from GitHub.  Using git, clone the repository using either the HTTPS or SSH urls (depending on how you have setup Git):

		$ git clone --recursive git@github.com:enyojs/ares-project.git		
		
   If you are using a graphical Git client, there may or may not be a way to update the submodules from the GUI. If not, then use the commands above.

1. Install NPM developpment dependencies
   
		$ cd ares-project
		$ npm -d install
		$ npm run-script minify # trigger the minification

1. Run Ares using `node ide.js --dev-mode` from the GitHub root folder (`--dev-mode` to avoid using the minified version of Ares)

	**Update workspace** if you already have a working environment (with a remote named `origin`), run the following sequence.

		$ git fetch origin
		$ git submodule foreach git fetch origin
		$ git merge origin/master
		$ git submodule update --init  --recursive
		$ npm -d install						# Be sure to run "git submodule update ..." before "npm install"
		$ npm run-script minify # trigger the minification	

	**Note:** 

1. Until recently, `ares-project/node_modules` contained 3rd-party modules directly archived into `ares-project` own Git repository.  So existing repository owners _may_ need to run `rm -rf ares-project/node_modules` to properly update their trees.

#### Some Git+NPM Automation Examples

The [contrib directory](contrib/githooks) contains git hooks that you can install:

* [npm-install](contrib/githooks/post-checkout/npm-install) to be copied as `.git/hooks/post-checkout`. This hook will run `npm -d install` after each `git checkout`. This hook requires bash shell.
* [prepend-branch-name](contrib/githooks/prepare-commit-msg/prepend-branch-name) to be copied as `.git/hooks/prepare-commit-msg`. This hook will prepend the branch name (i.e. `ENYO-1234:`) in front of commit messages. This hook requires Perl.

### Coding

Ares 2 is part of the EnyoJS ecosystem.  Before contributing code to Ares or Enyo, you want to read the [Contributors Guide](http://enyojs.com/community/contribute/).  Source-code contributions to the core Ares code are expected to follow the [Enyo Style Guide](https://github.com/enyojs/enyo/wiki/Style-Guide).

#### Jshint

Ares 2 is now integrated with [Travis CI](https://travis-ci.org/) to automatically run [JSHint](http://www.jshint.com/) when pull-requests are submitted.

Before submitting a pull request, please follow these steps

	$ cd ares-project
	$ npm test
	
NOTE: JSHint configuration files (.jshintrc, …) are automatically loaded by some editors when the appropriate plugins are installed. See [JSHint - Plugins for text editors and IDEs](http://www.jshint.com/install/)

#### Tracing

Following the setup of jshint we had a lot of warning because of missing curly braces as most of the traces were in the form of:

	if (this.debug) this.log(...);

Instead of adding curly braces and going from one line to three lines for each trace, we decided to add a `this.trace()` function which references this.log() or a "NOP" function depending on `this.debug` boolean value.

`To setup this.trace() function`, add the following in the create method of the kind.

	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		
		this.trace("Just created a new", this.name, "object", this);
	}

NB: if your file contains several kinds, each related "create" method must be modified if required (of course).

Do not forget to add at the beginning of each file a reference to the global variable "ares": `/*global ares */`

Do not forget to add to your kind `debug:true` if you want to print the trace.

You can then directly call this.trace() in the same way this.log is used.

WARNING: Calling `this.trace` can add CPU overhead. Overhead is high when:
* concataining objects and  strings (objects are stringified even if `this.debug` is false)
* invoking functions in the "`this.trace()`", e.g. `this.trace(this.getStuff())`;

So, it's recommended to pass each string element as a parameter instead of concataining them with "+" operator.

`this.debug` is still available and can be used when the parameters of `this.trace` calls are complex.

NOTE: For production, we may suppress the "this.trace()" code when doing the minification process.

### Ares styling

Ares 2 uses the dynamic stylesheet language LESS.

For the moment, all css compilation is done on the client side and is loaded through index.html.

We are waiting for ares minification to make possible using Ares.less on the client side in debug.html and compiled Ares.css file in index.html.

### Adding css/less styling

We have two main .less files :
	
	- ares-variables.less
	- ares-rules.less

In ares-variables.less, onyx variables are overridden and specific ares variables are added.

In ares-rules.less onyx css classes and specific ares css classes use variables declared in ares-variables.less.

To add new style to Ares, the file ares-rules.less should contain the new css classe. Check if one of variables can be used from ares-variables.less. Otherwise, add a new one.

For more information see [this page](https://github.com/enyojs/enyo/wiki/UI-Theming).

###Translating

Ares 2 uses enyo-ilib (enyo wrapper of ilib library) to insure the translation of the application.
Enyo-ilib allows to create several translation bundles to cover separately different parts of the application.
Translation resources are ".json" files containing a set of reference entries and their related translation.
Translation resources are managed according to an hierarchy which determine which translations must be applied.
> See [ilib website](http://www.jedlsoft.com/) about translation resources hierarchy.

**Translation resources are available in assets folders:**
```
$assets
├── enyo-editor
│   ├── deimos
│   │   └── resources: Deimos specific translations
│   └── phobos
│       └── resources: Phobos specific translations
├── harmonia
│   ├── resources: Harmonia specific translations
│   └── services
│       └── phonegap
│           └── resources: PhoneGap Build specific translations (autonomous definition to anticipate a PhoneGap Build plugin)
├── project-view
│   └── resources: ProjectView specific translations
├── resources: Ares main translations
└── utilities
    └── resources: Ares secondary (utilities widgets specific) translations
```

Several translation bundles are used to concentrate close translation domains and reduce amount of translation entries in each tranlation resources.

**Languages available are:**
* english (per default)
* fr (french)
* kr (korean)

**Language selection:**
In ide.json, there's a 'language' entry used to force a specific language ("en" per default, another code instead) or to let Ares using the navigator's language (null).
Don't forget to restart Ares to take changes in account...
> *NB:* when minified, forced language is not used see [KNOWN-BUGS.md](KNOWN-BUGS.md).

### Testing

For all contributions on Ares project and before commit, please execute the available Ares Test Suite. See [this page](test/README.md) for more details.



Build an Ares package
---------------------

In order to produce a minified Ares on a build server:

1. Make sure Node and NPM are installed on the build server.  Version >=0.8.21 is known to work
1. In the build script, run:

		$ npm pack

	This produces a package like the below:
  
		$ tar tzvf ares-0.0.2.tgz | less
		
		-rw-r--r--  0 506    20       1496 Mar  6 13:48 package/package.json
		-rw-r--r--  0 506    20       6004 Mar  6 14:11 package/README.md
		-rwxr-xr-x  0 506    20      10397 Mar  6 14:12 package/ide.js
		-rw-r--r--  0 506    20         74 Jun 18  2012 package/deimos/package.js
		[…]

	You can then un-gzip & un-tar before repacking with a different folder name than `package/` & re-pack with your prefered packaging tool.
1. You may optionally test that the NPM-generated package works.  The following sequence is supposed to successfully install Ares from the generated package & start Ares.

		$ mkdir ../test && cd ../test
		$ npm install ../ares-project/ares-ide-0.0.2.tgz
		$ node_modules/.bin/ares-ide

1. Whatever the packaging/re-packaging option you choose, make sure you clean-up `_ares` folder created by the `npm run-script minify` stage that is built-in `npm pack`.

		$ npm run-script postpublish

Release & Publish Ares
----------------------

_This section is only for Ares commiters or developers of build scripts_

**Before publishing** a few steps and checkings are mandatory:

1. Preferably use a Linux machine or VM
   * Publishing from a Windows machine will break UNIX (Linux & OSX) installations [NPM Issue 2097](https://github.com/isaacs/npm/issues/2097)
   * Packing from an OSX machine misses some files [NPM Issue 2619](https://github.com/isaacs/npm/issues/2619)2. Run `./scripts/release.js --dry-run pre-dist` (Windows: `node scripts\release.js --dry-run pre-dist`).
   1. See `./scripts/release.js --help` for usage details
3. Run `./scripts/release.js pre-dist` (Windows: `node scripts\release.js pre-dist`) to generate an NPM package named `ares-ide-M.m.p-pre.R`
4. Destroy this version from your `ares-ide` NPM cache (OSX/Linux: `$HOME/.npm/ares-ide/M.m.p-pre.R`, Windows: `% APPDATA\npm-cache\ares-ide\M.m.p-pre.R`)
5. Test on several platforms, using the same `.tgz`file.
	1. In a temporary directory, execute `npm install <path-to>/ares-ide-<version>.tgz` to verify that the generated .tgz file if correct.
	2. Perform some tests to verify that everything works.
4. If you have last minutes changes, commit them directly on `master` & upload them.
   * If you did changes, re-run `./scripts/release.js pre-dist`

**Publishing:**

1. Tag the version you intend to publish, with the exact same string as the `version: ` in `package.json` & upload this tag.
   * Using the helper script:

			$ ./scripts/release.js --dry-run dist

   * Check the output & then run the real thing:
   
			$ ./scripts/release.js dist

2. If not already done run `npm adduser` to allow your self to publish from this machine
3. Publish the generated tarball `npm -d publish <ares-ide-x.y.z.tgz>`.
   1. Check [ares-ide on the NPM registry](https://npmjs.org/package/ares-ide) after a few (tens of) minutes.
   2. Test `npm install ares-ide` on several platforms
   3. In case things go wrong (like _published package not working_), it is possible to `npm unpublish <version>`.  For example `npm unpublish ares-ide@0.2.4`.
4. Announce the release on [EnyoJS.com](http://enyojs.com) > Community > Forums > Categories : Ares > New discussion > _Ares x.y.z is out_
   
**After publishing:** ignite the work on the next version:

1. Upload the tag `git push --tags origin`
2. Prepare for the next round of work.  Depending on the digit you want to increase, choose exactly one of
   * `--major|-M` to perform `M.m.p` to `(M+1).m.p`
   * `--minor|-m` to perform `M.m.p` to `M.(m+1).p`
   * `--patch|-p` to perform `M.m.(p)` to `M.m.(p+1)`
   * `--pre|-r` to perform `M.m.p-pre.r` to `M.m.p-pre.(r+1)`
   * `--rel|-R` to perform `M.m.p-pre.r` to `M.m.p`
3. Run `/scripts/release.js post-dist`
4. Announce it to team-mates 
 
Palette/Inspector Design
------------------------

_This section is only for Enyo/lib commiters or developers of UI widgets libraries_

This section describes how UI widgets defined in enyo or librairies must be referenced in order to be proposed inside the designer's palette of Ares.

NB: ".design" files must be added into a "package.js" file in the "enyo.depends" call of your application/library.

For the time being, we have 4 sections in these files:

### Section "palette"

It defines some categories of widget such as "onyx". _This section is required_

Each "category" defines items which will appear in the Palette of the designer window.

Per item, you need to specify the "name", "description" and the most important is the property "config". "config" defines the actual "kind definition" which will be passed to createComponents() to instantiate the real object(s) when the drag and drop is done.

It can be a simple kind as for "onyx.ProgressButton" or a complex kind definition such as for "onyx.RadioGroup" or "onyx.PickerDecorator".

"inline" is not used for the time being.

A _special_ category can be added to ignore some components in the palette by naming it `ignore` and giving the list of items to ignore.
Each items to ignore must be declared simply with its `kind`, `description` and basic `config` (kind definition at least).

### Section "inspector"

It allows to define per kind and per event or property. _This section is optional_

The filter level which could be one of:
* "useful": the property/event will appear when the "FREQUENT" tab is selected in the inspector
* "normal": the property/event will appear when the "NORMAL" tab is selected in the inspector as well as the properties/events of the previous level.
* "dangerous": the property/event will appear when the "ALL" tab is selected in the inspector as well as the properties/events of the previous level.
* "hidden": the property/event will never appear in any tab of the inspector.

NB: The "FREQUENT" tabs displays the events/properties which are either marked "useful" or which have been modified by the developer.

The input kind which will be instantiated in the "inspector" part of the designer window.

Today, we support all kind which are defined in https://github.com/enyojs/ares-project/blob/master/deimos/source/designer/InspectorConfig.js, so:

* Inspector.Config.Boolean
* Inspector.Config.Text
* Inspector.Config.Select which could be useful to you as you have enumerated values. See "onyx.Input" in "onyx.design" as an example.
* Inspector.Config.Event which is used by default for all events to provide auto-completion with the functions existing in the edited kind

If this property is not defined, we select an input kind based on the property type. For the time being this is limited to Inspector.Config.Boolean or Inspector.Config.Text.

### Section "serializer"

_This section is optional_ 
