describe 'Dropbox.Drivers.Chrome', ->
  beforeEach ->
    @chrome_app = chrome? and (chrome.extension or chrome.app?.runtime)
    @client = new Dropbox.Client testKeys

  describe '#url', ->
    beforeEach ->
      return unless @chrome_app
      @path = 'test/html/redirect_driver_test.html'
      @driver = new Dropbox.Drivers.Chrome receiverPath: @path

    it 'produces a chrome-extension:// url', ->
      return unless @chrome_app
      expect(@driver.url('oauth token')).to.match(/^chrome-extension:\/\//)

    it 'produces an URL with the correct suffix', ->
      return unless @chrome_app
      url = @driver.url 'oauth token'
      suffix = @path + '?_dropboxjs_scope=default&dboauth_token=oauth%20token'
      expect(url.substring(url.length - suffix.length)).to.equal suffix

  describe '#loadCredentials', ->
    beforeEach ->
      return unless @chrome_app
      @client = new Dropbox.Client testKeys
      @driver = new Dropbox.Drivers.Chrome scope: 'some_scope'

    it 'produces the credentials passed to storeCredentials', (done) ->
      return done() unless @chrome_app
      goldCredentials = @client.credentials()
      @driver.storeCredentials goldCredentials, =>
        @driver = new Dropbox.Drivers.Chrome scope: 'some_scope'
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.deep.equal goldCredentials
          done()

    it 'produces null after forgetCredentials was called', (done) ->
      return done() unless @chrome_app
      @driver.storeCredentials @client.credentials(), =>
        @driver.forgetCredentials =>
          @driver = new Dropbox.Drivers.Chrome scope: 'some_scope'
          @driver.loadCredentials (credentials) ->
            expect(credentials).to.equal null
            done()

    it 'produces null if a different scope is provided', (done) ->
      return done() unless @chrome_app
      @driver.storeCredentials @client.credentials(), =>
        @driver = new Dropbox.Drivers.Chrome scope: 'other_scope'
        @driver.loadCredentials (credentials) ->
          expect(credentials).to.equal null
          done()

  describe 'integration', ->
    it 'should work', (done) ->
      return done() unless @chrome_app
      @timeout 45 * 1000  # Time-consuming because the user must click.

      client = new Dropbox.Client testKeys
      client.reset()
      authDriver = new Dropbox.Drivers.Chrome(
          receiverPath: 'test/html/chrome_oauth_receiver.html',
          scope: 'chrome_integration')
      client.authDriver authDriver
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
