'use strict';

const server = require('./helper.server');
const assert = require('assert');
const req = require('../req');

const beforeSpec = function(done) {
    server.listen(8000);
    done();
};

const afterSpec = function(done) {
    server.close();
    done();
};

describe('promise', function() {

    const url = 'http://localhost:8000';

    before(beforeSpec);
    after(afterSpec);

    it('should create a server', function(done) {
        var http = require('http');
        http.get('http://localhost:8000/200.html', function(res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    it('req.ASYNC defaults to "callback"', function(done) {
        assert.strictEqual(req.ASYNC, 'callback', 'req.ASYNC === callback');
        done();
    });

    it('should answer to success callback', function(done) {
        req.request(url + '/200', {
            success: function(result, response) {
                assert.strictEqual(result.status, 200);
                done();
            }
        });
    });

    it('should answer to error callback', function(done) {
        req.request(url + '/400', {
            error: function(result, response) {
                assert.strictEqual(result.status, 400);
                done();
            }
        });
    });

    it('when req.ASYNC === "promise", it should make promise request, success', function() {
        let always = false;
        let transformRequest = false;
        let transformResponse = false;
        let success = false;
        let error = false;

        req.ASYNC = 'promise';

        return req.request(url + '/200', {
            transformRequest: function() {
                transformRequest = true;
            },
            transformResponse: function() {
                transformResponse = true;
            },
            success: function() {
                success = true;
            },
            error: function() {
                error = true;
            },
            always: function() {
                always = true;
            }
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
            assert.strictEqual(transformRequest, true, 'transformRequest callback was called');
            assert.strictEqual(transformResponse, true, 'transformRespone callback was called');
            assert.strictEqual(always, true, 'always callback was called');
            assert.strictEqual(success, false, 'always callback was NOT called');
            assert.strictEqual(error, false, 'error callback was NOT called');
        })
        ;
    });

    it('when req.ASYNC === "promise", it should make promise request, error', function() {
        let always = false;
        let transformRequest = false;
        let transformResponse = false;
        let success = false;
        let error = false;

        req.ASYNC = 'promise';

        return req.request(url + '/500', {
            transformRequest: function() {
                transformRequest = true;
            },
            transformResponse: function() {
                transformResponse = true;
            },
            success: function() {
                success = true;
            },
            error: function() {
                error = true;
            },
            always: function() {
                always = true;
            }
        })
        .catch(function(result) {
            assert.strictEqual(result.status, 500);
            assert.strictEqual(transformRequest, true, 'transformRequest callback was called');
            assert.strictEqual(transformResponse, true, 'transformRespone callback was called');
            assert.strictEqual(always, true, 'always callback was called');
            assert.strictEqual(success, false, 'always callback was NOT called');
            assert.strictEqual(error, false, 'error callback was NOT called');
        })
        ;
    });
});
