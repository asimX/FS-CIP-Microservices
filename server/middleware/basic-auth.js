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

/*
 *  This middleware sets up a simple Basic Authentication scheme which I use to proctect
 *  the SWAGGER based browser.
 */

var app = require('../server');
var basicAuthParser = require('basic-auth');

module.exports = function() {
  return function (req, res, next) {
    if (!req.url.startsWith(app.get('restApiRoot'))) {
      const user = basicAuthParser(req);

      const validUser = user &&
        user.name === app.get('basic_auth_user') &&
        user.pass === app.get('basic_auth_pass');

      if (!validUser) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');

        return res.sendStatus(401);
      }
    }

    next();
  };
};
