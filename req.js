/**
 * @author jboeselt
 * simple xapi http requests via XHR or NODE (request module)
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

    // checks ES6 promise support and attaches native Promise, can be substituted
    exports.Promise = (typeof Promise !== 'function') ? function() {
        throw new Error('"promise" flag was set in request config but the system doesn\'t support ES6 Promise, use callbacks instead.');
    } : Promise;

    ////
    // Utils
    ////

    //// case-insensitive object access (headers!)
    var objectGet = function(key, obj, ret) {
        var search = key.toLowerCase();
        var l;
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                l = k.toLowerCase();
                if (search === l) {
                    return obj[k];
                }
            }
        }
        return (ret === undefined) ? null : ret;
    };

    //// check config if request is a json request
    var _isJsonRequest = function(config) {
        if (config.responseType === 'json') { // xhr
            return true;
        }
        var header = objectGet('Content-Type', config.headers, '');
        return /application\/json/.test(header);
    };

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

    //// parse urelencoded request body
    var sendableRawDataFormats = [];
    if (!NODE) {
        sendableRawDataFormats = [
            // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send
            '[object Blob]',
            '[object FormData]',
            '[object String]', //DOMString === string
            '[object HTMLDocument]',
            // https://developer.mozilla.sorg/en-US/docs/Web/API/ArrayBufferView
            '[object ArrayBuffer]',
            '[object DataView]',
            '[object Int8Array]',
            '[object Uint8Array]',
            '[object Uint8ClampedArray]',
            '[object Int16Array]',
            '[object Uint16Array]',
            '[object Int32Array]',
            '[object Uint32Array]',
            '[object Float32Array]',
            '[object Float64Array]'
        ];
    } else {
        // https://nodejs.org/api/http.html#http_request_write_chunk_encoding_callback
        // https://nodejs.org/api/buffer.html
        sendableRawDataFormats = [
            '[object String]',
            '[object Uint8Array]'
        ];
    }

    //// parse JSON
    var _parseRequestBody = function(config) {
        if (_isJsonRequest(config)) {
            try {
                return JSON.stringify(config.data);
            } catch (e) {
                //@TODO
                console.error('parseRequestBody; Failed to parse request JSON: ' + e.message);
            }
            return config.data;
        }
        return _parseRawRequestBody(config.data);
    };

    var _parseRawRequestBody = function(data) {
        // string: we assume it was uri-encoded already
        if (typeof data  === 'string') {
            return data;
        }
        // other primitives
        if (typeof data  !== 'object') {
            return encodeURIComponent(data);
        }
        //
        var _type = Object.prototype.toString.call(data);
        if (sendableRawDataFormats.indexOf(_type) > -1) {
            return data;
        }

        return _encodeData(data);
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
                console.error('_parseResponseBody: Failed to parse response JSON: ' + e.message);
            }
        }
        return body;
    };

    //// encode a javascript object into a query string
    // TODO merge, review, see https://github.com/angular/angular.js/blob/master/src/ng/http.js#L60 and https://stackoverflow.com/a/30970229
    var _encodeData = function(obj, prefix) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            obj = obj.reduce(function(o, v, i) {
                o[i] = v;
                return o;
            }, {});
        }

        var str = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
                str.push(typeof v === 'object' ? _encodeData(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        }
        return str.join('&');
    };

    //// encode a javascript object into a query string
    // TODO merge with above
    var _encodeQuery = function(config) {
        var str = [];
        var obj = config.query;
        var val;

        if (!_isJsonRequest(config)) {
            return _encodeData(obj);// if deep nested obj php-like query
        }

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                //TODO redundant, but faster!
                if (obj[key] === null || typeof obj[key] === 'string' || typeof obj[key] === 'number' || typeof obj[key] === 'boolean') {
                    val = obj[key];
                } else {
                    val = JSON.stringify(obj[key]);
                }
                str.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
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
                config.always(result, xhr, config);
            }
        };

        //catches cors requests
        xhr.onerror = function(error) {
            result.error = error;
        };

        var data = null;
        if (config.data) {
            data = _parseRequestBody(config);
        }

        if (typeof config.transformRequest === 'function') {
            config.transformRequest(config, data, xhr);
        }

        xhr.send(data);
        return xhr;
    };

    /// node/http
    var _httpRequest = function(url, config) {

        var _url =  Url.parse(url);
        var module = (_url.protocol === 'https:') ? https : http;

        var data = null; // parsed request data
        var _data = ''; // the incoming data stream

        var options = {
            host: (_url.port) ? _url.host.replace(':' + _url.port, '') : _url.host,
            path: _url.path,
            port: _url.port,
            query: _url.query,
            method: config.method,
            headers: config.headers
        };

        if (config.data) {
            data = _parseRequestBody(config);
            options.headers['content-length'] = Buffer.byteLength(data);
        }

        if (typeof config.transformRequest === 'function') {
            config.transformRequest(config, data, options);
        }

        var result = new Response();
        var request = module.request(options, function(res) {
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                // @var res: http.IncomingMessage
                _data += chunk;
            });

            res.on('end', function() {

                result.status = res.statusCode;
                result.statusText = res.statusMessage;
                result.data = _parseResponseBody(_data, config);
                result.headers = res.headers;

                if (typeof config.transformResponse === 'function') {
                    config.transformResponse(result);
                }

                if (res.statusCode < 299) {
                    config.success(result, res);
                } else {
                    config.error(result, res);
                }
                config.always(result, res, config);
            });

        });

        if (data) {
            request.write(data);
        }

        request.on('error', function(error) {
            result.error = error;
            config.error(result, request);
            config.always(result, error, config);
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
            promise: false,
            query: {},
            headers: {},
            data: null,
            responseType: '',//?TODO
            transformRequest: false,    // function(mergedConfig, parsedData, xhrInstance|httpRequestOptions)
            transformResponse: false,   // function(raw)
            success: function() {},     // (Response, raw)
            error: function() {},       // (Response, raw)
            always: function() {}       // (Response, raw, config)
        };

        // merge config with defaults
        config = mergeHash(defaults, config);

        // encode query params
        var query = _encodeQuery(config);
        if (query) {
            url = url + '?' + query;
        }

        var fn = (NODE) ? _httpRequest : _xhrRequest;

        if (config.promise === true) {

            return new exports.Promise(function(resolve, reject) {
                config.success = function(data) {
                    resolve(data);
                };
                config.error = function(data) {
                    reject(data);
                };
                fn(url, config);
            });
        }

        return fn(url, config);
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
