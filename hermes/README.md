# Hermes

Hermes offers several services not available in a Web Browser through one (or several) Node.js processes:

* File-system abstraction for the Ares IDE.
* Archive service (used by the PhoneGap build service).

## Filesystem service

### Protocol

#### Resources

* `/id/{id}` resources are accessible via avery verbs described below.  These resources are used to browse the folder tree & get idividual items
* `/file/*` resources are files that are known to exist.  These resources are used by the Enyo Javascript parser & by the Ares _Project Preview_ feature.  They can only be accessed using `GET`.

#### Verbs

Hermes file-system providers use verbs that closely mimic the semantics defined by [WebDAV (RFC4918)](http://tools.ietf.org/html/rfc4918):  although Hermes reuses the same HTTP verbs (`GET`, `PUT`, `PROPFIND`, `MKCOL`, `DELETE` ...), it differs in terms of carried data.  Many (if not most) of the HTTP clients implement only the `GET` and `POST` HTTP verbs:  Hermes uses [X-HTTP-Method-Overrides](http://fandry.blogspot.fr/2012/03/x-http-header-method-override-and-rest.html) as WebDAV usually does.  As a potential security hole (enforced by Express), Ares does **not** support  the special `_method` query parameter .

* `PROPFIND` lists properties of a resource.  It recurses into the collections according to the `depth` parameter, which may be 0, 1, … etc plus `infinity`.  For example, the following directory structure:

		$ tree dir1/
		dir1/
		├── file0
		└── file1

… corresponds to the following JSON object (multi-level node descriptor) returned by `PROPFIND`.  The node descriptor Object format is defined by [this JSON schema](../assets/schema/com.enyojs.ares.fs.node.schema.json).  The `path` property is node location absolute to the Hermes file-system server root:  it uses URL notation: UNIX-type folder separator (`/`), not Windows-like (`\\`).

		$ curl "http://127.0.0.1:9009/id/%2F?_method=PROPFIND&depth=10"
		{
		    "isDir": true, 
		    "path": "/", 
		    "name": "", 
		    "children": [
		        {
		            "isDir": true, 
		            "path": "/dir1", 
		            "name": "dir1", 
		            "id": "12efa4560"
		            "children": [
		                {
		                    "isDir": false, 
		                    "path": "/dir1/file0", 
		                    "name": "file0", 
		                    "id": "12efab780"
		                }, 
		                {
		                    "isDir": false, 
		                    "path": "/dir1/file1", 
		                    "name": "file1", 
		                    "id": "0ae12ef56"
		                }
		            ]
		        }, 
		    ], 
		    "id": "934789346956340",
		    "versionTag": "af34ef45",
		}

* `MKCOL` create a collection (a folder) into the given collection, as `name` passed as a query parameter (and therefore URL-encoded).  It returns a JSON-encoded single-level (depth=0) node descriptor of the new folder.

		$ curl -d "" "http://127.0.0.1:9009/id/%2F?_method=MKCOL&name=tata"

* `GET` can be used:
    * ***`On files:`*** to get the content of a particular file.  
    The optional query parameter `versionTag` comes from a previous call to `GET` on the same file.  	The HTTP header `x-ares-node` (lowecase) contains a JSON-encoded version of the file's node descriptor (the one returned by `PROPFIND` for this file).
    * ***`On folders:`*** to get the content of all the files of the folder encoded in base64 into a single FormData.  
    An additional query parameter "format" set to "base64" is expected. An error will be returned if this "format" query parameter is not present or is not equal to "base64".  
    Other encoding may be added later on.

	
* `PUT` creates or overwrite one or more file resources, provided as `application/x-www-form-urlencoded` or `multipart/form-data`.  It returns a JSON-encoded array of single-level (depth=0) node descriptors for each uploaded files.
  * `application/x-www-form-urlencoded` contains a single base64-encoded file in the form field named `content`.  The file name and location are provided by `{id}` and optionally `name` query parameter.
  * `multipart/form-data` follows the standard format.  For each file `filename` is interpreted relativelly to the folder `{id}` provided in the URL.  **Note:** To accomodate an issue with old Firefox releases (eg. Firefox 10), fields labelled `filename` overwrite the `filename` in their corresponding `file` fields.  See `fsBase#_putMultipart()` for more details.

* `DELETE` delete a resource (a file), which might be a collection (a folder).  Status codes:
  * `200/OK` success, resource successfully removed.  The method returns the new node descriptor (as `PROPFIND` would return) of the parent of the deleted resource.

		$ curl -d "" "http://127.0.0.1:9009/id/%2Ftata?_method=DELETE"

* `COPY` reccursively copies a resource as a new `name` or `folderId` provided in the query string (one of them is required, only one is taken into account, `name` takes precedence if both are provided in the query-string).  The optionnal query parameter `overwrite` defines whether the `COPY` should try to overwrite an existing resource or not.  The method returns the node descriptor (as `PROPFIND` would return) of the new resource.
  * `201/Created` success, a new resource is created
  * `200/Ok` success, an existing resource was successfully overwritten (query parameter `overwrite` was set to `true`)
  * `412/Precondition-Failed` failure, not allowed to copy onto an exising resource

* `MOVE` has the exact same parameters and return code & value as `COPY`

#### Parameters

##### Path parameters

		http://127.0.0.1:{port}/{urlPrefix}/id/{id}

* **`port`** TCP port
* **`urlPrefix`** server path
* **`id`** resource IDs.  Even when readable, those resources need to be handled as if they were opaque values.

##### Query parameters

* **`name`** File or folder name, for creation methods (`MKCOL`, `PUT`, `COPY`, `MOVE`).  This is required, as the resource `id` is not (yet) known.
* **`folderId`** target folder `id` used by `COPY` and `MOVE` methods.
* **`overwrite`** when set to `true` with the `COPY`, `MOVE` and `PUT` methods, causes the target resource to be overwritten (not merged) in case it already exists.  When absent, `overwrite` defaults to `false`.
* **`depth`** is only valid with the `PROPFIND` method.  It defines the recursion level of the request in the folder tree.  When omitted, it defaults to `1` (list immediate child resources of a folder).  The special value `infinity` causes the methods to recurse to the deepest possible level in the folder tree.

	
### Run Test Suite

**New** the test suite does not cover the former verbs used by Hermes, and implemented into `filesystem/index.js`.

So far, only hermes local filesystem access comes with a (small) test suite, that relies on [Mocha](http://visionmedia.github.com/mocha/) and [Should.js](https://github.com/visionmedia/should.js).  Run it using:

	$ test/mocha/bin/mocha hermes/fsLocal.spec.js

To stop on the first failing case:

	$ test/mocha/bin/mocha --bail hermes/fsLocal.spec.js

For more detailled instructions, refer to the [Mocha home page](http://visionmedia.github.com/mocha/).

### Dropbox

Ares comes with an Hermes service using your Dropbox account as a storage service.    Enable this service in the `ide.json` before starting the IDE server:

	[…]
	{
		"active":true,
		"id":"dropbox",
		"icon":"dropbox.com-32x32",
		"name":"Dropbox",
		"type": "filesystem",
		"provider": "hermes",
		"command":"@NODE@", "params":[
			"hermes/fsDropbox.js", "-P", "/files", "-p", "10002"
		],
		"auth": {
			"type": "dropbox",
			"appKey": "",
			"appSecret": ""
		},
		"useJsonp":false,
		"verbose": false
	[…]

You need to replace the appKey and appSecret entries with the proper values from your Dropbox application entry for Ares(see below).

In order to use Dropbox as storage service for Ares, you need to [create an Ares application in Dropbox](https://www.dropbox.com/developers/apps) & grant Ares the authorization to access this Dropbox application (_Ares_ > _Accounts_ > _Dropbox_ > _Renew_ ).  Popup blockers must be disabled to allow the Dropbox OAuth popup window to appear.

**NOTE:** While Chrome & Firefox will notify you of a blocked popup (hence allowing you to explicitly un-block it), Safari users will need to explicitly allow every popups (unless there is s smarter way  am not aware of) using _Safari_ > _Preferences_ > _Security_ > Un-check _Block pop-up windows_

**NOTE:** Ares gives 20 seconds to the browser to load the Dropbox authorization window & complete the procedure.  In case it takes longer, please press _Renew_ again:  another immediate attempt will be faster as the page will be partially available from the browser cache.

Ares Dropbox connector works behind an enterprise HTTP/HTTPS proxy, thanks to the [GitHub:node-tunnel](https://github.com/koichik/node-tunnel) library.  `fsDropbox` proxy configuration embeds a `node-tunnel` configuration.  For example, fellow-HP-ers can use the below (transform `Xproxy` into `proxy` in the sample ide.json):

			[…]
			"proxy":{
				"http":{
					"tunnel":"OverHttp",
					"host":"web-proxy.corp.hp.com",
					"port":8080
				},
				"https":{
					"tunnel":"OverHttp",
					"host":"web-proxy.corp.hp.com",
					"port":8080
				}
			},
			[…]

## Archive service

This is the `arZip.js` service.  It takes 2 arguments:

* `pathname`
* `port`

It can be started standlone using the following command-line (or a similar one):


…in which case it can be tested using `curl` by a command-line like the following one:

	$ curl \
		-F "file=@config.xml;filename=config.xml" \
		-F "file=@icon.png;filename=images/icon.png" \
		-F "archive=myapp.zip" \
		"http://127.0.0.1:9019/arZip" > /tmp/toto.zip
	  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
	                                 Dload  Upload   Total   Spent    Left  Speed
	100  8387    0  3860  100  4527   216k   253k --:--:-- --:--:-- --:--:--  276k

The generated file is expected to look like to below:

	$ unzip -l /tmp/toto.zip 
	Archive:  /tmp/toto.zip
	  Length     Date   Time    Name
	 --------    ----   ----    ----
	      942  10-17-12 17:26   config.xml
	     3126  10-17-12 17:26   images/icon.png
	 --------                   -------
	     4068                   2 files

## Project template service

The service "***genZip***" allows to intanciate new Ares project from project templates such as "**[bootplate](https://github.com/enyojs/enyo/wiki/Bootplate)**" or any customer specific project templates.
These project templates can be defined:  

* in "ide.json" of ares-project  
* or in "ide.json" of Ares plugins  


`IMPORTANT:` See [Project template configuration](#project-template-config) and [Merging Ares plugin configuration](../README.md#merging-configuration) for more information.

### [Project template configuration](id:project-template-config)

The property `projectTemplateRepositories` of the service "**genZip**" lists the template definitions that are available at project creation time.

The property `projectTemplateRepositories` of the service "**genZip**" is defined in the "***ide.json***" of ares-project.

		{
			"id":"genZip",
			"projectTemplateRepositories": {
				"bootplate": {
					"description": "Standard Enyo template",
					"url": "http://enyojs.com/archive/ares-project-templates.json"
				}
			},
			...
		}

The `url` property above can either be an http url or a an absolute filename such as:  
NB: Within the `ide.json` configuration file, the variables `@NODE@`, `@CWD@`, `@INSTALLDIR@`, `@HOME@` and `@PLUGINDIR@` will be subsituted by the right value when `node ide.js` is started.

	"url": "@INSTALLDIR@/templates/projects/ares-project-templates.json"

Ares plugins can add or modify this list of templates.

		{
			"id": "genZip",
			"projectTemplateRepositories": {
				"bootplate": {
				},
				"my-templates": {
					"url": "http://xyz.com/my-templates.json",
					"description": "My Templates"
				}
	        }
		}

As a result, `"bootplate": {}` will remove the entry defined in ide.js of ares-project and `"my-templates": { "url" : "http://xyz.com/my-templates.json", …}` will add a new list of templates named 'my-templates'.

### [Project template definition](id:project-template-definition)

A project template definition (defined by the property `url` in `projectTemplateRepositories` must respect the json schema [com.enyojs.ares.project.templates.schema.json](../assets/schema/com.enyojs.ares.project.templates.schema.json).

The compliance of a project template definition file with the json schema is not yet enforced but could be checked via [http://jsonschemalint.com/](http://jsonschemalint.com/).

	[
	  {
	    "id": "bootplate-2.2.0",
	    "zipfiles": [
	      {
	        "url": "bootplate-2.2.0.zip",
	        "alternateUrl": "http://enyojs.com/archive/bootplate-2.2.0.zip",
	        "prefixToRemove": "bootplate",
	        "excluded": [
	          "bootplate/api"
	        ]
	      },
	   	  {
	   	  	"url": ...
	   	  }
	    ],
	    "description": "Enyo bootplate 2.2.0"
	  },
	  {
	  	"id": ...
	  }
	]

Each project definition defined by `id` can reference **several zip files** defined in the array `zipfiles`. The zip files are extracted in the order they are specified.  

Each zip file entry:

* must define an `url` and optionally an `alternateUrl`. The `url` is tried first and can refer to either:

	* a file stored locally on the filesystem.  
	NB: the filename must be relative to the directory where the project templates definition file is stored (See property `url` in `projectTemplateRepositories` above).  

	* or an http url.
	
	If the `url` references a file which does not exist the `alternateUrl` is used.

* can define a `prefixToRemove`. This prefix must correspond to one or several directory level that must be removed.
* can define in the array `excluded` a list of files or directories to be excluded when the zip file is extracted.

### Protocol


#### Resources

The default `<pathname>` value is `/genzip`.  Its value can be changed using the `-P` paraemter in the main `ide.json` configuration file.

* `<pathname>/templates`:
	* `GET` returns a JSON-encoded array of all the available project templates.
* `<pathname>/template-repos/:repo-id`:
	* `POST` creates a new repo entry with the key `repo-id`. The POST body must contain the `url` of the new project template repository.
* `<pathname>/generate`:
	* `POST` returns a FormData containing all the files, encoded in base64, of the selected project template.  
		* The POST body must contain:
			* the `templateId` of the selected project template.  
			* the `substitutions` needed as a JSON stringified object.
		* It's up to the caller to extract and base64 decode the files to create a new project.  
		In Ares, this is achieved by forwarding the FormData to Hermes filesystem service via a PUT method.


## PhoneGap build service

The entire [build.phonegap.com API](https://build.phonegap.com/docs/api) is wrapped by a dedicated Hermes build service named `bdPhoneGap`.  Reasons are:

1. It is easier (more portable) to manipulate files using Node.js than using HTML5 `File` and `Blob` entities, which are not (yet) fully implemented by the browsers.
2. build.phonegap.com does not support CORS: It refuses to answer an AJAX query (or at least the one that requests a token) that comes from a web application served from 127.0.0.1 (as Ares is in its standalone version).

		XMLHttpRequest cannot load https://build.phonegap.com/token.
 		Origin http://127.0.0.1 is not allowed by Access-Control-Allow-Origin.

**Note:** Ares PhoneGap Build connector does _not_ work behind an HTTP/HTTPS proxy yet.

### Protocol


Resources:

* The default `<pathname>` value is `/phonegap`.  Its value can be changed using the `-P` paraemter in the main `ide.json` configuration file.
* `<pathname>/token`:
	* `GET` using Basic Authentication, returns a JSON-encoded token object `{"token":"YOUR_TOKEN"}`.  Every other resources are accessible only when passing this token value using on of the following ways:
	* As a `token` cookie with value `YOUR_TOKEN` (preferred),
	* As a web-form `token` field (either in `application/x-www-urlencoded` or `multipart/forma-data` format) if applicable to the request format.
	* As a `token=YOUR_TOKEN` query parameter, in the URL (_least secure, may be removed in the future_).
* `<pathname>/user`:
	* `GET`, returns the user account information, using the same format as the one returned by [`GET https://build.phonegap.com/api/v1/me`](https://build.phonegap.com/docs/read_api).
* `<pathname>/deploy`:
	* `POST` runs the Enyo `deploy.js` script on the given application.  Application folder tree is encoded as a `multipart/form-data` in the POST request body.  If successfull, the response body is a `application/zip` containing the deployable application.  It is an intermediate step of the `<pathname>/build` operation.
* `<pathname>/build`:
	* `POST` uploads the former deployable application to the [PhoneGap Build Service](https://build.phonegap.com) & returns the JSON-encoded answer of this service.  This operation expects some fields (`key=value`) to be passed inlined in the request body (as `multipart/form-data` fields).  Each of those field is passed verbatim as a property of the JSON requestObject (see [mantatory & optionnal parameters of the PhoneGap write API](https://build.phonegap.com/docs/write_api)). The following fields are mandatory.
   		* `title` is the human-readable application name.  It is considered a good practice to reuse the value of the `<name/>` field of the `config.xml`.


### Development & Test

**Note:** Most of the commands in this section assume that you are using Mac OSX or Linux.

Manual run on fixed port 10003 (default is dynamically-assigned port):

	$ node hermes/bdPhoneGap.js -p 10003

Test `/token`:

* Assuming you have a working account build.phonegap.com associated with the email `YOUR_EMAIL`, get your PhoneGap developer token `YOUR_TOKEN`, using **build.phonegap.com**:

		$ curl -v -u YOUR_EMAIL -X POST -d "" https://build.phonegap.com/token
		Enter host password for user 'YOUR_EMAIL':
		{"token":"YOUR_TOKEN"}

* Using **bdPhoneGap**:

		$ curl -v -X POST -d "username=YOUR_EMAIL" -d "password=YOUR_PASSWORD" http://127.0.0.1:10003/phonegap/token
		{"token":"YOUR_TOKEN"}

Test `/api/v1/me`:

* Using **build.phonegap.com**, use one of the below:

		$ curl -v -u YOUR_EMAIL -X GET -d "" https://build.phonegap.com/api/v1/me
		$ curl -v -X GET https://build.phonegap.com/api/v1/me?auth_token=YOUR_TOKEN

* Using **bdPhoneGap**:

		$ curl -v -X GET -b "token=YOUR_TOKEN" http://127.0.0.1:10003/phonegap/api/v1/me

Test `/op/deploy`:

* The following commands generates a POST request carrying a `multipart/form-data` message suitable to test the `bdPhoneGap.js` service:

* This one generates a command that returns a minified (deployable) application

		$ find . -type f | \
			awk 'BEGIN{printf("curl ");}{sub("^\.\/", "", $1); printf("-F \"file=@%s;filename=%s\" ", $1, $1);}END{print(url)}' \
			url=http://127.0.0.1:9029/phonegap/deploy/

Test `/op/build`:

* This one generates a command that creates a new `appId` using an application located in the current directory.  Note that you must provide the `token` and `title` form fields.  The `<name/>` in the `config.xml` is a suitable value for the `title` form field.

		$ find . -type f | \
			awk 'BEGIN{printf("curl ");}{sub("^\.\/", "", $1); printf("-F \"file=@%s;filename=%s\" ", $1, $1);}END{printf("-F \"token=%s\" -F \"title=%s\" %s\n", token, title, url)}' \
			token=YOUR_TOKEN \
			title="My First PhoneGap App" \
			url=http://127.0.0.1:9029/phonegap/build/

* This one generates a command that updates the `appId=238006`.  Other form fields follow the same rules as before.

		$ find . -type f | \
			awk 'BEGIN{printf("curl ");}{sub("^\.\/", "", $1); printf("-F \"file=@%s;filename=%s\" ", $1, $1);}END{printf("-F \"token=%s\" -F \"title=%s\" -F \"appId=%s\" %s\n", token, title, appId, url)}' \
			token=YOUR_TOKEN \
			title="My First PhoneGap App" \
			appId=YOUR_APPID \
			url=http://127.0.0.1:9029/phonegap/build/

**Note:** In case you are working from behind the HP firewall (without ), you may need to prefix the `curl` and `node` commands above with `env https_proxy=web-proxy.corp.hp.com:8080`.

## Debug

It is possible to debug an Hermes services by commenting-out the `command` property of the service to be debugged in the ide.json & start it manually along with `--debug` or `--debug-brk`  to later connect a `node-inspector`.

Start the file server:

	$ node ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
	
**Debugging:** The following sequence (to be run in separated terminals) opens the ARES local file server in debug-mode using `node-inspector`.

	$ node --debug ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
		
...then start `node-inspector` & the browser windows from a separated terminal:

	$ open -a Chromium http://localhost:9010/ide/ares/index.html
	$ node-inspector &
	$ open -a Chromium http://localhost:8080/debug?port=5858

References:


## References

1. [GitHub: node-inspector](https://github.com/dannycoates/node-inspector)
1. [Using node-inspector to debug node.js applications including on Windows (and using ryppi for modules)](http://codebetter.com/glennblock/2011/10/13/using-node-inspector-to-debug-node-js-applications-including-on-windows-and-using-ryppi-for-modules/)
1. Screencast [Debugging with `node-inspector`](http://howtonode.org/debugging-with-node-inspector)
1. [RFC4918 - HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc4918)
1. [RFC5689 - Extended MKCOL for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc5689)
