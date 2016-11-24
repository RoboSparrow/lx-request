/**
 * @author jboeselt
 * simple xapi http requests via XHR or NODE (request module)
 * `$ node my-test.js`
 */

var req = (function() {

    'use strict';

    var exports = {};

    //// check node or browser
    // note that bundler like webpack might have both window and commonJS module
    var NODE = (typeof module !== 'undefined' && module.exports);
    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
        /* global window */
        /* global XMLHttpRequest */
        NODE = false;
    }

    // if node then load npm.request module
    if (NODE) {
        var http = require('http');
        var https = require('https');
        var Url = require('url');
    }

    ////
    // Utils
    ////

    // Merges two (or more) objects,
    // @TODO improve
    var mergeHash = function(destination, source) {
        var shallowProperties = ['data'];
        for (var property in source) {
            if (shallowProperties.indexOf(property) > -1) {
                destination[property] = source[property];
                continue;
            }
            if (source[property] && source[property].constructor && source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                mergeHash(destination[property], source[property]);
                continue;
            }
            destination[property] = source[property];
        }
        return destination;
    };

    //// parse JSON
    var _parseRequestBody = function(body, config) {
        if (config.responseType === 'json') {
            try {
                return JSON.stringify(body);
            } catch (e) {
                //@TODO
                console.error(e);
            }
        }
        return body;
    };

    //// parse JSON
    var _parseResponseBody = function(body, config) {

        if (!body || body === undefined) {
            return body;
        }

        if (config.responseType === 'json') {
            try {
                return JSON.parse(body);
            } catch (e) {
                //@TODO
                console.error(e);
            }
        }
        return body;
    };

    //// encode a javascript object into a query string
    var _encode2Query = function(obj, prefix) {
        var str = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
                str.push(typeof v === 'object' ? _encode2Query(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        }
        return str.join('&');
    };

    ////
    // response
    ////

    var Response = function() {
        this.data = null;
        this.status = null;
        this.statusText = null;
        this.error = false;
        this.headers = null;
    };

    /**
    * @see https://gist.github.com/monsur/706839
    * @courtesy https://gist.github.com/monsur
    */
    var _xhrResponseHeaders = function(headerStr) {
        var headers = {};
        if (!headerStr) {
            return headers;
        }
        var headerPairs = headerStr.split('\u000d\u000a');
        for (var i = 0; i < headerPairs.length; i++) {
            var headerPair = headerPairs[i];
            // Can't use split() here because it does the wrong thing
            // if the header value has the string ": " in it.
            var index = headerPair.indexOf('\u003a\u0020');
            if (index > 0) {
                var key = headerPair.substring(0, index);
                var val = headerPair.substring(index + 2);
                headers[key] = val;
            }
        }
        return headers;
    };

    ////
    // request
    ////

    //// XHR request
    var _xhrRequest = function(url, config) {

        var xhr = new XMLHttpRequest();
        xhr.open(config.method, url, true);

        // headers
        for (var key in config.headers) {
            if (config.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, config.headers[key]);
            }
        }

        var result = new Response(xhr, config);
        // core
        xhr.onreadystatechange = function() {

            if (xhr.readyState === 2) {
                result.headers = _xhrResponseHeaders(xhr.getAllResponseHeaders());
            }

            if (xhr.readyState === 4) {

                result.status = xhr.status;
                result.statusText = xhr.statusText;
                result.data = _parseResponseBody(xhr.responseText, config);

                if (typeof config.transformResponse === 'function') {
                    config.transformResponse(result);
                }

                if (xhr.status < 299) {
                    config.success(result, xhr);
                } else {
                    config.error(result, xhr);
                }
                config.always(result, xhr);
            }
        };

        //catches cors requests
        xhr.onerror = function(error) {
            result.error = error;
        };

        var data = null;
        if (config.data) {
            data = _parseRequestBody(config.data, config);
        }

        xhr.send(data);
        return xhr;
    };

    /// node/http
    var _httpRequest = function(url, config) {

        var _url =  Url.parse(url);
        var module = (_url.protocol === 'https:') ? https : http;
        var data = '';

        var options = {
            host: (_url.port) ? _url.host.replace(':' + _url.port, '') : _url.host,
            path: _url.path,
            port: _url.port,
            query: _url.query + _encode2Query(config.query),
            method: config.method,
            headers: config.headers,
            body: config.data
        };

        if (config.data) {
            config.data = _parseRequestBody(config.data, config);
            options.headers['Content-Length'] = Buffer.byteLength(config.data);
        }

        var result = new Response();
        var request = module.request(options, function(res) {
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                // @var res: http.IncomingMessage
                data += chunk;
            });

            res.on('end', function() {

                result.status = res.statusCode;
                result.statusText = res.statusMessage;
                result.data = _parseResponseBody(data, config);
                result.headers = res.headers;

                if (res.statusCode < 299) {

                    if (typeof config.transformResponse === 'function') {
                        config.transformResponse(result);
                    }

                    config.success(result, res);
                } else {
                    config.error(result, res);
                }
                config.always(result, res);
            });

        });

        if (config.data) {
            request.write(config.data);
        }

        request.on('error', function(error) {
            result.error = error;
            config.error(result, request);
            config.always(result, error);
        });

        request.end();

        return null;
    };

    ////
    // request api
    ////

    var request = function(url, config) {

        // 'raw' in comments below: xhr or http.ClientRequest
        var defaults = {
            method: 'GET',
            query: {},
            headers: {},
            data: null,
            responseType: '',//?TODO
            transformResponse: false,   // function(raw)
            success: function() {},     // (Response, raw)
            error: function() {},       // (Response, raw)
            always: function() {}       // (Response, raw)
        };

        // merge config with defaults
        config = mergeHash(defaults, config);

        // data
        if (config.responseType !== 'json' && config.data) {
            if (/application\/json/.test(config.headers['Content-Type'])) {
                config.data = JSON.stringify(config.data);
            } else {
                //? header
                config.data = _encode2Query(config.data);
            }
        }

        var query = _encode2Query(config.query);
        if (query) {
            url = url + '?' + query;
        }

        // invoke request
        if (NODE) {
            return _httpRequest(url, config);
        }
        return _xhrRequest(url, config);
    };

    //// json request
    exports.json = function(url, config) {
        var defaults = {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'json'
        };
        return request(url, mergeHash(defaults, config));// note the order of merge. default overwrites are allowed
    };

    //// raw request
    exports.raw = function(url, config) {
        return request(url, config);// note the order of merge. default overwrites are allowed
    };

    ////
    //  export
    ////

    exports.mergeHash = mergeHash;
    exports.request = request;

    exports.get = function(url, config) {
        return request(url, config);
    };

    exports.head = function(url, config) {
        config = config || {};
        config.method = 'HEAD';
        return request(url, config);
    };

    exports['delete'] = function(url, config) {
        config = config || {};
        config.method = 'DELETE';
        return request(url, config);
    };

    exports.post = function(url, data, config) {
        config = config || {};
        config.method = 'POST';
        config.data = data;
        return request(url, config);
    };

    exports.put = function(url, data, config) {
        config = config || {};
        config.method = 'PUT';
        config.data = data;
        return request(url, config);
    };

    exports.patch = function(url, data, config) {
        config = config || {};
        config.method = 'PATCH';
        config.data = data;
        return request(url, config);
    };

    return exports;
})();

//// node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = req;
}
