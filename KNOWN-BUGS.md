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
Old projects (created before ares-0.1.8) already in use (loaded in the local storage) or that will be imported, keep as resources definition (preview top file,icons, splashscreens) only the related name but now it should be the related relative path (from the root of the project they are dealing with). In "Project Properties" popup, old resources definition will appear as not valid. So they must be updated manually by selecting the resource through the file chooser launched from the file icon buttons in the "Project Properties" popup. (cf. https://enyojs.atlassian.net/browse/ENYO-2761 issue).

## PhoneGap

### Build fails with unsupported ChildBrowser plugin

ChildBrowser plugin can be configured in the application's
`project.json` file.  Edit your `project.json` to remove the
`ChildBrowser` key and its associated value.

### Build fails with application too large

Non minified upload of source includes target directory containing
already build packages. Remove the `target` directory from your
application source directory.


