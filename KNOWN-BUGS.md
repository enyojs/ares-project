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

### Phonegap Build UI limitation

The actual Phonegap Build UI that let the user define the content of the XML tags of the configuration file `config.xml` present the following limitations : 
* The user don't have the ability to modify the content of the the file `config.xml`. Each time the build is launched, the content of this configuration file is rewritten by an auto-generated content.
* The number of instances of the XML tags `icon` & `gap:splash` is limited to 1 for each, or the Phonegap Build service let the user define for an application multiple icons or splash screens with different resolution. 
* For the tag `access`, the definition of the attributs `subdomains` & `browserOnly` is missing from the UI.

In order to solve these Issues the following solutions will be proposed  : 
* The missing widget for setting the parameters of the `access` tag attributes will be added to the UI
* Ares user will be grant the possibility to disable the auto-generation of the file `config.xml`
  when the build is launched, so the user will be able to have the full control of the content of this configuration file.

For now, there is no workaround to bypass these issues.

## Designer

The actual Designer(Drag&Drop) feature works perfectly using Chrome Browser.
Regarding the other browsers we still have issues that will be fixed for the next package release.

For now, there is the workaround to bypass these issues.
