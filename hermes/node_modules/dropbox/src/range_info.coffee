# Parsed HTTP Content-Range header.
class Dropbox.RangeInfo
  # Creates a RangeInfo instance from the value of a Content-Range HTTP header.
  @parse: (headerValue) ->
    if typeof headerValue is 'string'
      new Dropbox.RangeInfo headerValue
    else
      headerValue

  # @property {Number} 0-based position of the first byte read from the file
  start: null

  # @property {Number} the file's total size, in bytes
  size: null

  # @property {Number} 0-based position of the last byte read from the file
  end: null

  # Creates a RangeInfo instance from the value of a Content-Range HTTP header.
  #
  # @private
  # This constructor is used by Dropbox.RangeInfo.parse, and should not be
  # called directly.
  #
  # @param {Object} headerValue the Content-Range HTTP header value
  constructor: (headerValue) ->
    if match = /^bytes (\d*)-(\d*)\/(.*)$/.exec headerValue
      @start = parseInt match[1]
      @end = parseInt match[2]
      if match[3] is '*'
        @size = null
      else
        @size = parseInt match[3]
    else
      @start = 0
      @end = 0
      @size = null

