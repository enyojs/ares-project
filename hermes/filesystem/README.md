# Hermes "local filesystem" component
This is an example component that allows access to files stored on the local filesystem.

## A note on On SSL keys for Hermes components
The "local filesystem" Hermes component probably doesn't strictly *need* to use SSL as its transport, but it seemed reasonable to use
it as an example of how to set this up, as most other Hermes components will want/need to use SSL in order to secure data passed through them.

### Generating keys
The key and certificate in the certs/ directory were created using the OpenSSL tools, following [the instructions](http://www.openssl.org/docs/HOWTO/certificates.txt) on the OpenSSL website. Because this is a "self signed" certificate, you will need to approve the certificate in your web browser before you'll be able to use it with Ares.

### Approving the certificate
To approve the certificate, start the server, then navigate to http://localhost:9010 in your browser. This will give you the opportunity to approve the certificate. We recommend that you *do not* check the box that says to "always trust" certificates signed by enyojs.com. Since the signing key is included in this distribution, anyone can make a certificate that matches this key.
 
