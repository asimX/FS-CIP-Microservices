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

module.exports = function (Coach) {
  // Turn off the endpoints that we don't need
  Coach.disableRemoteMethodByName('create');
  Coach.disableRemoteMethodByName('upsert');
  Coach.disableRemoteMethodByName('update');
  Coach.disableRemoteMethodByName('exists');
  Coach.disableRemoteMethodByName('findById');
  Coach.disableRemoteMethodByName('find');
  Coach.disableRemoteMethodByName('findOne');
  Coach.disableRemoteMethodByName('deleteById');
  Coach.disableRemoteMethodByName('count');
  Coach.disableRemoteMethodByName('upsertWithWhere');
  Coach.disableRemoteMethodByName('replaceOrCreate');
  Coach.disableRemoteMethodByName('replaceById');
  Coach.disableRemoteMethodByName('patchOrCreate');
  Coach.disableRemoteMethodByName('createChangeStream');
  Coach.disableRemoteMethod('patchAttributes', false);

  Coach.remoteMethod('coach', {
    accepts: [
      {
        arg: 'name',
        type: 'String',
        required: true,
        description: 'Coach screen'
      }
    ],
    returns: {arg: 'coach', type: 'object', root: true},
    http: {verb: 'GET'}
  });

  Coach.coach = function (name, cb) {
    Coach.findOne({where: {id: name}}, function (err, data) {
      cb(err, data);
    });
  };
};
