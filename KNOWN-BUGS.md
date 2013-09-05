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
