BufferedStream is a reliable base class for streams in node programs that
buffers data until the next tick of the event loop.

## Rationale

The details of streams are still being worked out in node core. As of this
writing there are several different types of streams in node, including some
objects that do not actually inherit from Stream. The goal of this library is
to iron out the differences between the various stream-like objects and give
user code a reliable, documented API they can use now. If the situation ever
improves in node core (which we all hope it will) this code may become obsolete.

## Installation

Using [npm](http://npmjs.org):

    $ npm install bufferedstream

## Usage

The key feature of this class is that anything you write to the stream in the
current tick of the event loop is buffered until the next tick. This allows you
to register event handlers, pause the stream, etc. reliably without losing any
data.

    var stream = new BufferedStream;
    stream.write("Hello ");
    stream.pause();

    setTimeout(function () {
        stream.write("IHdvcmxkLg==", "base64");
        stream.resume();
        stream.on("data", function (chunk) {
            console.log(chunk.toString()); // Hello world.
        });
    }, 10);

The `BufferedStream` constructor may also accept a "source" which may be another
stream that will be piped directly through to this stream or a string. This is
useful for wrapping various stream-like objects and normalizing their behavior
across implementations.

Please see the source code for more information. The module is small enough (and
well-documented) that it should be easy to digest in a quick skim.

## Tests

Run the tests with [vows](http://vowsjs.org):

    $ vows bufferedstream_test.js

## License

Copyright 2011 Michael Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

The software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose and non-infringement. In no event shall the
authors or copyright holders be liable for any claim, damages or other
liability, whether in an action of contract, tort or otherwise, arising from,
out of or in connection with the software or the use or other dealings in
the software.
