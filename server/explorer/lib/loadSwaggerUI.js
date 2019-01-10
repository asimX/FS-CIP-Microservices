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

// Refactoring of inline script from index.html.
/*global SwaggerUi, log, ApiKeyAuthorization, hljs, window, $ */
$(function() {
  // Pre load translate...
  if (window.SwaggerTranslator) {
    window.SwaggerTranslator.translate();
  }

  var lsKey = 'swagger_accessToken';
  $.getJSON('config.json', function(config) {
    log(config);
    loadSwaggerUi(config);
  });

  var accessToken;
  function loadSwaggerUi(config) {
    var methodOrder = ['get', 'head', 'options', 'put', 'post', 'delete'];
    /* eslint-disable camelcase */
    window.swaggerUi = new SwaggerUi({
      validatorUrl: null,
      url: config.url || '/swagger/resources',
      apiKey: '',
      dom_id: 'swagger-ui-container',
      supportHeaderParams: true,
      onComplete: function(swaggerApi, swaggerUi) {
        log('Loaded SwaggerUI');
        log(swaggerApi);
        log(swaggerUi);

        if (window.SwaggerTranslator) {
          window.SwaggerTranslator.translate();
        }

        $('pre code').each(function(i, e) {
          hljs.highlightBlock(e);
        });

        // Recover accessToken from localStorage if present.
        if (window.localStorage) {
          var key = window.localStorage.getItem(lsKey);
          if (key) {
            $('#input_accessToken').val(key).submit();
          }
        }
      },
      onFailure: function(data) {
        log('Unable to Load SwaggerUI');
        log(data);
      },
      docExpansion: 'none',
      highlightSizeThreshold: 16384,
      apisSorter: 'alpha',
      operationsSorter: function(a, b) {
        var pathCompare = a.path.localeCompare(b.path);
        return pathCompare !== 0 ?
          pathCompare :
          methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
      },
    });
    /* eslint-disable camelcase */

    $('#explore').click(setAccessToken);
    $('#api_selector').submit(setAccessToken);
    $('#input_accessToken').keyup(onInputChange);

    window.swaggerUi.load();
  }

  function setAccessToken(e) {
    e.stopPropagation(); // Don't let the default #explore handler fire
    e.preventDefault();
    var key = $('#input_accessToken')[0].value;
    log('key: ' + key);
    if (key && key.trim() !== '') {
      log('added secretToken ' + key);

      var apiKeyAuth =
        new SwaggerClient.ApiKeyAuthorization('x-app-sharedsecret', key, 'header');
      //new SwaggerClient.ApiKeyAuthorization('access_token', key, 'query');

      window.swaggerUi.api.clientAuthorizations.add('key', apiKeyAuth);
      //window.swaggerUi.api.clientAuthorizations.add('key', apiKeyAuth);

      accessToken = key;
      $('.accessTokenDisplay').text('Secret Set.').addClass('set');
      $('.accessTokenDisplay').attr('data-tooltip', 'Current Secret: ' + key);

      // Save this token to localStorage if we can to make it persist on refresh.
      if (window.localStorage) {
        window.localStorage.setItem(lsKey, key);
      }
    } else {
      // If submitted with an empty token, remove the current token. Can be
      // useful to intentionally remove authorization.
      log('removed secretToken.');
      $('.accessTokenDisplay').text('Secret Not Set.').removeClass('set');
      $('.accessTokenDisplay').removeAttr('data-tooltip');
      if (window.swaggerUi) {
        window.swaggerUi.api.clientAuthorizations.remove('key');
      }
      if (window.localStorage) {
        window.localStorage.removeItem(lsKey);
      }
    }
  }

  function onInputChange(e) {
    var el = e.currentTarget;
    var key = $(e.currentTarget)[0].value;
    if (!key || key.trim === '') return;
    if (accessToken !== key) {
      $('.accessTokenDisplay').text('Secret changed; submit to confirm.');
    } else {
      $('.accessTokenDisplay').text('Secret Set.');
    }
  }

  function log() {
    if ('console' in window) {
      console.log.apply(console, arguments);
    }
  }
});
