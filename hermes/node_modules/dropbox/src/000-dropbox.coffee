# This will be a shorthand for the main class in the high-level Dropbox API.
#
# For now, it only serves as the dropbox.js namespace.
Dropbox = ->
  # In the future, this will be a constructor call.
  null

# Namespace for internal functions that are only exposed for testing purposes.
#
# The APIs in Dropbox.Util are not covered by the library's semver promise, and
# can change on a whim.
Dropbox.Util = {}
