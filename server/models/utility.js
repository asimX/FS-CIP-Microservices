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

const AWS = require('ibm-cos-sdk');

const COS = new AWS.S3({
  endpoint: APP.get('cloudObjectStorage').endpoint,
  apiKeyId: APP.get('cloudObjectStorage').apiKey,
  ibmAuthEndpoint: APP.get('cloudObjectStorage').ibmAuthEndpoint,
  serviceInstanceId: APP.get('cloudObjectStorage').serviceInstanceId
});

const BUCKETNAME = APP.get('cloudObjectStorage').acmemartBucketName;

module.exports = function (Utility) {
  // Turn off the endpoints that we don't need
  Utility.disableRemoteMethodByName('createContainer');
  Utility.disableRemoteMethodByName('getContainer');
  Utility.disableRemoteMethodByName('destroyContainer');
  Utility.disableRemoteMethodByName('download');
  Utility.disableRemoteMethodByName('getFiles');
  Utility.disableRemoteMethodByName('getFile');
  Utility.disableRemoteMethodByName('removeFile');
  Utility.disableRemoteMethodByName('getContainers');

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

  Utility.remoteMethod('clientVersion', {
    accepts: [],
    returns: {arg: 'version', type: 'object'},
    http: {path: '/version/client', verb: 'GET'}
  });

  Utility.clientVersion = function (cb) {
    let retval = {
      major: APP.get('version').client.major,
      minor: APP.get('version').client.minor,
      build: APP.get('version').client.build
    };

    cb(null, retval);
  };

  Utility.remoteMethod('serverVersion', {
    accepts: [],
    returns: {arg: 'version', type: 'object'},
    http: {path: '/version/server', verb: 'GET'}
  });

  Utility.serverVersion = function (cb) {
    let retval = {
      major: APP.get('version').server.major,
      minor: APP.get('version').server.minor,
      build: APP.get('version').server.build
    };

    cb(null, retval);
  };

  /*
   * This function is called by the routine defined in "Scheduler.js".  It deletes all uploaded photos older than
   * 5 min.
   */
  Utility.cleanUpLocalImages = function(container, time) {
    let storage = Utility.app.dataSources.storage;
    let uploadsDir = storage.settings.root + '/' + container;

    let date = new Date();
    let currentTimeMilliseconds = date.getTime();
    let olderThanMilliseconds = currentTimeMilliseconds - (time * 60000);

    FS.readdir(uploadsDir, function(err, files) {
      files.forEach(function(file, index) {
        FS.stat(PATH.join(uploadsDir, file), function(err, stat) {
          let endTime, now;
          if (err) {
            return console.error(err);
          }

          if (file !== 'README.md') {
            let fileDate = new Date(stat.mtime);
            let fileMilliseconds = fileDate.getTime();

            if (fileMilliseconds <= olderThanMilliseconds) {
              FS.unlink(uploadsDir + '/' + file, function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Utility.cleanUp() - Uploaded file deleted successfully: ' + uploadsDir + '/' + file);
                }
              });
            }
          }
        });
      });
    });
  };

  /*
   * This function is not used. Here just for testing purposes.
   */
  Utility.beforeRemote('upload', function(ctx, unused, next) {
    next();
  });

  /*
   *  This function is the HEART of the entire operation.  It is called once LoopBack has received the uploaded
   *  file and it is written to disk.
   */
  Utility.afterRemote('upload', function (ctx, unused, next) {
    // Get the uploaded files
    let files = ctx.result.result.files.fileUpload;

    // Determine where the uploaded file lives on the disk
    let storage = Utility.app.dataSources.storage;

    let filepath = storage.settings.root + '/' + files[0].container + '/';
    let filename = files[0].name;

    let uploadedFile = filepath + filename;

    console.log(uploadedFile);

    let b64 = encode_base64('../.' + filepath, filename); // Contains a really silly hack around file directory stuff

    doCreateObject(BUCKETNAME, filename, b64)
      .then(function() {
        ctx.result.result.cos_key_name = filename;

        next();
      })
      .catch(function(err) {
        console.error('An error occurred!');

        next(UTIL.inspect(err));
      });
  });

  Utility.remoteMethod('coachText', {
    accepts: [
      {
        arg: 'name',
        type: 'String',
        required: true,
        description: 'Coach Screen Name'
      }
    ],
    returns: {arg: 'coach_text', type: 'object', root: true},
    http: {path: '/static/coach', verb: 'GET'}
  });

  Utility.coachText = function (name, cb) {
    var Coach = APP.models.Coach;

    Coach.findOne({where: {id: name}}, function (err, data) {
      if (err) {
        cb(err);
      } else {
        if (data === null) {
          var error = new Error('Coach data for \'' + name + '\' not found');
          error.status = 404;

          cb(error);
        } else {
          cb(err, data);
        }
      }
    });
  };

  Utility.remoteMethod('configText', {
      accepts: [
          {
              arg: 'name',
              type: 'String',
              required: true,
              description: 'Config Slot Name'
          }
      ],
      returns: {arg: 'config_text', type: 'object', root: true},
      http: {path: '/static/config', verb: 'GET'}
  });

  Utility.configText = function (name, cb) {
      var Config = APP.models.Config;

      Config.findOne({where: {id: name}}, function (err, data) {
          if (err) {
              cb(err);
          } else {
              if (data === null) {
                  var error = new Error('Config data for \'' + name + '\' not found');
                  error.status = 404;

                  cb(error);
              } else {
                  cb(err, data);
              }
          }
      });
  };

  Utility.remoteMethod('ping', {
      accepts: [],
      returns: {arg: 'ping', type: 'object', root: true},
      http: {path: '/ping', verb: 'GET'}
  });

  Utility.ping = function (cb) {
    cb(null, {ping: Date()});
  };
};
