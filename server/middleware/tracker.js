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

var app = require('../server');
var uuidv4 = require('uuid/v4');

/*
 * This middleware is a simple utility to report the amount of time the API
 * call spent processing.
 */

module.exports = function() {
  return function tracker(req, res, next) {
    if (req.url.startsWith(app.get('restApiRoot'))) {
      var url = req.url;
      var gid = req.headers['X-Global-Transaction-Id'];

      if (gid === undefined || gid === null) {
        gid = uuidv4();
      }

      console.log('[' + gid + '] Request tracking middleware triggered on \'%s\'', url);

      var start = process.hrtime();

      res.once('finish', function() {
        var diff = process.hrtime(start);
        var ms = diff[0] * 1e3 + diff[1] * 1e-6;

        console.log('[' + gid + '] The request processing time for \'%s\' is \'%d\' ms.', url, ms);
      });
    }

    next();
  };
};
