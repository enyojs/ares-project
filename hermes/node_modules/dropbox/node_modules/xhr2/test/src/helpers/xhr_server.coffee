express = require 'express'
fs = require 'fs'
http = require 'http'
https = require 'https'
open = require 'open'

# express.js server for testing the Web application.
class XhrServer
  # Starts up a HTTP server.
  constructor: (@port, @useHttps) ->
    @createApp()

  # Opens the test URL in a browser.
  openBrowser: (appName) ->
    open @testUrl(), appName

  # The URL that should be used to start the tests.
  testUrl: ->
    "https://localhost:#{@port}/test/html/browser_test.html"

  # The self-signed certificate used by this server.
  certificate: ->
    return null unless @useHttps
    keyMaterial = fs.readFileSync 'test/ssl/cert.pem', 'utf8'
    certIndex = keyMaterial.indexOf '-----BEGIN CERTIFICATE-----'
    keyMaterial.substring certIndex

  # The server code.
  createApp: ->
    @app = express()

    # Echoes the request body. Used to test send(data).
    @app.post '/_/echo', (request, response) ->
      if request.headers['content-type']
        response.header 'Content-Type', request.headers['content-type']
      if request.headers['content-length']
        response.header 'Content-Length', request.headers['content-length']

      request.on 'data', (chunk) -> response.write chunk
      request.on 'end', -> response.end()

    # Lists the request headers. Used to test setRequestHeader().
    @app.post '/_/headers', (request, response) ->
      body = JSON.stringify request.headers
      response.header 'Content-Type', 'application/json'
      response.header 'Content-Length', body.length.toString()
      response.end body

    # Sets the response headers in the request. Used to test getResponse*().
    @app.post '/_/get_headers', (request, response) ->
      jsonString = ''
      request.on 'data', (chunk) -> jsonString += chunk
      request.on 'end', ->
        headers = JSON.parse jsonString
        for name, value of headers
          response.header name, value
        response.header 'Content-Length', '0'
        response.end ''

    # Sets every response detail. Used for error testing.
    @app.post '/_/response', (request, response) ->
      jsonString = ''
      request.on 'data', (chunk) -> jsonString += chunk
      request.on 'end', ->
        json = JSON.parse jsonString
        response.writeHead json.code, json.status, json.headers
        response.write json.body if json.body
        response.end()

    # Sends data in small chunks. Used for event testing.
    @app.post '/_/drip', (request, response) ->
      request.connection.setNoDelay()
      jsonString = ''
      request.on 'data', (chunk) -> jsonString += chunk
      request.on 'end', ->
        json = JSON.parse jsonString
        sentDrips = 0
        drip = new Array(json.size + 1).join '.'
        response.header 'Content-Type', 'text/plain'
        if json.length
          response.header 'Content-Length', (json.drips * json.size).toString()
        sendDrip = =>
          response.write drip
          sentDrips += 1
          if sentDrips >= json.drips
            response.end()
          else
            setTimeout sendDrip, json.ms
        sendDrip()

    # Requested when the browser test suite completes.
    @app.get '/diediedie', (request, response) =>
      if 'failed' of request.query
        failed = parseInt request.query['failed']
      else
        failed = 1
      total = parseInt request.query['total'] || 0
      passed = total - failed
      exitCode = if failed == 0 then 0 else 1
      console.log "#{passed} passed, #{failed} failed"

      response.header 'Content-Type', 'image/png'
      response.header 'Content-Length', '0'
      response.end ''
      unless 'NO_EXIT' of process.env
        @server.close()
        process.exit exitCode

    # CORS headers on everything, in case that ever gets implemented.
    @app.use (request, response, next) ->
      response.header 'Access-Control-Allow-Origin', '*'
      response.header 'Access-Control-Allow-Methods', 'DELETE,GET,POST,PUT'
      response.header 'Access-Control-Allow-Headers',
                      'Content-Type, Authorization'
      next()

    @app.use express.static(fs.realpathSync(__dirname + '/../../../'),
                            { hidden: true })

    if @useHttps
      options = key: fs.readFileSync 'test/ssl/cert.pem'
      options.cert = options.key
      @server = https.createServer options, @app
    else
      @server = http.createServer @app
    @server.listen @port

module.exports.https = new XhrServer 8911, true
module.exports.http = new XhrServer 8912, false
