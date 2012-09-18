# Hermes

Hermes is the file storage component of the Ares IDE.  It provides a consistent file-system abstraction API,  whatever backend storage system is in use.

## Hermes Verbs

Hermes file-system providers use verbs that closely mimic the semantics defined by [WebDAV (RFC4918)](http://tools.ietf.org/html/rfc4918):  although Hermes reuses the same HTTP verbs (`GET`, `PUT`, `PROPFIND`, `MKCOL`, `DELETE` ...), it differs in terms of carried data.  Many (if not most) of the HTTP clients implement only the `GET` and `POST` HTTP verbs:  Hermes uses the same HTTP Method Overrides as WebDAV usually do (tunnel every requests but `GET` into `POST` requests that include a special `_method` query parameter)

* `PROPFIND` lists properties of a resource.  It recurses into the collections according to the `depth` parameter, which may be 0, 1, … etc plus `infinity`.  For example, the following directory structure:

		$ tree 1/
		1/
		├── 0
		└── 1

… corresponds to the following JSON object returned by `PROPFIND`.

		$ curl "http://127.0.0.1:9009/id/%2F?_method=PROPFIND&depth=10"
		{
		    "isDir": true, 
		    "path": "/", 
		    "name": "", 
		    "contents": [
		        {
		            "isDir": false, 
		            "path": "/0", 
		            "name": "0", 
		            "id": "%2F0"
		        }, 
		        {
		            "isDir": false, 
		            "path": "/1", 
		            "name": "1", 
		            "id": "%2F1"
		        }
		    ], 
		    "id": "%2F"
		}

* `MKCOL` create a collection (a folder) into the given collection, using the name `name` passed as a query parameter (and therefore URL-encoded):

		$ curl -d "" "http://127.0.0.1:9009/id/%2F?_method=MKCOL&name=tata"

* `DELETE` delete a resource (a file), which might be a collection (a folder).  Status codes:
  * `204/No-Content` success, resource successfully removed

		$ curl -d "" "http://127.0.0.1:9009/id/%2Ftata?_method=DELETE"

* `COPY` reccursively copies a resource as a new `name` or `path` provided in the query string (one of them is required).  The optionnal query parameter `overwrite` defines whether the `COPY` should try to overwrite an existing resource or not.  
  * `201/Created` success, a new resource is created
  * `204/No-Content` success, an existing resource was successfully overwritten (query parameter `overwrite` was set to `true`)
  * `412/Precondition-Failed` failure, not allowed to copy onto an exising resource
* `MOVE` has the exact same parameters and return codes as `COPY`


## Debug

It is possible to debug an Hermes services by commenting-out the `command` property of the service to be debugged & start it manually along with `--debug` or `--debug-brk`  to later connect a `node-inspector`.

Start the file server:

	$ node ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
	
**Debugging:** The following sequence (to be run in separated terminals) opens the ARES local file server in debug-mode using `node-inspector`.

	$ node --debug ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
		
...then start `node-inspector` & the browser windows from a separated terminal:

	$ open -a Chromium http://localhost:9010/ide/ares/index.html
	$ node-inspector &
	$ open -a Chromium http://localhost:8080/debug?port=5858


	
## Run Test Suite

**New** the test suite does not cover the former verbs used by Hermes, and implemented into `filesystem/index.js`.

So far, only hermes local filesystem access comes with a (small) test suite, that relies on [Mocha](http://visionmedia.github.com/mocha/) and [Should.js](https://github.com/visionmedia/should.js).  Run it using:

	$ hermes/node_modules/mocha/bin/mocha hermes/fsLocal.spec.js

## References

* [RFC4918 - HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc4918)
* [RFC5689 - Extended MKCOL for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc5689)
* Screencast [Debugging with `node-inspector`](http://howtonode.org/debugging-with-node-inspector)
