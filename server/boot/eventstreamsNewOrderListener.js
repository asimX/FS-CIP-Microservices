/*
 Copyright (c) IBM Corp. 2013,2016,2017,2018. All Rights Reserved.
 This project is licensed under the MIT License, full text below.

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

/*
 *  This module is responsible for deleting images that the client uploads.
 *  The process runs on a schedule that is determined bby the setting in the
 *  "scheduler" section of the "config.json" file.
 */

module.exports = function(app, cb) {
  var fs = require('fs');
  var Kafka = require('node-rdkafka');

  var EventStreamsAdminRest = require('message-hub-rest');

  var ConsumerLoop = require('../event-streams/newOrderConsumerLoop.js');

  var adminRestInstance, consumer, services;

  var opts = {};
  var topicName = app.get('eventStreams').topics.newOrderTopicName;

  if (process.env.VCAP_SERVICES) {
    console.log('Using VCAP_SERVICES to find credentials.');

    services = JSON.parse(process.env.VCAP_SERVICES);
    if (services.hasOwnProperty('instance_id')) {
      opts.brokers = services.kafka_brokers_sasl;
      opts.api_key = services.api_key;

      adminRestInstance = new EventStreamsAdminRest(wrap_vcap_service(services.api_key, services.kafka_admin_url));
    } else {
      for (var key in services) {
        if (key.lastIndexOf('messagehub', 0) === 0) {
          var eventStreamsService = services[key][0];
          opts.brokers = eventStreamsService.credentials.kafka_brokers_sasl;
          opts.api_key = eventStreamsService.credentials.api_key;
        }
      }
      adminRestInstance = new EventStreamsAdminRest(services);
    }
    opts.calocation = '/etc/ssl/certs';
  } else {
    // Running locally on development machine
    console.log('Using ENV VARS to find credentials.');

    opts.brokers = app.get('eventStreams').brokerSasl;
    var restEndpoint = app.get('eventStreams').adminURL;
    var apiKey = app.get('eventStreams').apiKey;
    if (apiKey.indexOf(':') != -1) {
      var credentialArray = apiKey.split(':');
      opts.api_key = credentialArray[1];
    } else {
      opts.api_key = apiKey;
    }
    adminRestInstance = new EventStreamsAdminRest(wrap_vcap_service(opts.api_key, restEndpoint));

    // IBM Cloud/Ubuntu: '/etc/ssl/certs'
    // Red Hat: '/etc/pki/tls/cert.pem',
    // Mac OS X: select System root certificates from Keychain Access and export as .pem on the filesystem
    opts.calocation = app.get('eventStreams').certLocation;
    if (!fs.existsSync(opts.calocation)) {
      console.error('Error - Failed to access <cert_location> : ' + opts.calocation);
      process.exit(-1);
    }
  }

  console.log('Kafka Endpoints: ' + opts.brokers);

  if (!opts.hasOwnProperty('brokers') || !opts.hasOwnProperty('api_key') || !opts.hasOwnProperty('calocation')) {
    console.error('Error - Failed to retrieve options. Check that app is bound to an Event Streams service or that command line options are correct.');
    process.exit(-1);
  }

  if (JSON.parse(app.get('eventStreams').onCloud) === true) {
    // Use Event Streams' REST admin API to create the topic
    // with 1 partition and a retention period of 24 hours.
    console.log('Admin REST Endpoint: ' + adminRestInstance.url.format());
    console.log('Creating the topic ' + topicName + ' with Admin REST API');

    adminRestInstance.topics.create(topicName, 1, 24)
      .then(function(response) {
        // If response is an empty object, then the topic was created
        if (Object.keys(response).length === 0 && response.constructor === Object) console.log('Topic ' + topicName + ' created');
        else console.log(response);
      })
      .fail(function(error) {
        console.log(error);
      })
      .done(function() {
        // Use Event Streams' REST admin API to list the existing topics
        adminRestInstance.topics.get()
          .then(function(response) {
            console.log('Admin REST Listing Topics:');
            console.log(response);
          })
          .fail(function(error) {
            console.log(error);
          })
          .done(function() {
            runLoops();
            console.log('Listening for NEW order events...');
          });
      });
  } else {
    runLoops();
    console.log('Listening for NEW order events...');
  }

  // Build and start the producer/consumer
  function runLoops() {
    // Config options common to both consumer and producer
    var driver_options = {
      // 'debug': 'all',
      'metadata.broker.list': opts.brokers,
      'security.protocol': 'sasl_ssl',
      'ssl.ca.location': opts.calocation,
      'sasl.mechanisms': 'PLAIN',
      'sasl.username': 'token',
      'sasl.password': opts.api_key,
      'api.version.request': true,
      'broker.version.fallback': '0.10.2.1',
      'log.connection.close': false
    };

    // var consumer_opts = {
    //  'client.id': 'acmemart-nodejs-new-order-consumer',
    //  'group.id': 'acmemart-nodejs-group'
    // };

    var consumer_opts = {
        'client.id': 'kafka-nodejs-console-sample-consumer',
        'group.id': 'kafka-nodejs-console-sample-group'
    };

    // Add the common options to client and producer
    for (var key in driver_options) {
      consumer_opts[key] = driver_options[key];
    }

    consumer = ConsumerLoop.buildConsumer(Kafka, consumer_opts, topicName, app.shutdown);
    consumer.connect();
    app.newOrderConsumer = consumer;
  }

  function wrap_vcap_service(apiKey, restEndpoint) {
    services = {
      'messagehub': [
        {
          'label': 'messagehub',
          'credentials': {
            'api_key': apiKey,
            'kafka_admin_url': restEndpoint,
          }
        }
      ]
    };

    return services;
  }

  cb();
};
