/**
 * @author jboeselt
 * simple xapi http requests via XHR or NODE (request module)
 */

if ((typeof module !== 'undefined' && module.exports)) {
    var req = require('./req.js');
}

(function(req) {

    'use strict';

    // aggregate helper (callback mode only, see search())
    var aggregate = function(api, config, options) {

        if (typeof options.cap !== 'number') {
            options.cap = -1; // TODO
        }

        var response = null;
        var prev = null;
        var next = null;

        var resolve = config.success || function() {};

        var mergeData = function(res) {
            if (!response) {
                response = res;
                return;
            }
            var oldData = options.dataFn(response, config);
            var newData = options.dataFn(res, config);
            for (var i = 0; i < newData.length; i++) {
                oldData.push(newData[i]);
            }
            return oldData.length;
        };

        var success = function(res, ins) {
            next = options.nextFn(res, config);
            var length = mergeData(res);

            if (!next || next === prev) {
                // replace data with merged data in current response
                res.data = response.data;
                resolve(res, ins);
                return;
            }

            if (options.cap > -1 && length >= options.cap) {
                // replace data with merged data in current response
                res.data = response.data;
                resolve(res, ins);
                return;
            }
            prev = next;

            req.xapi.get(next, config);
        };

        config.success = success;
        req.xapi.get(api, config);
    };

    var search = function(api, config, options) {
        var p = (config.promise === true || req.ASYNC === 'promise');

        if (p) {
            config.promise = false;
            return new req.Promise(function(resolve, reject) {
                config.success = function(data) {
                    resolve(data);
                };
                config.error = function(data) {
                    reject(data);
                };
                return aggregate(api, config, options);
            });
        }

        return aggregate(api, config, options);
    };

    /**
     * for details @see ./test/xapi/legacy.js
     */
    var transformRequestLegacy = function(config, queryString) {

        // responseType
        queryString = queryString || '';
        var method = config.method || 'GET';
        var headers = config.headers || null;
        var query = config.query || null;
        var data = config.data || null;

        var sData = [];

        if (queryString) {
            sData.push(queryString);
        }

        if (query) {
            sData.push(req.serializeParams(query));
        }

        if (headers) {
            sData.push(req.serializeParams(headers));
        }

        if (data) {
            var json = JSON.stringify(config.data);
            sData.push('Content-Length=' + json.length);
            sData.push('content=' + encodeURIComponent(json));
        }

        //// transform config
        config.responseType = '';
        config.headers = {
            'Content-Type': 'application/x-www-form-urlencoded' //content-length is added by raw
        };
        config.query = {
            method: method
        };
        config.method = 'POST';
        config.transformResponse = function(response) {
            if (!response.data) {
                return;
            }
            try {
                response.data = JSON.parse(response.data);
            } catch (e) {
                //@TODO
                console.error(e);
            }
        };
        // add sData
        config.data = sData.join('&');

        return config;
    };

    var lrs = function(config) {
        var xapi = config.xapi || {};

        return {
            lrs:     xapi.lrs     || req.xapi.LRS,
            auth:    xapi.auth    || req.xapi.AUTH,
            version: xapi.version || req.xapi.VERSION,
            legacy : (typeof xapi.legacy !== 'undefined') ? xapi.legacy : req.xapi.LEGACY
        };
    };

    var defaults = function(xapi) {
        return {
            headers: {
                'Content-Type'             : 'application/json',
                'Authorization'            : xapi.auth,
                'X-Experience-API-Version' : xapi.version
            },
            responseType: 'json'
        };
    };

    var endpoint = function(lrs, api) {
        return lrs + api;
    };

    ////
    // default xapi request
    ////

    req.xapi = function(api, config) {

        // xapi config
        var xapi = lrs(config);
        config.xapi = undefined; // overwrite temporarily

        // merge config and re-attach xapi for debug
        // note it's still possible to overwrite default headers
        // TODO req.DEBUG
        config = req.extendDefaults(defaults(xapi), config);
        config.xapi = xapi;

        // build url
        var url = endpoint(xapi.lrs, api);

        if (config.xapi.legacy) {
            var parts = url.split('?');
            config = transformRequestLegacy(config, parts[1]);
            return req.raw(parts[0], config);
        }

        return req.request(url, config);// note the order of merge. default overwrites are allowed
    };

    ////
    // shortcut methods
    ////

    req.xapi.get = function(api, config) {
        return req.xapi(api, config);// note the order of merge. default overwrites are allowed
    };

    req.xapi.head = function(api, config) {
        config = config || {};
        config.method = 'HEAD';
        return req.xapi(api, config);
    };

    req.xapi['delete'] = function(api, config) {
        config = config || {};
        config.method = 'HEAD';
        return req.xapi(api, config);
    };

    req.xapi.post = function(api, data, config) {
        config = config || {};
        config.method = 'POST';
        config.data = data;
        return req.xapi(api, config);
    };

    req.xapi.put = function(api, data, config) {
        config = config || {};
        config.method = 'PUT';
        config.data = data;
        return req.xapi(api, config);
    };

    req.xapi.statements = function(config, options) {
        // TODO: decide on default cap
        options = req.extend({
            // callback for fetching data
            dataFn: function(res, conf) {
                return res.data.statements;
            },
            // callback for building parse more url
            nextFn: function(res, conf) {
                var more = res.data.more || null;
                if (!more) {
                    return null;
                }
                conf.query = null;

                var parts = more.split('/statements');
                return '/statements' + parts[parts.length - 1];
            }
        }, options);
        return search('/statements', config, options);
    };

    ////
    // helper methods
    ////

    req.xapi.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            // eslint-disable-next-line no-bitwise, eqeqeq
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    req.xapi.toBase64 = function(str) {
        // eslint-disable-next-line no-undef
        return (typeof btoa === 'function') ? btoa(str) : new Buffer(str).toString('base64');
    };

    // get headers
    req.xapi.getHeaders = function() {
        return defaults().headers;
    };

    // get headers
    req.xapi.getEndpoint = function(api) {
        return endpoint(api);
    };

    ////
    // vars
    ////

    req.xapi.LEGACY = false;

    req.xapi.LRS = '';
    req.xapi.AUTH = '';
    req.xapi.VERSION = '';

    return req;

})(req);

//// node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = req;
}
