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
        console.error('Error from UPDATE order consumer:' + JSON.stringify(err));
        consumer.consume();
    });

    var consumedMessages = [];
    // Register callback to be invoked when consumer has connected
    consumer.on('ready', function() {
        console.log('The UPDATE order consumer has started');

        // request metadata for one topic
        consumer.getMetadata({
            topic: topicName,
            timeout: 10000
        }, 
        function(err, metadata) {
            if (err) {
                console.error('Error getting UPDATE order consumer metadata: ' + JSON.stringify(err));
                shutdown(-1);
            } else {
                console.log('UPDATE order consumer obtained metadata: ' + JSON.stringify(metadata));
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
                console.log('No UPDATE order messages consumed');
              // }
            } else {
                for (var i = 0; i < consumedMessages.length; i++) {
                    var m = consumedMessages[i];

                    console.log('UPDATE ORDER message consumed: topic=' + m.topic + ', partition=' + m.partition + ', offset=' + m.offset + ', key=' + m.key + ', value=' + m.value.toString());

                    // console.log('UPDATE THE DB RECORD!');
                    var order = JSON.parse(m.value);
                    // console.log('*****************>>>>' + order.id);
                    // console.log('*****************>>>>' + order.purchaseOrder);

                    var Event = APP.models.Event;

                    Event.findById(order.id, function(err, data) {
                      if (typeof err !== 'undefined' && err) {
                        console.log(err);
                      } else {
                        var history = data.toJSON().history;

                        history.push({
                          type: 'update',
                          timestamp: new Date().toISOString(),
                          topic: m.topic,
                          partition: m.partition,
                          offset: m.offset,
                          key: m.key,
                        });

                        data.updateAttributes({status_code: order.status_code + 100, last_update: new Date().toISOString(), history: history}, function(err, info) {
                          if (typeof err !== 'undefined' && err) {
                            console.log(err);
                          } else {
                            // console.log(info);
                          }
                        });
                      }
                    });
                }
                consumedMessages = [];
            }
        }, 2000);
      APP.updateOrderConsumerLoop = consumerLoop;
    });

    // Register a listener to process received messages
    consumer.on('data', function(m) {
        consumedMessages.push(m);
    });
    return consumer;
};
