describe 'Dropbox.Drivers.BrowserBase', ->
  beforeEach ->
    @node_js = module? and module?.exports? and require?
    @chrome_app = chrome? and (chrome.extension or chrome.app)
    @client = new Dropbox.Client testKeys

  describe 'with rememberUser: false', ->
    beforeEach (done) ->
      return done() if @node_js or @chrome_app
      @driver = new Dropbox.Drivers.BrowserBase
      @driver.setStorageKey @client
      @driver.forgetCredentials done

    afterEach (done) ->
      return done() if @node_js or @chrome_app
      @driver.forgetCredentials done

    describe '#loadCredentials', ->
      it 'produces the credentials passed to storeCredentials', (done) ->
        return done() if @node_js or @chrome_app
        goldCredentials = @client.credentials()
        @driver.storeCredentials goldCredentials, =>
          @driver.loadCredentials (credentials) ->
            expect(credentials).to.deep.equal goldCredentials
            done()

      it 'produces null after forgetCredentials was called', (done) ->
        return done() if @node_js or @chrome_app
        @driver.storeCredentials @client.credentials(), =>
          @driver.forgetCredentials =>
            @driver.loadCredentials (credentials) ->
              expect(credentials).to.equal null
              done()

      it 'produces null if a different scope is provided', (done) ->
        return done() if @node_js or @chrome_app
        @driver.setStorageKey @client
        @driver.storeCredentials @client.credentials(), =>
          @driver.forgetCredentials =>
            @driver.loadCredentials (credentials) ->
              expect(credentials).to.equal null
              done()

  describe '#locationToken', ->
    beforeEach ->
      @stub = sinon.stub Dropbox.Drivers.BrowserBase, 'currentLocation'
    afterEach ->
      @stub.restore()

    it 'returns null if the location does not contain the token', ->
      @stub.returns 'http://test/file?_dropboxjs_scope=default&' +
                    'another_token=ab%20cd&oauth_tok=en'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

    it 'returns null if the rejected location does not contain the token', ->
      @stub.returns 'http://test/file?_dropboxjs_scope=default&' +
                    'another_token=ab%20cd&dboauth_tok=en&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

    it 'returns null if the location fragment does not contain the token', ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=default& ' +
                    'another_token=ab%20cd&oauth_tok=en'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

    it 'returns null if the rejected location fragment misses the token', ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=default& ' +
                    'another_token=ab%20cd&dboauth_tok=en&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

    it "extracts a token successfully with default scope", ->
      @stub.returns 'http://test/file?_dropboxjs_scope=default&' +
                    'oauth_token=ab%20cd&other_param=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a rejected token successfully with default scope", ->
      @stub.returns 'http://test/file?_dropboxjs_scope=default&' +
                    'dboauth_token=ab%20cd&other_param=true&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a token successfully with set scope", ->
      @stub.returns 'http://test/file?_dropboxjs_scope=not%20default&' +
                    'oauth_token=ab%20cd'
      driver = new Dropbox.Drivers.BrowserBase scope: 'not default'
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a rejected token successfully with set scope", ->
      @stub.returns 'http://test/file?_dropboxjs_scope=not%20default&' +
                    'dboauth_token=ab%20cd&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase scope: 'not default'
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a token from a fragment with default scope", ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=default&' +
                    'oauth_token=ab%20cd&other_param=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a rejected token from a fragment with default scope", ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=default&' +
                    'dboauth_token=ab%20cd&other_param=true&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a token from a fragment with set scope", ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=not%20default&' +
                    'oauth_token=ab%20cd'
      driver = new Dropbox.Drivers.BrowserBase scope: 'not default'
      expect(driver.locationToken()).to.equal 'ab cd'

    it "extracts a rejected token from a fragment with set scope", ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=not%20default&' +
                    'dboauth_token=ab%20cd&not_approved=true'
      driver = new Dropbox.Drivers.BrowserBase scope: 'not default'
      expect(driver.locationToken()).to.equal 'ab cd'

    it "returns null if the location scope doesn't match", ->
      @stub.returns 'http://test/file?_dropboxjs_scope=defaultx&oauth_token=ab'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

    it "returns null if the location fragment scope doesn't match", ->
      @stub.returns 'http://test/file#?_dropboxjs_scope=defaultx&oauth_token=a'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.locationToken()).to.equal null

  describe '#computeUrl', ->
    it 'adds a query string to a static URL', ->
      baseUrl = 'http://test/file'
      driver = new Dropbox.Drivers.BrowserBase useQuery: true
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?_dropboxjs_scope=default&dboauth_token=', ''])

    it 'adds a fragment to a static URL', ->
      baseUrl = 'http://test/file'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file#?_dropboxjs_scope=default&dboauth_token=', ''])

    it 'adds a query param to a URL with a query string', ->
      baseUrl = 'http://test/file?a=true'
      driver = new Dropbox.Drivers.BrowserBase useQuery: true
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?a=true&_dropboxjs_scope=default&dboauth_token=',
           ''])

    it 'adds a fragment to a URL with a query string', ->
      baseUrl = 'http://test/file?a=true'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?a=true#?_dropboxjs_scope=default&dboauth_token=',
           ''])

    it 'adds a query string to a static URL with a fragment', ->
      baseUrl = 'http://test/file#fragment'
      driver = new Dropbox.Drivers.BrowserBase useQuery: true
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?_dropboxjs_scope=default&dboauth_token=',
           '#fragment'])

    it 'replaces the fragment in a static URL with a fragment', ->
      baseUrl = 'http://test/file#fragment'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file#?_dropboxjs_scope=default&dboauth_token=', ''])

    it 'adds a query param to a URL with a query string and fragment', ->
      baseUrl = 'http://test/file?a=true#frag'
      driver = new Dropbox.Drivers.BrowserBase useQuery: true
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?a=true&_dropboxjs_scope=default&dboauth_token=',
           '#frag'])

    it 'replaces the fragment in a URL with a query string and fragment', ->
      baseUrl = 'http://test/file?a=true#frag'
      driver = new Dropbox.Drivers.BrowserBase
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?a=true#?_dropboxjs_scope=default&dboauth_token=',
           ''])

    it 'obeys the scope option', ->
      baseUrl = 'http://test/file'
      driver = new Dropbox.Drivers.BrowserBase(
          scope: 'not default', useQuery: true)
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file?_dropboxjs_scope=not%20default&dboauth_token=',
           ''])

    it 'obeys the scope option when adding a fragment', ->
      baseUrl = 'http://test/file'
      driver = new Dropbox.Drivers.BrowserBase scope: 'not default'
      expect(driver.computeUrl(baseUrl)).to.deep.equal(
          ['http://test/file#?_dropboxjs_scope=not%20default&dboauth_token=',
           ''])

describe 'Dropbox.Drivers.Redirect', ->
  describe '#url', ->
    beforeEach ->
      @stub = sinon.stub Dropbox.Drivers.BrowserBase, 'currentLocation'
    afterEach ->
      @stub.restore()

    it 'adds a query param to a URL with a query string', ->
      @stub.returns 'http://test/file?a=true'
      driver = new Dropbox.Drivers.Redirect useQuery: true
      expect(driver.url('oauth token')).to.
          equal 'http://test/file?a=true&_dropboxjs_scope=default&' +
                'dboauth_token=oauth%20token'

    it 'adds a fragment to a URL with a query string', ->
      @stub.returns 'http://test/file?a=true'
      driver = new Dropbox.Drivers.Redirect
      expect(driver.url('oauth token')).to.
          equal 'http://test/file?a=true#?_dropboxjs_scope=default' +
                '&dboauth_token=oauth%20token'

    it 'obeys the scope option', ->
      @stub.returns 'http://test/file'
      driver = new Dropbox.Drivers.Redirect(
          scope: 'not default', useQuery: true)
      expect(driver.url('oauth token')).to.
          equal 'http://test/file?_dropboxjs_scope=not%20default&' +
                'dboauth_token=oauth%20token'

    it 'obeys the scope option when adding a fragment', ->
      @stub.returns 'http://test/file'
      driver = new Dropbox.Drivers.Redirect scope: 'not default'
      expect(driver.url('oauth token')).to.
          equal 'http://test/file#?_dropboxjs_scope=not%20default&' +
                'dboauth_token=oauth%20token'

  describe '#loadCredentials', ->
    beforeEach ->
      @node_js = module? and module.exports? and require?
      @chrome_app = chrome? and (chrome.extension or chrome.app?.runtime)
      return if @node_js or @chrome_app
      @client = new Dropbox.Client testKeys
      @driver = new Dropbox.Drivers.Redirect scope: 'some_scope'
      @driver.setStorageKey @client

    it 'produces the credentials passed to storeCredentials', (done) ->
      return done() if @node_js or @chrome_app
      goldCredentials = @client.credentials()
      @driver.storeCredentials goldCredentials, =>
        @driver = new Dropbox.Drivers.Redirect scope: 'some_scope'
        @driver.setStorageKey @client
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.deep.equal goldCredentials
          done()

    it 'produces null after forgetCredentials was called', (done) ->
      return done() if @node_js or @chrome_app
      @driver.storeCredentials @client.credentials(), =>
        @driver.forgetCredentials =>
          @driver = new Dropbox.Drivers.Redirect scope: 'some_scope'
          @driver.setStorageKey @client
          @driver.loadCredentials (credentials) ->
            expect(credentials).to.equal null
            done()

    it 'produces null if a different scope is provided', (done) ->
      return done() if @node_js or @chrome_app
      @driver.setStorageKey @client
      @driver.storeCredentials @client.credentials(), =>
        @driver = new Dropbox.Drivers.Redirect scope: 'other_scope'
        @driver.setStorageKey @client
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.equal null
          done()

  describe 'integration', ->
    beforeEach ->
      @node_js = module? and module.exports? and require?
      @chrome_app = chrome? and (chrome.extension or chrome.app?.runtime)

    it 'should work', (done) ->
      return done() if @node_js or @chrome_app
      @timeout 30 * 1000  # Time-consuming because the user must click.

      listenerCalled = false
      listener = (event) ->
        return if listenerCalled is true
        listenerCalled = true
        data = event.data or event
        expect(data).to.match(/^\[.*\]$/)
        [error, credentials] = JSON.parse data
        expect(error).to.equal null
        expect(credentials).to.have.property 'uid'
        expect(credentials.uid).to.be.a 'string'
        window.removeEventListener 'message', listener
        Dropbox.Drivers.Popup.onMessage.removeListener listener
        done()

      window.addEventListener 'message', listener
      Dropbox.Drivers.Popup.onMessage.addListener listener
      (new Dropbox.Drivers.Popup()).openWindow(
          '/test/html/redirect_driver_test.html')

describe 'Dropbox.Drivers.Popup', ->
  describe '#url', ->
    beforeEach ->
      @stub = sinon.stub Dropbox.Drivers.BrowserBase, 'currentLocation'
      @stub.returns 'http://test:123/a/path/file.htmx'

    afterEach ->
      @stub.restore()

    it 'reflects the current page when there are no options', ->
      driver = new Dropbox.Drivers.Popup
      expect(driver.url('oauth token')).to.equal(
        'http://test:123/a/path/file.htmx#?_dropboxjs_scope=default&' +
        'dboauth_token=oauth%20token')

    it 'replaces the current file correctly', ->
      driver = new Dropbox.Drivers.Popup receiverFile: 'another.file'
      expect(driver.url('oauth token')).to.equal(
          'http://test:123/a/path/another.file#?_dropboxjs_scope=default&' +
          'dboauth_token=oauth%20token')

    it 'replaces the current file without a fragment correctly', ->
      driver = new Dropbox.Drivers.Popup
        receiverFile: 'another.file', useQuery: true
      expect(driver.url('oauth token')).to.equal(
          'http://test:123/a/path/another.file?_dropboxjs_scope=default&' +
          'dboauth_token=oauth%20token')

    it 'replaces an entire URL without a fragment correctly', ->
      driver = new Dropbox.Drivers.Popup
        receiverUrl: 'https://something.com/filez'
      expect(driver.url('oauth token')).to.equal(
          'https://something.com/filez#?_dropboxjs_scope=default&' +
          'dboauth_token=oauth%20token')

    it 'replaces an entire URL with a fragment correctly', ->
      driver = new Dropbox.Drivers.Popup
        receiverUrl: 'https://something.com/filez#frag'
      expect(driver.url('oauth token')).to.equal(
          'https://something.com/filez#?_dropboxjs_scope=default&' +
          'dboauth_token=oauth%20token')

    it 'replaces an entire URL without a fragment and useQuery correctly', ->
      driver = new Dropbox.Drivers.Popup
        receiverUrl: 'https://something.com/filez', useQuery: true
      expect(driver.url('oauth token')).to.equal(
            'https://something.com/filez?_dropboxjs_scope=default&' +
            'dboauth_token=oauth%20token')

  describe '#loadCredentials', ->
    beforeEach ->
      @node_js = module? and module.exports? and require?
      @chrome_app = chrome? and (chrome.extension or chrome.app?.runtime)
      return if @node_js or @chrome_app
      @client = new Dropbox.Client testKeys
      @driver = new Dropbox.Drivers.Popup scope: 'some_scope'
      @driver.setStorageKey @client

    it 'produces the credentials passed to storeCredentials', (done) ->
      return done() if @node_js or @chrome_app
      goldCredentials = @client.credentials()
      @driver.storeCredentials goldCredentials, =>
        @driver = new Dropbox.Drivers.Popup scope: 'some_scope'
        @driver.setStorageKey @client
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.deep.equal goldCredentials
          done()

    it 'produces null after forgetCredentials was called', (done) ->
      return done() if @node_js or @chrome_app
      @driver.storeCredentials @client.credentials(), =>
        @driver.forgetCredentials =>
          @driver = new Dropbox.Drivers.Popup scope: 'some_scope'
          @driver.setStorageKey @client
          @driver.loadCredentials (credentials) ->
            expect(credentials).to.equal null
            done()

    it 'produces null if a different scope is provided', (done) ->
      return done() if @node_js or @chrome_app
      @driver.setStorageKey @client
      @driver.storeCredentials @client.credentials(), =>
        @driver = new Dropbox.Drivers.Popup scope: 'other_scope'
        @driver.setStorageKey @client
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.equal null
          done()

  describe 'integration', ->
    beforeEach ->
      @node_js = module? and module.exports? and require?
      @chrome_app = chrome? and (chrome.extension or chrome.app?.runtime)

    it 'should work with a query string', (done) ->
      return done() if @node_js or @chrome_app
      @timeout 45 * 1000  # Time-consuming because the user must click.

      client = new Dropbox.Client testKeys
      client.reset()
      authDriver = new Dropbox.Drivers.Popup
          receiverFile: 'oauth_receiver.html', useQuery: true,
          scope: 'popup-integration', rememberUser: false
      client.authDriver authDriver
      client.authenticate (error, client) =>
        expect(error).to.equal null
        expect(client.authState).to.equal Dropbox.Client.DONE
        # Verify that we can do API calls.
        client.getUserInfo (error, userInfo) ->
          expect(error).to.equal null
          expect(userInfo).to.be.instanceOf Dropbox.UserInfo

          # Follow-up authenticate() should restart the process.
          client.reset()
          client.authenticate interactive: false, (error, client) ->
            expect(error).to.equal null
            expect(client.authState).to.equal Dropbox.Client.RESET
            expect(client.isAuthenticated()).to.equal false
            done()

    it 'should work with a URL fragment and rememberUser: true', (done) ->
      return done() if @node_js or @chrome_app
      @timeout 45 * 1000  # Time-consuming because the user must click.

      client = new Dropbox.Client testKeys
      client.reset()
      authDriver = new Dropbox.Drivers.Popup
        receiverFile: 'oauth_receiver.html', useQuery: false,
        scope: 'popup-integration', rememberUser: true
      client.authDriver authDriver
      authDriver.setStorageKey client
      authDriver.forgetCredentials ->
        client.authenticate (error, client) ->
          expect(error).to.equal null
          expect(client.authState).to.equal Dropbox.Client.DONE
          # Verify that we can do API calls.
          client.getUserInfo (error, userInfo) ->
            expect(error).to.equal null
            expect(userInfo).to.be.instanceOf Dropbox.UserInfo

            # Follow-up authenticate() should use stored credentials.
            client.reset()
            client.authenticate interactive: false, (error, client) ->
              expect(error).to.equal null
              expect(client.authState).to.equal Dropbox.Client.DONE
              expect(client.isAuthenticated()).to.equal true
              # Verify that we can do API calls.
              client.getUserInfo (error, userInfo) ->
                expect(error).to.equal null
                expect(userInfo).to.be.instanceOf Dropbox.UserInfo
                done()
