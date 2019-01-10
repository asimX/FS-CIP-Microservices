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

// Reading all of the required KEY and SECRETS from the ENV at runtime.
module.exports = {
  'watsonServices': {
    'visualRecognition': {
      'apiKey': process.env.WVR_API_KEY,
      'url': process.env.WVR_URL,
      'versionDate': process.env.WVR_VERSION_DATE,
      'classifierId': process.env.WVR_CLASSIFIER_ID
    }
  },
  'cloudObjectStorage': {
    'endpoint': process.env.COS_ENDPOINT,
    'apiKey': process.env.COS_API_KEY,
    'ibmAuthEndpoint': process.env.COS_IBM_AUTH_ENDPOINT,
    'serviceInstanceId': process.env.COS_SERVICE_INSTANCE_ID,
    'acmemartBucketName': process.env.COS_ACME_MART_BUCKET_NAME
  },
  'gw_secret_header': process.env.GW_SECRET_HEADER,
  'gw_secret': process.env.GW_SECRET,
  'eventStreams': {
    'topics': {
      'newOrderTopicName': process.env.EVENT_STREAMS_NEW_ORDER_TOPIC_NAME,
      'updateOrderTopicName': process.env.EVENT_STREAMS_UPDATE_ORDER_TOPIC_NAME
    },
    'brokerSasl': process.env.EVENT_STREAMS_BROKER_SASL,
    'adminURL': process.env.EVENT_STREAMS_ADMIN_URL,
    'apiKey': process.env.EVENT_STREAMS_API_KEY,
    'certLocation': process.env.EVENT_STREAMS_CERT_LOCATION,
    'onCloud': process.env.EVENT_STREAMS_ON_CLOUD
  }
};
