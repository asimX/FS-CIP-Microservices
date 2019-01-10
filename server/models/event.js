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

const APP = require('../../server/server');

const FS = require('fs');
const PATH = require('path');
const UTIL = require('util');

module.exports = function (Event) {
  var TOPIC_NAME = APP.get('eventStreams').topics.updateOrderTopicName;
  var PARTITION = 0;
  var KEY = 'Key';

  // Turn off the endpoints that we don't need
  Event.disableRemoteMethodByName('create');
  Event.disableRemoteMethodByName('upsert');
  Event.disableRemoteMethodByName('update');
  // Event.disableRemoteMethodByName('exists');
  // Event.disableRemoteMethodByName('findById');
  // Event.disableRemoteMethodByName('find');
  // Event.disableRemoteMethodByName('findOne');
  Event.disableRemoteMethodByName('deleteById');
  // Event.disableRemoteMethodByName('count');
  Event.disableRemoteMethodByName('upsertWithWhere');
  Event.disableRemoteMethodByName('replaceOrCreate');
  Event.disableRemoteMethodByName('replaceById');
  Event.disableRemoteMethodByName('patchOrCreate');
  Event.disableRemoteMethodByName('createChangeStream');
  Event.disableRemoteMethod('patchAttributes', false);

  function produceEvent(data) {
    var message = new Buffer(JSON.stringify(data));

    // Short sleep for flow control in this sample app
    // to make the output easily understandable
    try {
      APP.updateOrderProducer.produce(TOPIC_NAME, PARTITION, message, KEY);
    } catch (err) {
      console.error('Failed sending message ' + message);
      console.error(err);
    }
  };

  Event.sendOrderUpdateEvents = function() {
    Event.find({
        where:
          {
            status_code: {lte: 400},
            last_update: {lt: new Date()}
          }
      },
      function(err, events) {
        if (typeof err !== 'undefined' && err) {
          console.log(err);
        } else {
          // console.log(events);

          if (events.length === 0) {
            console.log('No UPDATE orders to process');
          } else {
            for (var i = 0; i < events.length; i++) {
              var data = {
                id: events[i].id,
                purchaseOrder: events[i].purchaseOrder,
                status_code: events[i].status_code
              };

              produceEvent(data);
            }
          }
        }
      });
  };
};
