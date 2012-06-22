var prototype
	, url = require('url')
	, fs = require('fs')
	, util = require('util')
	, path = require('path')
	, trycatch = require('trycatch')
	, request = require('request')
	, FormData = require('form-data')
	, BufferedStream = require('bufferedstream') 
	, ZipRequestStream = require('./ZipRequestStream')
	, HermesBuild = require('../lib/hermesBuild').HermesBuild
	, _ = require('../lib/_')

//
// phonegap build implementation of hermes API
//
function HermesPhonegap(inConfig) {
	arguments.callee.super_.call(this, inConfig)
}

util.inherits(HermesPhonegap, HermesBuild)
prototype = Object.getPrototypeOf(HermesPhonegap.prototype)
HermesPhonegap.prototype.verbs = Object.create(prototype.verbs || {})

_.extend(true, HermesPhonegap.prototype, {
	name: "Phonegap Hermes Build Service"
, verbs: {
	hello: function(req, res, next) {
		res.end('Hello World.')
	}
	// http://localhost:9050/build/android?from=http://localhost:9020/a/b/c
	, build: function(req, res, next) {
			console.log(req.params)
			if (!config.user || !config.password) {
				return hermesPhonegap.onError('Insufficient credentials provided.', res)
			}
			config.id = parseInt(config.id) || ''
			method = config.id ? 'put' : 'post'
			var uri = util.format('https://%s:%s@build.phonegap.com/api/v1/apps/%s', encodeURIComponent(config.user), encodeURIComponent(config.password), config.id)
			console.log('Submitting: ', uri)

			// https://127.0.0.1:9001/hermes/list/ares/adam
			console.log('prepzip')
			var source = req.query.from
			if (source) {
				console.log('ziprequesting: ', source, config.from)
				var zipRequestStream = new ZipRequestStream({
					url: source,
					cookie: {provider: config.from}
				})

				// Since phonegap requires multipart/form-data, which requires Content-length
				// We must pipe to fs first (or memory) and then pipe out
				var outPath =  path.join(__dirname, 'out', 'out'+Date.now()+'.zip')
				zipRequestStream.pipe(fs.createWriteStream(outPath))
				zipRequestStream.on('end', function() {
					var form = new FormData()
					var data = {}
					if (!config.id) {
						data.title = 'Ares Project: ' + (new Date).toGMTString()
						data.create_method = 'file'
					} else {
						// We probably need to bump the version if we're updating
						// data.version = 'bumpp'
					}

					var readStream = fs.createReadStream(outPath)
					form.append('file', readStream)
					console.log('id: ',JSON.stringify(data))
					form.append('data', JSON.stringify(data))

					var r = request({
							method: config.id ? 'put' : 'post',
							url: uri,
							headers: form.getHeaders() 
						}, function(err, res2) {
							console.log('Submitted.')
							
							if (err) return next(err)
							try {	var body = JSON.parse(res2.body)} catch(e) { return next(new Error(res2.body)) }
							if (typeof body.error === 'string') return next(new Error(body.error))
							
							var type = req.params.path.split('/')[0]
							if (['android', 'blackberry', 'ios', 'symbian', 'webos'].indexOf(type) !== -1) {
								uri += '/' + type
							}

							var start = Date.now()
							
							;(function timeout() {
								console.log('Polling: ', JSON.stringify(uri))
								trycatch(function() {
									// Currently request forwards old domain's auth credentials on 300 redirect
									// resulting in a 200 on the CDN
									request({followRedirect: false, uri: uri, onResponse: true}, function (err, res3) {
										if (err) {
											console.log('HEEEEE-----------------',e.stack)
											return timeout()
										}

										console.log('Response: ', res3.statusCode, res3.headers.location)
										
										if (Math.floor(res3.statusCode/100) === 4) {
											// timeout after 1 minute
											if (Date.now() - start > 60 * 1000) {
												console.log(res3.body)
												return hermesPhonegap.onError('Build failed.', res)
											} else {
												setTimeout(timeout, 1000)
											}
										} else {
											if (res3.headers.location) {
												console.log('Redirecting: ', res3.headers.location)
												return next(null, request({followRedirect: false, uri: res3.headers.location, onResponse: true}))
											}

											return next(null, res3)
										}
									})
								})
							})()
						}
					)

					form.pipe(r)
				})
			} else {
				next(new Error('Uploading zip file not supported.'))
			}

			// if (source) {
			// 	form.pipe(r)
			// } else {
			// 	req.pipe(r)
			// }
		}
	}
})

module.exports = {
	HermesPhonegap: HermesPhonegap
}

/*
- Research intro to functional programming, Functional programming in Javascript
- Build custome console.log/debugger functions
- Create HermesRequest, no req access, in HermesClient => Hermes
- Fix getFolder in HermesFiles: multipart, zip, tar
	- Fix inList, inGet, etc...
	- Fix HermesLocal vs HermesRemote (if inGet/inList is external, should be identical)
- Resolve multi-argument solution into utility
- Resolve Hermes inheritance, auto inherit on existing member objects
_ Fork extend
- Fix BoxNet
- Take content-length and stream to build.phonegap.com
- create app unverified (create_method was problematic)


- make hermes an insallable packag
- proper hermes specific inheritance
- Fix connectionCache
- Fix step on windows
- setup private npm repo
- add multi-version support
- punt on enyo build of directory
- upload zip not currently supported
- Architect deploy / local android service
- resolve request issue


- Hacker Dojo event
- Reach out to speakers

*/ 