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
 * This middleware sets up the "secret header" that is allows on verified calls
 * from the gateway to be processed by the API.  It is necessary to turn on if the API
 * is sitting in the PUBLIC CLOUD.
 */

var app = require('../server');

module.exports = function() {
  return function tracker(req, res, next) {

    if ('/' + req.url.split('/')[1] === app.get('restApiRoot')) {
      // Get the value of the secret header
      var secretHeader = 'NotSet';
      if (req.headers && req.headers[app.get('gw_secret_header')]) {
        secretHeader = req.headers[app.get('gw_secret_header')];
      }

      if (secretHeader === app.get('gw_secret')) {
        // Authorized caller - continue as normal
        next();
      } else {
        // request was via http, so redirect to https
        res.statusCode = 401;
        var e = new Error('Unauthorized');
        next(e);
      }
    } else {
      next();
    }
  };
};
