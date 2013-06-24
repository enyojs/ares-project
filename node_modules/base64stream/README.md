base64Stream
============

Correctly encode any streamed content into base64 (Node.js)

Based upon https://github.com/mikeal/morestreams

## Why?

Because base64 encodes chunks of 3 bytes at a time, and simply adds a special character (=) to the end in case the number of bytes in the Buffer to be encoded isn't even (in this case even refers to dividable by 3), you can't simply add .toString('base64') when data is emitted. The special character should only occur in the end of the streamed content, and thus you'll have to check every chunk of data streamed and make sure it consist of an even number of bytes, any bytes above will have to be pushed to the beginning of the next chunk and encoded with it. This lib takes care of this for you and simply converts your content into properly base64 encoded content.

## Example: Encode a file to base64
```
var base64Stream = require('base64Stream');

var stream = new base64Stream.BufferedStreamToBase64();
fs.createReadStream(file.path).pipe(stream);

// Use stream and it will output it's data correctly encoded into base64
```

## MIT License
Copyright (c) 2012 by Carl-Johan Blomqvist

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.