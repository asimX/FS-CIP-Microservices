/*
 Copyright (c) IBM Corp. 2013,2017,2018. All Rights Reserved.
 This project is licensed under the MIT License, full text below.

Author: Dennis W. Ashby, dennis.ashby@us.ibm.com

 --------

 MIT license

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
*/

'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var dash = require('appmetrics-dash');
dash.attach({title: 'Acme Mart Utility API Metrics Dashboard'});

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);

    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.shutdown = function shutdown(retcode) {
  console.log('Shutting down...');

  console.log('Shutting down New Order event streams consumer.');
  if (app.newOrderConsumer && app.newOrderConsumer.isConnected()) {
    app.newOrderConsumer.disconnect();
    console.log('Disconnected NEW order consumer.');
  } else {
    console.log('ALREADY DISCONNECTED from NEW order consumer???');
  }

  clearInterval(app.newOrderConsumerLoop);

  console.log('Shutting down Update Order event streams producer.');
  if (app.updateOrderProducer && app.updateOrderProducer.isConnected()) {
    try {
      // Not supported yet !
      // app.updateOrderProducer.flush(1000);
    } catch (err) {
      console.log(err);
    }
    app.updateOrderProducer.disconnect();
    console.log('Disconnected UPDATE order producer.');
  } else {
    console.log('ALREADY DISCONNECTED from UPDATE order producer???');
  }

  console.log('Shutting down Update Order event streams consumer.');
  if (app.updateOrderConsumer && app.updateOrderConsumer.isConnected()) {
    app.updateOrderConsumer.disconnect();
    console.log('Disconnected UPDATE order consumer.');
  } else {
    console.log('ALREADY DISCONNECTED from UPDATE order consumer???');
  }

  clearInterval(app.updateOrderConsumerLoop);

  console.log('Waiting 5 seconds for connections to close...');

  setTimeout(function() {
     process.exit(retcode);
  }, 5000);
};

process.on('SIGTERM', function() {
  console.log('Shutdown received - stopping event streams listeners.');
  app.shutdown(0);
});

process.on('SIGINT', function() {
  console.log('Shutdown received - stopping event streams listeners.');
  app.shutdown(0);
});
