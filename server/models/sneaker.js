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
const ASYNC = require('async');
const PATH = require('path');
const UTIL = require('util');

const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
const AWS = require('ibm-cos-sdk');

const VisualRecognitionClassifierID = APP.get('watsonServices').visualRecognition.classifierId;

// Initialize Watson Visual Recognition Services
const VISUAL_RECOGNITION = new VisualRecognitionV3({
  url: APP.get('watsonServices').visualRecognition.url,
  iam_apikey: APP.get('watsonServices').visualRecognition.apiKey,
  version_date: APP.get('watsonServices').visualRecognition.versionDate
});

const COS = new AWS.S3({
  endpoint: APP.get('cloudObjectStorage').endpoint,
  apiKeyId: APP.get('cloudObjectStorage').apiKey,
  ibmAuthEndpoint: APP.get('cloudObjectStorage').ibmAuthEndpoint,
  serviceInstanceId: APP.get('cloudObjectStorage').serviceInstanceId
});

const BUCKETNAME = APP.get('cloudObjectStorage').acmemartBucketName;

const LOCAL_STORAGE = APP.get('storage').local;

module.exports = function (Sneaker) {
  function doCreateObject(bucketName, key, data) {
    console.log('Creating object in bucket: \'' + bucketName + '\' with key \'' + key + '\'...');

    return COS.putObject({
      Bucket: bucketName,
      Key: key,
      Body: data
    }).promise();
  }

  function doDeleteObject(bucketName, key) {
    console.log('Deleting object in bucket: \'' + bucketName + '\' with key \'' + key + '\'...');

    return COS.deleteObject({
      Bucket: bucketName,
      Key: key
    }).promise();
  }

  function doRetrieveObject(bucketName, key) {
    console.log('Retrieving object in bucket: \'' + bucketName + '\' with key \'' + key + '\'...');

    return COS.getObject({
      Bucket: bucketName,
      Key: key
    }).promise();
  }

  function encode_base64(filePath, filename) {
    let data = FS.readFileSync(PATH.join(__dirname, filePath, filename));
    let buf = Buffer.from(data);
    let base64 = buf.toString('base64');

    console.log('Base64: ' + base64);

    return base64;
  }

  function decode_base64(base64str, filePath, filename) {
    let buf = Buffer.from(base64str, 'base64');

    FS.writeFileSync(PATH.join(__dirname, filePath, filename), buf);
  }

  /*
   * This function is called by the routine defined in "Scheduler.js".  It deletes all uploaded photos older than
   * 5 min.
   */
  Sneaker.remoteMethod('identify', {
    accepts: [
      {arg: 'key', type: 'string'}
    ],
    returns: {arg: 'identification', type: 'object'},
    http: {path: '/identify', verb: 'GET'}
  });

  Sneaker.cleanUp = function(time) {
    let date = new Date();
    let currentTimeMilliseconds = date.getTime();
    let olderThanMilliseconds = currentTimeMilliseconds - (time * 60000);

    FS.readdir(LOCAL_STORAGE, function(err, files) {
      files.forEach(function(file, index) {
        FS.stat(PATH.join(LOCAL_STORAGE, file), function(err, stat) {
          let endTime, now;
          if (err) {
            return console.error(err);
          }

          if (file !== 'README.md') {
            let fileDate = new Date(stat.mtime);
            let fileMilliseconds = fileDate.getTime();

            if (fileMilliseconds <= olderThanMilliseconds) {
              FS.unlink(LOCAL_STORAGE + '/' + file, function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Sneaker.cleanUp() - Uploaded file deleted successfully: ' + LOCAL_STORAGE + '/' + file);

                  doDeleteObject(BUCKETNAME, file)
                    .then(function() {
                      console.log('Sneaker.cleanUp() - COS file deleted successfully: ' + BUCKETNAME + '/' + file);
                    })
                    .catch(function(err) {
                      console.error(UTIL.inspect(err));
                    });
                }
              });
            }
          }
        });
      });
    });
  };

  Sneaker.identify = function (key, next) {
    let retval = {
      // classify: 'unrecognized',
      style: 'unrecognized',
      color: 'unrecognized'
    };

    doRetrieveObject(BUCKETNAME, key)
      .then((data) => {
          // console.log('Got image from bucket.');

          if (data != null) {
            let imageData = Buffer.from(data.Body).toString();
            // console.log('File Contents: ' + imageData);

            decode_base64(imageData, '../../' + LOCAL_STORAGE + '/', key);

            // Parameters that we will pass to Waston Vision Recognition service
            let visionParams = {
              classifier_ids: VisualRecognitionClassifierID + ',default',
              images_file: FS.createReadStream(LOCAL_STORAGE + '/' + key)
            };
            // console.log('Let make a call to Watson.');

            // Let's execute Watson service calls in parallel:
            ASYNC.parallel({
              // 1. Get the classification information for the image from Watson
              classify: function (cb) {
                VISUAL_RECOGNITION.classify(visionParams, function (err, res) {
                  if (err) {
                    // console.log('ERROR from Watson!');
                    cb(err);
                  } else {
                    // console.log('SUCCESS from Watson!');
                    cb(null, res);
                  }
                });
              }
            }, function (err, results) {
              if (err) {
                console.log(err);

                next(err);
              } else {
                let classify;

                // Collect the results from the calls
                if (typeof results.classify.images[0] != 'undefined' && results.classify.images[0].error) {
                  next(results.classify.images[0].error);

                  return;
                } else {
                  classify = results.classify.images[0].classifiers;
                  // console.log(JSON.stringify(classify));
                }

                // retval.classify = classify;
                retval.style = getSneakerClass(classify, VisualRecognitionClassifierID);
                retval.color = getSneakerBestColorClass(classify);

                next(null, retval);
              }
            });
          }
        }
      ).catch((error) => {
        console.error('An error occurred!');
        next(UTIL.inspect(error));
      });
  };

  /*
   * From here down are just help functions that allow me to parse JSON and determine what Watson saw.
   */
  function getSneakerClass(classify, classifierId) {
    let retval = 'unrecognized';

    for (let i = 0; i < classify.length; i++) {
      if (classify[i].classifier_id === VisualRecognitionClassifierID) {
        if (typeof classify[i].classes != 'undefined' && classify[i].classes.length > 0) {
          retval = classify[i].classes[0].class;
          break;
        }
      }
    }

    return retval;
  }

  function getSneakerBestColorClass(classify) {
    let color = {
      'best': undefined,
      'all': []
    };

    for (let i = 0; i < classify.length; i++) {
      if (classify[i].classifier_id === 'default') {
        if (typeof classify[i].classes != 'undefined' && classify[i].classes.length > 0) {
          for (let j = 0; j < classify[i].classes.length; j++) {
            // console.log(classify[i].classes[j].class.indexOf('color'));

            if (classify[i].classes[j].class.indexOf('color') > -1) {
              // console.log('FOUND COLOR: ' + classify[i].classes[j].class);

              if (!color.best || parseFloat(classify[i].classes[j].score) > parseFloat(color.best.score)) {
                color.best = classify[i].classes[j];
              }

              color.all.push(classify[i].classes[j].class);
            }
          }
        }

        break;
      }
    }

    color.best = color.best.class;

    // console.log(color);

    return color;
  }
};
