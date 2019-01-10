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

 Author: Dennis W. Ashby (dennis.ashby@us.ibm.com)
*/

var request = require('request');

/**
 *
 * main() will be run when you invoke this action
 *
 * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
 *
 * @return The output of this action, which must be a JSON object.
 *
 */
function main(params) {
    var retval = '';

    if (params.message) {
        var options = {
            // url: params.baseURL + '/api/Events/findOne?filter=%7B%22where%22:%20%7B%22purchaseOrder%22:%20%22' + params.message + '%22%7D%7D',
            url: 'https://am-utilityapi.eu-gb.mybluemix.net' + '/api/Events/findOne?filter=%7B%22where%22:%20%7B%22purchaseOrder%22:%20%22' + params.message + '%22%7D%7D',
            json: true
        };

        return new Promise(function (resolve, reject) {
            request(options, function (err, resp) {
                if (err) {
                    console.log(err);
                    return resolve({greeting: err.toLocaleString()});
                }

                retval = retval + 'My system tells me that your order was last updated on ' +
                    new Date(resp.body.last_update) +
                    '\n\nI also see that there have been ' +
                    resp.body.history.length +
                    ' previous events for this order.';

                switch (resp.body.status_code) {
                    case 100:
                        retval = retval + '\n\nThe current status is that it has been received and awaiting further processing.';
                        break;

                    case 200:
                        retval = retval + '\n\nThe current status is that your order has been sent to the warehouse.';
                        break;

                    case 300:
                        retval = retval + '\n\nThe current status is that your order is currently being fulfilled by the warehouse.';
                        break;

                    case 400:
                        retval = retval + '\n\nThe current status is that your order is packed and being prepared for shipping.';
                        break;

                    case 500:
                    default:
                        retval = retval + '\n\nThe current status is that your order has been successfully fulfilled and is out for shipping. It should be arriving soon.';
                        break;
                }

                if (resp.body.status_code < 500) {
                    retval = retval + '\n\nI should have another update for you in about 2 minutes.  Please check back then.';
                }

                return resolve({greeting: retval});
            });
        });
    } else {
        return new Promise(function (resolve, reject) {
            retval = 'Hmmmm.  I am having a problem looking up your order.  Please try again later.';
            return resolve({greeting: retval});
        });
    }
}

exports.main = main;
