/**
 * @author jboeselt
 * simple xapi http requests via XHR or NODE (request module)
 */

var req = (function() {

    'use strict';

    var settings = {
        ASYNC: 'callback'
    };

    // check node or browser
    // - note that bundler like webpack might have both window and commonJS module
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
    settings.Promise = (typeof Promise !== 'function') ? function() {
        throw new Error('"promise" flag was set in request config but the system doesn\'t support ES6 Promise, use callbacks instead.');
    } : Promise;

    ////
    // Utils
    ////

    var _isScalar = function(v) {
        var type = typeof v;
        return v === null || ['string', 'number', 'boolean'].indexOf(type) > -1;
    };

    var _baseExtendArray = function(targ, arr) {
        var l = arr.length;
        for (var k = 0; k < l; k++) {
            targ[k] = arr[k];
        }
        return targ;
    };

    /**
    * extends targObj  with one object or more objects.
    * mutates first object (targObj)
    *      extend(targObj, obj1, [obj2...])
    *      extend(deepFlag, targObj, obj1, [obj2...])
    *
    * if deepFlag === true:
    *      [object Object] properties are deeply merged
    *      [object Array] properties are flat merged (simply adding/replacing indexes)
    */
    var extend = function() {
        var s = 0;
        var deep = false;
        var obj;
        var val;
        var src;
        var length = arguments.length;
        if (typeof arguments[0] === 'boolean') {
            s = 1;
            deep = arguments[0];
        }
        src = arguments[s];
        s += 1;
        for (var i = s; i < length; i++) {
            obj = arguments[i];
            for (var key in obj) {
                val = obj[key];
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }
                if (val === undefined) {
                    continue;
                }
                if (!deep) {
                    src[key] = val;
                    continue;
                }
                if (_isScalar(val)) {
                    src[key] = val;
                    continue;
                }
                var pType = Object.prototype.toString.call(val);
                if (pType === '[object Object]') {
                    // force new assignment
                    src[key] = extend(deep, src[key] || {}, val);
                    continue;
                }
                if (pType === '[object Array]') {
                    // force new assignment
                    src[key] = _baseExtendArray(src[key] || [], val);
                    continue;
                }
                src[key] = val;
            }
        }
        return src;
    };

    var extendDefaults = function(defaults, config) {
        defaults.data = undefined;
        return extend(true, defaults, config);
    };

    ////
    // headers
    ////

    var normalizeHeaders = function(config) {
        var headers = config.headers;
        var normalized = {};
        var parts;
        var k;
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                k = '';
                parts = key.toLowerCase().split('-');
                for (var i = 0; i < parts.length; i++) {
                    k += (k) ?  '-' : '';
                    k += parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
                }
                normalized[k] = headers[key];
            }
        }
        config.headers = normalized;
    };

    ////
    // Data serialization
    ////

    // parse urelencoded request body
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

    // encode a javascript object into a query string
    // - TODO merge, review, see https://github.com/angular/angular.js/blob/master/src/ng/http.js#L60 and https://stackoverflow.com/a/30970229
    var encodeData = function(obj, prefix) {
        prefix = prefix || '';
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            obj = obj.reduce(function(o, v, i) {// TODO >= ie9
                o[i] = v;
                return o;
            }, {});
        }

        var str = [];
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
                str.push(typeof v === 'object' ? encodeData(v, k) : encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        }
        return str.join('&');
    };

    // encode a javascript object into a query string
    // - TODO merge with above
    var _encodeQuery = function(config) {
        var str = [];
        var obj = config.query;
        var val;

        if (config.type !== 'json') {
            return encodeData(obj);// if deep nested obj php-like query
        }

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = (_isScalar(obj[key])) ? obj[key] : JSON.stringify(obj[key]);
                str.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
            }
        }
        return str.join('&');
    };

    var Serializer = {

        json: function(data) {
            try {
                return JSON.stringify(data);
            } catch (e) {
                //@TODO DEBUG, log error, production throw
                throw Error('Serializer.json: Failed to stringify JSON: ' + e.message);
            }
        },

        form: function(data) {
            // scalars
            if (_isScalar(data)) {
                return encodeURI(data);
            }
            // TODO optimise
            var _type = Object.prototype.toString.call(data);
            if (sendableRawDataFormats.indexOf(_type) > -1) {
                throw Error('Serializer.form: Cannot encode data of type ' + _type);
            }

            return encodeData(data);
        },

        plain: function(data) {
            if (typeof data !== 'string') {
                throw Error('Serializer.plain: String required');
            }
            return data;
        },

        raw: function(data) {
            // nothing, use at own risk
            return data;
        }

    };

    // parse JSON
    var _parseResponseBody = function(body, config) {

        if (!body || body === undefined) {
            return body;
        }

        if (config.type === 'json') {
            try {
                return JSON.parse(body);
            } catch (e) {
                //@TODO thow? Response.error? leave Response.data=null?
                console.error('_parseResponseBody: Failed to parse response JSON: ' + e.message);
            }
        }
        // everything else than json
        return body;
    };

    ////
    // Response
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

    // XHR request
    var _xhrRequest = function(url, config) {

        var xhr = new XMLHttpRequest();
        xhr.open(config.method, url, true);

        // headers
        for (var key in config.headers) {
            if (config.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, config.headers[key]);
            }
        }

        var result = new Response();
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

        // catches cors requests
        xhr.onerror = function(error) {
            result.error = error;
        };

        var data = null;
        if (config.data) {
            data = config.serialize(config.data);
            //TODO options.headers['Content-Length'] = bytelength;
        }

        if (typeof config.beforeSend === 'function') {
            config.beforeSend(config, data, xhr);
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
            data = config.serialize(config.data);
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        if (typeof config.beforeSend === 'function') {
            config.beforeSend(config, data, options);
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

    /////
    // config controller
    // TODO charset global option
    // - https://xhr.spec.whatwg.org/
    ////

    var applyConfig = function(config, isHttp) {

        var preset = config.preset;
        var type = (preset) ? preset : 'none';
        var serializer;

        // if preset, set (and overwrite!) headers header and choose default serializer callback
        switch (type) {
            case 'json': {
                config.headers['Content-Type'] = 'application/json; charset=utf-8';
                config.headers['Accept'] = 'application/json, text/plain, */*';
                if(isHttp) {
                    config.headers['Accept-Charset'] = 'utf-8';
                }
                serializer = Serializer.json;
                break;
            }

            case 'form': {
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
                config.headers['Accept'] = 'application/x-www-form-urlencoded, text/plain, */*';
                if(isHttp) {
                    config.headers['Accept-Charset'] = 'utf-8';
                }
                serializer = Serializer.form;
                break;
            }

            case 'plain': {
                config.headers['Content-Type'] = 'text/plain; charset=utf-8';
                config.headers['Accept'] = 'text/plain, */*';
                if(isHttp) {
                    config.headers['Accept-Charset'] = 'utf-8';
                }
                serializer = Serializer.plain;
                break;
            }

            case 'raw': {
                serializer =  Serializer.raw;
                break;
            }

            // if no preset, inspect content-type header and set serializer callback
            default: {

                var header = config.headers['Content-Type'] || '';

                if (/text\/plain/i.test(header)) {
                    type = 'plain';
                    serializer = Serializer.plain;
                    break;
                }

                if (/application\/x-www-form-urlencoded/i.test(header)) {
                    type = 'form';
                    serializer = Serializer.form;
                    break;
                }

                if (/application\/json/i.test(header)) {
                    type = 'json';
                    serializer = Serializer.json;
                    break;
                }

                // if no or empty header is set it defaults to  inimal config "form"
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
                type = 'form';
                serializer = Serializer.form;
            }
        }

        // add type as a shorthand lookup
        config.type = type;

        // set chosen serializer only if no custom serializer was set in config
        if (typeof config.serialize !== 'function') {
            config.serialize = serializer;
        }

        return config;
    };

    ////
    // request api
    ////

    var request = function(url, config) {

        // 'raw' in comments below: xhr or http.ClientRequest
        var defaults = {
            method: 'GET',              // request method //TODO normalize uppercase
            promise: false,             // return promise or use "success" and "error" calback options. if set to true these callbacks will be ignored
            query: {},                  // query params object (key, value)
            headers: {},                // header object (key, value), maybe overwritten by "preset" option
            preset: '',                 // 'json', 'form', 'plain', 'raw'
            serialize: false,           // custom serializer function. taking data and returning string
            beforeSend: false,          // inspect a request who is about to be sent. function(mergedConfig, parsedData, xhrInstance|httpRequestOptions) note that config changes will have no effect
            transformResponse: false,   // function(raw)
            success: function() {},     // (Response, raw)
            error: function() {},       // (Response, raw)
            always: function() {}       // (Response, raw, config)
        };

        // merge config with defaults
        config = extendDefaults(defaults, config);
        // normalize headers
        normalizeHeaders(config);
        // apply request type, presets, set serializer
        applyConfig(config, NODE);

        // encode query params
        var query = _encodeQuery(config);
        if (query) {
            var glue = (url.indexOf('?') > -1) ? '&' : '?';
            url = url + glue + query;
        }

        var fn = (NODE) ? _httpRequest : _xhrRequest;
        var p = (config.promise === true || settings.ASYNC === 'promise');

        if (p) {
            return new settings.Promise(function(resolve, reject) {
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

    ////
    //  export
    ////

    var exports = settings;

    exports.extend = extend;
    exports.extendDefaults = extendDefaults;
    exports.serializeParams = encodeData;

    exports.request = request;

    // application/json request
    exports.json = function(url, config) {
        config = config || {};
        config.preset = 'json';
        return request(url, config);// note the order of merge. default overwrites are allowed
    };

    // application/x-www-form-urlencoded request
    exports.form = function(url, config) {
        config = config || {};
        config.preset = 'form';
        return request(url, config);// note the order of merge. default overwrites are allowed
    };

    // text/plain request
    exports.plain = function(url, config) {
        config = config || {};
        config.preset = 'plain';
        return request(url, config);// note the order of merge. default overwrites are allowed
    };

    // raw request (everything goes, no serialization)
    exports.raw = function(url, config) {
        config = config || {};
        config.preset = 'raw';
        return request(url, config);// note the order of merge. default overwrites are allowed
    };

    exports.get = function(url, config) {
        config = config || {};
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

// node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = req;
}
