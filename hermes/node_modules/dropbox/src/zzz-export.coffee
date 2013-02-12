# All changes to the global namespace happen here.

# This file's name is set up in such a way that it will always show up last in
# the source directory. This makes coffee --join work as intended.

if typeof module isnt 'undefined' and 'exports' of module
  # We're a node.js module, so export the Dropbox class.
  module.exports = Dropbox
else if window?
  # We're in a browser, so add Dropbox to the global namespace.
  if window.Dropbox
    # Someone's stepping on our toes. It's most likely the Chooser library.
    window.Dropbox[name] = value for own name, value of Dropbox
  else
    window.Dropbox = Dropbox
else
  throw new Error 'This library only supports node.js and modern browsers.'
