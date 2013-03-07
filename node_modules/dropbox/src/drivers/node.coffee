# OAuth driver that redirects the browser to a node app to complete the flow.
#
# This is useful for testing node.js libraries and applications.
class Dropbox.Drivers.NodeServer
  # Starts up the node app that intercepts the browser redirect.
  #
  # @param {?Object} options one or more of the options below
  # @option options {Number} port the number of the TCP port that will receive
  #   HTTP requests
  # @param {String} faviconFile the path to a file that will be served at
  #   /favicon.ico
  constructor: (options) ->
    @port = options?.port or 8912
    @faviconFile = options?.favicon or null
    # Calling require in the constructor because this doesn't work in browsers.
    @fs = require 'fs'
    @http = require 'http'
    @open = require 'open'

    @callbacks = {}
    @nodeUrl = require 'url'
    @createApp()

  # URL to the node.js OAuth callback handler.
  url: (token) ->
    "http://localhost:#{@port}/oauth_callback?dboauth_token=" +
        encodeURIComponent(token)

  # Opens the token
  doAuthorize: (authUrl, token, tokenSecret, callback) ->
    @callbacks[token] = callback
    @openBrowser authUrl

  # Opens the given URL in a browser.
  openBrowser: (url) ->
    unless url.match /^https?:\/\//
      throw new Error("Not a http/https URL: #{url}")
    @open url

  # Creates and starts up an HTTP server that will intercept the redirect.
  createApp: ->
    @app = @http.createServer (request, response) =>
      @doRequest request, response
    @app.listen @port

  # Shuts down the HTTP server.
  #
  # The driver will become unusable after this call.
  closeServer: ->
    @app.close()

  # Reads out an /authorize callback.
  doRequest: (request, response) ->
    url = @nodeUrl.parse request.url, true
    if url.pathname is '/oauth_callback'
      if url.query.not_approved is 'true'
        rejected = true
        token = url.query.dboauth_token
      else
        rejected = false
        token = url.query.oauth_token
      if @callbacks[token]
        @callbacks[token](rejected)
        delete @callbacks[token]
    data = ''
    request.on 'data', (dataFragment) -> data += dataFragment
    request.on 'end', =>
      if @faviconFile and (url.pathname is '/favicon.ico')
        @sendFavicon response
      else
        @closeBrowser response

  # Renders a response that will close the browser window used for OAuth.
  closeBrowser: (response) ->
    closeHtml = """
                <!doctype html>
                <script type="text/javascript">window.close();</script>
                <p>Please close this window.</p>
                """
    response.writeHead(200,
      {'Content-Length': closeHtml.length, 'Content-Type': 'text/html' })
    response.write closeHtml
    response.end()

  # Renders the favicon file.
  sendFavicon: (response) ->
    @fs.readFile @faviconFile, (error, data) ->
      response.writeHead(200,
        { 'Content-Length': data.length, 'Content-Type': 'image/x-icon' })
      response.write data
      response.end()
