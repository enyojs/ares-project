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

## Designer

Designer Drag&Drop feature works fine with Chrome Browser but is
broken with other browsers.

## npm libraries issues

Once Ares is updated with `git` and `git submodule update`, the
node library must be updated with `npm -d install`.

After several updates, you may encounter errors with the server like
start failure or `project.json` corruption. In this case, `npm ls`
will return errors showing problems with the content of the
`node_modules` directory.

These errors can be often be fixed by running `npm prune`.

Otherwise, you will have to:

* remove the whole `node_modules` directory
* run `git submodule update --init --recursive`
* run `npm -d install`.

## Style are lost on property changes in Designer with latest enyo version

No work-around.

See JIRA https://enyojs.atlassian.net/browse/ENYO-2998.

