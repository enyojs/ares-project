/* global module  */
/**
 * Simple FormData storing base64 encoded file
 */

var FORM_DATA_LINE_BREAK = '\r\n';

(function() {

	var SimpleFormData = {
		generateBoundary: function() {
			// This generates a 50 character boundary similar to those used by Firefox.
			// They are optimized for boyer-moore parsing.
			var boundary = '--------------------------';
			for (var i = 0; i < 24; i++) {
				boundary += Math.floor(Math.random() * 10).toString(16);
			}

			return boundary;
		},

		getContentTypeHeader: function(boundary) {
			return 'multipart/form-data; boundary=' + boundary;
		},

		getPartHeader: function(filename, boundary) {
			var header = '--' + boundary + FORM_DATA_LINE_BREAK;
			header += 'Content-Disposition: form-data; name="file"';

			header += '; filename="' + filename + '"' + FORM_DATA_LINE_BREAK;
			header += 'Content-Type: application/octet-stream; x-encoding=base64';

			header += FORM_DATA_LINE_BREAK + FORM_DATA_LINE_BREAK;
			return header;
		},

		getPartFooter: function() {
			return FORM_DATA_LINE_BREAK;
		},

		getLastPartFooter: function(boundary) {
			return '--' + boundary + '--';
		}
	};

	module.exports = SimpleFormData;
})();
	
