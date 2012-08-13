# Hermes Local FileSystemProvider
This is an example component that allows access to files stored on the local filesystem.

## Usage
Although it is made to be started by the ARES IDE server itself, this component can be started manually & later be used by the IDE directly.  This is useful for debugging.

Parameters:

* `$1` is `port` (optional): the local IPv4 port to use to serve ARES IDE file requests.  It defalto zero (0), letting the ssytem dynamically allocate the port should many users use the ARES IDE on the same machine (eg. an IDE server).
* `$2` is `directory` (unused): the location from which the local FileSystemProvider will serve files & folders.
* `$3`  is `secure` (optional): when not falsy, causes the server to use HTTP/SSL instead of plain HTTP.

## SSL access to local file-system

The *Local FileSystemProvider* Hermes component probably doesn't strictly *need* to use SSL as its transport, but it seemed reasonable to use it as an example of how to set this up, as most other Hermes components will want/need to use SSL in order to secure data passed through them.  SSL is active only when the provider is started with a second argument.

### Generating keys
The key and certificate in the certs/ directory were created using the OpenSSL tools, following [the instructions](http://www.openssl.org/docs/HOWTO/certificates.txt) on the OpenSSL website. Because this is a "self signed" certificate, you will need to approve the certificate in your web browser before you'll be able to use it with Ares.

### Approving the certificate
To approve the certificate, start the server, then navigate to http://localhost:9010 in your browser. This will give you the opportunity to approve the certificate. We recommend that you *do not* check the box that says to "always trust" certificates signed by enyojs.com. Since the signing key is included in this distribution, anyone can make a certificate that matches this key.
 
