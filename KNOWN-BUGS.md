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

## Project Properties

When creating a new project, _sometimes_ the project description
(name, id, title... etc) are reverted to their default values before
being saved to disk.  The work-around is to later edit those properties
using Project > Edit.

This problem also affects the user-set PhoneGap Build properties, such
as permissions & signing-keys selection.

