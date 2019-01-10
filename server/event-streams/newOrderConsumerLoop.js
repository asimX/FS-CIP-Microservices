/**
 * Copyright 2015-2018 IBM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';

const APP = require('../../server/server');

var parser = require('xml2json');

var consumer, consumerLoop;

var exports = module.exports = {};

/**
 * Constructs a KafkaConsumer and registers listeners on the most common events
 * 
 * @param {object} Kafka - an instance of the node-rdkafka module
 * @param {object} consumer_opts - consumer configuration
 * @param {string} topicName - name of the topic to consumer from
 * @param {function} shutdown - shutdown function
 * @return {KafkaConsumer} - the KafkaConsumer instance
 */
exports.buildConsumer = function(Kafka, consumer_opts, topicName, shutdown) {
    consumer = new Kafka.KafkaConsumer(consumer_opts);

    // Register listener for debug information; only invoked if debug option set in driver_options
    consumer.on('event.log', function(log) {
        console.log(log);
    });

    // Register error listener
    consumer.on('event.error', function(err) {
        console.error('Error from NEW order consumer:' + JSON.stringify(err));
        consumer.consume();
    });

    var consumedMessages = [];
    // Register callback to be invoked when consumer has connected
    consumer.on('ready', function() {
        console.log('The NEW order consumer has started');

        // request metadata for one topic
        consumer.getMetadata({
            topic: topicName,
            timeout: 10000
        }, 
        function(err, metadata) {
            if (err) {
                console.error('Error getting NEW order consumer metadata: ' + JSON.stringify(err));
                shutdown(-1);
            } else {
                console.log('NEW order consumer obtained metadata: ' + JSON.stringify(metadata));
                if (metadata.topics[0].partitions.length === 0) {
                    console.error('ERROR - Topic ' + topicName + ' does not exist. Exiting');
                    shutdown(-1);
                }
            }
        });

        // consumer.consume(...) starts a loop
        // a 'data' event will be emitted for every message received.
        // this swallows any errors - see node-rdkafka API docs
        consumer.subscribe([topicName]);
        consumer.consume();

        exports.consumerLoop = consumerLoop = setInterval(function () {
            if (consumedMessages.length === 0) {
              // if (APP.settings.env === 'development') {
                console.log('No NEW order messages consumed');
              // }
            } else {
                for (var i = 0; i < consumedMessages.length; i++) {
                    var m = consumedMessages[i];

                    console.log('NEW ORDER message consumed: topic=' + m.topic + ', partition=' + m.partition + ', offset=' + m.offset + ', key=' + m.key + ', value=' + m.value.toString());

                    var json = parser.toJson(m.value.toString());
                    // console.log('------------');
                    // console.log('to json -> %s', json);
                    // console.log('------------');

                    var order = JSON.parse(json);
                    // console.log('to order -> %s', order.purchaseOrder.orderDate);
                    // console.log('to order -> %s', order['purchaseOrder']['ns1:shipTo']['ns1:name']);

                    var Event = APP.models.Event;
                    Event.create({
                      'purchaseOrder': order.purchaseOrder.orderDate,
                      'shipTo': {
                        'name': order['purchaseOrder']['ns1:shipTo']['ns1:name'],
                        'street': order['purchaseOrder']['ns1:shipTo']['ns1:street'],
                        'city': order['purchaseOrder']['ns1:shipTo']['ns1:city'],
                        'state': order['purchaseOrder']['ns1:shipTo']['ns1:state'],
                        'zip': order['purchaseOrder']['ns1:shipTo']['ns1:zip']
                      },
                      'billTo': {
                        'name': order['purchaseOrder']['ns1:billTo']['ns1:name'],
                        'street': order['purchaseOrder']['ns1:billTo']['ns1:street'],
                        'city': order['purchaseOrder']['ns1:billTo']['ns1:city'],
                        'state': order['purchaseOrder']['ns1:billTo']['ns1:state'],
                        'zip': order['purchaseOrder']['ns1:billTo']['ns1:zip']
                      },
                      'item': {
                          'partNum': order['purchaseOrder']['ns1:items']['ns1:item']['partNum'],
                          'productName': order['purchaseOrder']['ns1:items']['ns1:item']['ns1:productName'],
                          'quantity': order['purchaseOrder']['ns1:items']['ns1:item']['ns1:quantity'],
                          'price': order['purchaseOrder']['ns1:items']['ns1:item']['ns1:USPrice'],
                          'shipDate': order['purchaseOrder']['ns1:items']['ns1:item']['ns1:shipDate'],
                      },
                      'status_code': 100,
                      'last_update': new Date().toISOString(),
                      'history': [
                        {
                          type: 'initial',
                          timestamp: new Date().toISOString(),
                          topic: m.topic,
                          partition: m.partition,
                          offset: m.offset,
                          key: m.key,
                        }
                      ]
                    }, function(err, obj) {
                      if (typeof err !== 'undefined' && err) {
                        console.log(err);
                      } else {
                        // console.log(obj);
                      }
                    });
                }
                consumedMessages = [];
            }
        }, 2000);
        APP.newOrderConsumerLoop = consumerLoop;
    });

    // Register a listener to process received messages
    consumer.on('data', function(m) {
        consumedMessages.push(m);
    });
    return consumer;
};
