chrome.app.runtime.onLaunched.addListener ->
  chrome.app.window.create 'test/html/browser_test.html',
      frame: 'chrome', id: 'browser_test',
      width: window.screen.availWidth, height: window.screen.availHeight
