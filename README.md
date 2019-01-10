# Acme Mart Utility API


## Prerequisites
* [Node.js](https://nodejs.org/en/) 6.X LTS
* [node-gyp] (https://www.npmjs.com/package/node-gyp)

Node-rdkafka will build librdkafka automatically. You must ensure you have the dependencies listed below installed. For more details, see [librdakfka's instructions](../../docs/librdkafka.md).

##### Linux
* openssl-dev
* libsasl2-dev
* libsasl2-modules
* C++ toolchain

##### macOS
* [Brew](http://brew.sh/)
* [Apple Xcode command line tools](https://developer.apple.com/xcode/)
* `openssl` via Brew
* Export `CPPFLAGS=-I/usr/local/opt/openssl/include` and `LDFLAGS=-L/usr/local/opt/openssl/lib`
* Open Keychain Access, export all certificates in System Roots to a single .pem file

## Installing dependencies
Run the following commands on your local machine, after the prerequisites for your environment have been completed:
```shell
npm install
```

## Running on cloud
* IBM Cloud/Ubuntu: '/etc/ssl/certs'
* Red Hat: '/etc/pki/tls/cert.pem',
* Mac OS X: select System root certificates from Keychain Access and export as .pem on the filesystem

## Dockerfile (using current Node LTS)
* docker build . -t acmemartutilityapi
* docker run --rm -it acmemartutilityapi

## Order Fulfilment
* 1 - Order is received, either in person, on the phone, via email, etc.
* 2 - Order is sent to the warehouse. A paper order might be taken to the warehouse as part of a batch, or it is sent directly from an invoicing or sales order management application.
* 3 - Order is picked: a worker goes into the warehouse, finds the items in the order, and picks them off the shelf.
* 4 - Order is packed to prepare for shipping.
* 5 - Order is shipped.






<pre>
Proudly created for:
*****************************************************
███████████  ████████████      ████████      ████████
███████████  ███████████████   █████████    █████████
   █████        ████   █████     ████████  ████████
   █████        ███████████      ████  ███ ███ ████
   █████        ███████████      ████  ███████ ████
   █████        ████   █████     ████   █████  ████
███████████  ███████████████   ██████    ███   ██████
███████████  ████████████      ██████     █    ██████
*****************************************************
</pre>
