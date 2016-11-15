/**
 * @author jboeselt
 * simple xapi http requests via XHR or NODE (request module)
 * `$ node my-test.js`
 */

if ((typeof module !== 'undefined' && module.exports)) {
    var req = require('./req.js');
}

(function(req) {

    'use strict';

    /**
     * @see https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#cors
     * @see https://blogs.msdn.microsoft.com/ieinternals/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds/
     */

    var transformRequestLegacy = function(config) {

        // responseType
        config.responseType = '';

        // headers: add to data and remove
        var data = config.headers;
        config.headers = {};

        // query
        var query = config.query || null;

        if (query) {
            data = req.mergeHash(data, query);
        }
        // query only method params allowed according to spec
        config.query = {
            method: config.method || 'GET'
        };

        // method
        config.method = 'POST';

        // method
        config.transformResponse = function(response) {
            try {
                response.data = JSON.parse(response.data);
            } catch (e) {
                //@TODO
                console.error(e);
            }
        };

        // data
        if (typeof config.data !== 'undefined') {
            data.content = config.data;
        }
        config.data = data;

        return config;
    };

    var defaults = function() {
        return {
            headers: {
                'Content-Type'             : 'application/json',
                'Authorization'            : req.xapi.AUTH,
                'X-Experience-API-Version' : req.xapi.VERSION
            },
            responseType: 'json'
        };
    };

    var endpoint = function(api) {
        return req.xapi.LRS + api;
    };

    ////
    // default xapi request
    ////

    req.xapi = function(api, config) {
        var url = endpoint(api);

        config = req.mergeHash(defaults(), config);

        if (req.xapi.LEGACY) {
            config = transformRequestLegacy(config);
            return req.raw(url, config);
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

    ////
    // helper methods
    ////

    // @see Math.uuid.js (v1.4)
    req.xapi.uuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            // eslint-disable-next-line no-bitwise, eqeqeq
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
