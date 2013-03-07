# Base class for drivers that run in the browser.
#
# Inheriting from this class makes a driver use HTML5 localStorage to preserve
# OAuth tokens across page reloads.
class Dropbox.Drivers.BrowserBase
  # Sets up the OAuth driver.
  #
  # Subclasses should pass the options object they receive to the superclass
  # constructor.
  #
  # @param {?Object} options the advanced settings below
  # @option options {Boolean} useQuery if true, the page will receive OAuth
  #   data as query parameters; by default, the page receives OAuth data in
  #   the fragment part of the URL (the string following the #,
  #   available as document.location.hash), to avoid confusing the server
  #   generating the page
  # @option options {Boolean} rememberUser if true, the user's OAuth tokens are
  #   saved in localStorage; if you use this, you MUST provide a UI item that
  #   calls signOut() on Dropbox.Client, to let the user "log out" of the
  #   application
  # @option options {String} scope embedded in the localStorage key that holds
  #   the authentication data; useful for having multiple OAuth tokens in a
  #   single application
  constructor: (options) ->
    @rememberUser = options?.rememberUser or false
    @useQuery = options?.useQuery or false
    @scope = options?.scope or 'default'
    @storageKey = null

    @dbTokenRe = new RegExp "(#|\\?|&)dboauth_token=([^&#]+)(&|#|$)"
    @rejectedRe = new RegExp "(#|\\?|&)not_approved=true(&|#|$)"
    @tokenRe = new RegExp "(#|\\?|&)oauth_token=([^&#]+)(&|#|$)"

  # The magic happens here.
  onAuthStateChange: (client, callback) ->
    @setStorageKey client

    switch client.authState
      when DropboxClient.RESET
        @loadCredentials (credentials) =>
          return callback() unless credentials

          if credentials.authState  # Incomplete authentication.
            client.setCredentials credentials
            return callback()

          # There is an old access token. Only use it if the app supports
          # logout.
          unless @rememberUser
            @forgetCredentials()
            return callback()

          # Verify that the old access token still works.
          client.setCredentials credentials
          client.getUserInfo (error) =>
            if error
              client.reset()
              @forgetCredentials callback
            else
              callback()
      when DropboxClient.REQUEST
        @storeCredentials client.credentials(), callback
      when DropboxClient.DONE
        if @rememberUser
          return @storeCredentials(client.credentials(), callback)
        @forgetCredentials callback
      when DropboxClient.SIGNED_OFF
        @forgetCredentials callback
      when DropboxClient.ERROR
        @forgetCredentials callback
      else
        callback()
        @

  # Computes the @storageKey used by loadCredentials and forgetCredentials.
  #
  # @private
  # This is called by onAuthStateChange.
  #
  # @param {Dropbox.Client} client the client instance that is running the
  #     authorization process
  # @return {Dropbox.Driver} this, for easy call chaining
  setStorageKey: (client) ->
    # NOTE: the storage key is dependent on the app hash so that multiple apps
    #       hosted off the same server don't step on eachother's toes
    @storageKey = "dropbox-auth:#{@scope}:#{client.appHash()}"
    @

  # Stores a Dropbox.Client's credentials to localStorage.
  #
  # @private
  # onAuthStateChange calls this method during the authentication flow.
  #
  # @param {Object} credentials the result of a Drobpox.Client#credentials call
  # @param {function()} callback called when the storing operation is complete
  # @return {Dropbox.Drivers.BrowserBase} this, for easy call chaining
  storeCredentials: (credentials, callback) ->
    localStorage.setItem @storageKey, JSON.stringify(credentials)
    callback()
    @

  # Retrieves a token and secret from localStorage.
  #
  # @private
  # onAuthStateChange calls this method during the authentication flow.
  #
  # @param {function(?Object)} callback supplied with the credentials object
  #   stored by a previous call to
  #   Dropbox.Drivers.BrowserBase#storeCredentials; null if no credentials were
  #   stored, or if the previously stored credentials were deleted
  # @return {Dropbox.Drivers.BrowserBase} this, for easy call chaining
  loadCredentials: (callback) ->
    jsonString = localStorage.getItem @storageKey
    unless jsonString
      callback null
      return @

    try
      callback JSON.parse(jsonString)
    catch jsonError
      # Parse errors.
      callback null
    @

  # Deletes information previously stored by a call to storeCredentials.
  #
  # @private
  # onAuthStateChange calls this method during the authentication flow.
  #
  # @param {function()} callback called after the credentials are deleted
  # @return {Dropbox.Drivers.BrowserBase} this, for easy call chaining
  forgetCredentials: (callback) ->
    localStorage.removeItem @storageKey
    callback()
    @

  # Pre-computes the static parts of url()'s return value.
  #
  # @param {String} baseUrl
  # @return {[String, String]} the static prefix and suffix in url()'s return
  #     value; the changing part is the URL-encoded OAuth token
  computeUrl: (baseUrl) ->
    querySuffix =
        "_dropboxjs_scope=#{encodeURIComponent(@scope)}&dboauth_token="
    location = baseUrl
    if location.indexOf('#') is -1
      fragment = null
    else
      locationPair = location.split '#', 2
      location = locationPair[0]
      fragment = locationPair[1]
    if @useQuery
      if location.indexOf('?') is -1
        location += "?#{querySuffix}"  # No query string in the URL.
      else
        location += "&#{querySuffix}"  # The URL already has a query string.

      if fragment
        [location, '#' + fragment]
      else
        [location, '']
    else
      [location + '#?' + querySuffix, '']

  # Figures out if the user completed the OAuth flow based on the current URL.
  #
  # @param {?String} the URL to check; if not given, the current location's URL
  #   is checked
  # @return {?String} the OAuth token that the user just authorized, or null if
  #   the user accessed this directly, without having authorized a token
  locationToken: (url) ->
    location = url or Dropbox.Drivers.BrowserBase.currentLocation()

    # Check for the scope.
    scopePattern = "_dropboxjs_scope=#{encodeURIComponent @scope}&"
    return null if location.indexOf?(scopePattern) is -1

    # Check for not_approved=true
    if @rejectedRe.test(location)
      match = @dbTokenRe.exec location
      if match
        # TODO(pwnall): indicate that the user did not approve the app.
        return decodeURIComponent(match[2])
      else
        return null

    # Extract the oauth_token.
    match = @tokenRe.exec location
    return decodeURIComponent(match[2]) if match

    null

  # Wrapper for window.location, for testing purposes.
  #
  # @return {String} the current page's URL
  @currentLocation: ->
    window.location.href


# OAuth driver that uses a redirect and localStorage to complete the flow.
class Dropbox.Drivers.Redirect extends Dropbox.Drivers.BrowserBase
  # Sets up the redirect-based OAuth driver.
  #
  # @param {?Object} options the advanced settings below
  # @option options {Boolean} useQuery if true, the page will receive OAuth
  #   data as query parameters; by default, the page receives OAuth data in
  #   the fragment part of the URL (the string following the #,
  #   available as document.location.hash), to avoid confusing the server
  #   generating the page
  # @option options {Boolean} rememberUser if true, the user's OAuth tokens are
  #   saved in localStorage; if you use this, you MUST provide a UI item that
  #   calls signOut() on Dropbox.Client, to let the user "log out" of the
  #   application
  # @option options {String} scope embedded in the localStorage key that holds
  #   the authentication data; useful for having multiple OAuth tokens in a
  #   single application
  constructor: (options) ->
    super options
    [@receiverUrl1, @receiverUrl2] =
        @computeUrl Dropbox.Drivers.BrowserBase.currentLocation()

  # Forwards the authentication process from REQUEST to AUTHORIZED on redirect.
  onAuthStateChange: (client, callback) ->
    superCall = do => => super client, callback
    @setStorageKey client
    if client.authState is DropboxClient.RESET
      @loadCredentials (credentials) =>
        if credentials and credentials.authState  # Incomplete authentication.
          if credentials.token is @locationToken() and
              credentials.authState is DropboxClient.REQUEST
            # locationToken matched, so the redirect happened
            credentials.authState = DropboxClient.AUTHORIZED
            return @storeCredentials credentials, superCall
          else
            # The authentication process broke down, start over.
            return @forgetCredentials superCall
        superCall()
    else
      superCall()

  # URL of the current page, since the user will be sent right back.
  url: (token) ->
    @receiverUrl1 + encodeURIComponent(token) + @receiverUrl2

  # Redirects to the authorize page.
  doAuthorize: (authUrl) ->
    window.location.assign authUrl

# OAuth driver that uses a popup window and postMessage to complete the flow.
class Dropbox.Drivers.Popup extends Dropbox.Drivers.BrowserBase
  # Sets up a popup-based OAuth driver.
  #
  # @param {?Object} options one of the settings below; leave out the argument
  #   to use the current location for redirecting
  # @option options {Boolean} rememberUser if true, the user's OAuth tokens are
  #   saved in localStorage; if you use this, you MUST provide a UI item that
  #   calls signOut() on Dropbox.Client, to let the user "log out" of the
  #   application
  # @option options {String} scope embedded in the localStorage key that holds
  #   the authentication data; useful for having multiple OAuth tokens in a
  #   single application
  # @option options {String} receiverUrl URL to the page that receives the
  #   /authorize redirect and performs the postMessage
  # @option options {Boolean} useQuery if true, the receiverUrl will be
  #   modified by adding query arguments; by default, a hash "#" is appended to
  #   URLs that don't have one, so the OAuth token information is contained in
  #   the URL fragment and does not hit the file server
  # @option options {String} receiverFile the URL to the receiver page will be
  #   computed by replacing the file name (everything after the last /) of
  #   the current location with this parameter's value
  constructor: (options) ->
    super options
    [@receiverUrl1, @receiverUrl2] = @computeUrl @baseUrl(options)

  # Removes credentials stuck in the REQUEST stage.
  onAuthStateChange: (client, callback) ->
    superCall = do => => super client, callback
    @setStorageKey client
    if client.authState is DropboxClient.RESET
      @loadCredentials (credentials) =>
        if credentials and credentials.authState  # Incomplete authentication.
          # The authentication process broke down, start over.
          return @forgetCredentials superCall
        superCall()
    else
      superCall()

  # Shows the authorization URL in a pop-up, waits for it to send a message.
  doAuthorize: (authUrl, token, tokenSecret, callback) ->
    @listenForMessage token, callback
    @openWindow authUrl

  # URL of the redirect receiver page, which posts a message back to this page.
  url: (token) ->
    @receiverUrl1 + encodeURIComponent(token) + @receiverUrl2

  # The URL of the page that will receive the OAuth callback.
  #
  # @param {Object} options the options passed to the constructor
  # @option options {String} receiverUrl URL to the page that receives the
  #   /authorize redirect and performs the postMessage
  # @option options {String} receiverFile the URL to the receiver page will be
  #   computed by replacing the file name (everything after the last /) of
  #   the current location with this parameter's value
  # @return {String} absolute URL of the receiver page
  baseUrl: (options) ->
    if options
      if options.receiverUrl
        return options.receiverUrl
      else if options.receiverFile
        fragments = Dropbox.Drivers.BrowserBase.currentLocation().split '/'
        fragments[fragments.length - 1] = options.receiverFile
        return fragments.join('/')
    Dropbox.Drivers.BrowserBase.currentLocation()

  # Creates a popup window.
  #
  # @param {String} url the URL that will be loaded in the popup window
  # @return {?DOMRef} reference to the opened window, or null if the call
  #   failed
  openWindow: (url) ->
    window.open url, '_dropboxOauthSigninWindow', @popupWindowSpec(980, 700)

  # Spec string for window.open to create a nice popup.
  #
  # @param {Number} popupWidth the desired width of the popup window
  # @param {Number} popupHeight the desired height of the popup window
  # @return {String} spec string for the popup window
  popupWindowSpec: (popupWidth, popupHeight) ->
    # Metrics for the current browser window.
    x0 = window.screenX ? window.screenLeft
    y0 = window.screenY ? window.screenTop
    width = window.outerWidth ? document.documentElement.clientWidth
    height = window.outerHeight ? document.documentElement.clientHeight

    # Computed popup window metrics.
    popupLeft = Math.round x0 + (width - popupWidth) / 2
    popupTop = Math.round y0 + (height - popupHeight) / 2.5
    popupLeft = x0 if popupLeft < x0
    popupTop = y0 if popupTop < y0

    # The specification string.
    "width=#{popupWidth},height=#{popupHeight}," +
      "left=#{popupLeft},top=#{popupTop}" +
      'dialog=yes,dependent=yes,scrollbars=yes,location=yes'

  # Listens for a postMessage from a previously opened popup window.
  #
  # @param {String} token the token string that must be received from the popup
  #   window
  # @param {function()} called when the received message matches the token
  listenForMessage: (token, callback) ->
    listener = (event) =>
      if event.data
        # Message coming from postMessage.
        data = event.data
      else
        # Message coming from Dropbox.EventSource.
        data = event

      if @locationToken(data) is token
        token = null  # Avoid having this matched in the future.
        window.removeEventListener 'message', listener
        Dropbox.Drivers.Popup.onMessage.removeListener listener
        callback()
    window.addEventListener 'message', listener, false
    Dropbox.Drivers.Popup.onMessage.addListener listener

  # Communicates with the driver from the OAuth receiver page.
  @oauthReceiver: ->
    window.addEventListener 'load', ->
      opener = window.opener
      if window.parent isnt window.top
        opener or= window.parent
      if opener
        try
          opener.postMessage window.location.href, '*'
        catch ieError
          # IE 9 doesn't support opener.postMessage for popup windows.
        try
          # postMessage doesn't work in IE, but direct object access does.
          opener.Dropbox.Drivers.Popup.onMessage.dispatch(
              window.location.href)
        catch frameError
          # Hopefully postMessage worked.
      window.close()

  # Works around postMessage failures on Internet Explorer.
  @onMessage = new Dropbox.EventSource
