## Proxy settings

Proxy can be configured in Ares ide.json file. Sample proxy configuration
is provided in `ide.json` with the `Xproxy` and `XproxyUrl` parameters.
To setup your proxy:
* remove the `X` from `XproxyUrl` and `Xproxy` name
* configure your proxy in the value of these parameters.

Example:

	"proxyUrl": "http://myproxy.some.where.org:8080",

	"proxy":{
		"http":{
			"tunnel":"OverHttp",
			"host":"myproxy.some.where.org",
			"port":8080
		},
		"https":{
			"tunnel":"OverHttp",
			"host":"myproxy.some.where.org",
			"port":8080
		}
	},

## Project properties

Before Ares 0.1.8, file resources like "preview top file", icons,
splashscreens were specified using a relative path name (like
`debug.html`, `asset/my_icon.png`). They now must be specified with an
absoulte path name (i.e. with a leading `/`). These resources can be
configured with the `Project` -> `Edit` menu or by directly editing
`project.json` outside of Ares.
(cf. https://enyojs.atlassian.net/browse/ENYO-2761 issue).

## PhoneGap

### Build fails with unsupported ChildBrowser plugin

ChildBrowser plugin can be configured in the application's
`project.json` file.  Edit your `project.json` to remove the
`ChildBrowser` key and its associated value.

### Build fails with application too large

Non minified upload of source includes target directory containing
already build packages. Remove the `target` directory from your
application source directory.

### Customizing Phonegap `config.xml`

`config.xml` is generated from the data specified in the Phonegap tab of
Project Config Editor. If the proposed build options do not meet your
need, you will have to:
* disable `config.xml` generation (in the `Advanced` config setup of phonegap project config editor)
* edit directly `config.xml` (with Ares or another editor).

### Icons and splashscreens and Phonegap

The number of instances of the XML tags `icon` & `gap:splash` is
limited to 1 for each, or the Phonegap Build service let the user
define for an application multiple icons or splash screens with
different resolution.

## Designer

Designer Drag&Drop feature works fine with Chrome Browser but is
broken with other browsers.
