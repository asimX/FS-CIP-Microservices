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

module.exports = function (Config) {
  // Turn off the endpoints that we don't need
  Config.disableRemoteMethodByName('create');
  Config.disableRemoteMethodByName('upsert');
  Config.disableRemoteMethodByName('update');
  Config.disableRemoteMethodByName('exists');
  Config.disableRemoteMethodByName('findById');
  Config.disableRemoteMethodByName('find');
  Config.disableRemoteMethodByName('findOne');
  Config.disableRemoteMethodByName('deleteById');
  Config.disableRemoteMethodByName('count');
  Config.disableRemoteMethodByName('upsertWithWhere');
  Config.disableRemoteMethodByName('replaceOrCreate');
  Config.disableRemoteMethodByName('replaceById');
  Config.disableRemoteMethodByName('patchOrCreate');
  Config.disableRemoteMethodByName('createChangeStream');
  Config.disableRemoteMethod('patchAttributes', false);

  Config.remoteMethod('Config', {
    accepts: [
      {
        arg: 'name',
        type: 'String',
        required: true,
        description: 'Config screen'
      }
    ],
    returns: {arg: 'Config', type: 'object', root: true},
    http: {verb: 'GET'}
  });

  Config.Config = function (name, cb) {
    Config.findOne({where: {id: name}}, function (err, data) {
      cb(err, data);
    });
  };
};
