'use strict';

let server = require('./helper.server');
let assert = require('assert');

let req = require('../req');

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

    it('request should return an instance of Promise', function() {
        const ref = Object.prototype.toString.call(Promise.resolve());
        const ins = req.request(url + '/200', {
            promise: true
        });
        assert.strictEqual(Object.prototype.toString.call(ins), ref);
    });

    it('should make a simple promise request, success', function() {
        return req.request(url + '/200', {
            promise: true
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
        })
        ;
    });

    it('should make a simple promise request, reject', function() {
        return req.request(url + '/400', {
            promise: true
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
        },
        function(result) {
            assert.strictEqual(result.status, 400);
        })
        ;
    });

    it('should make a simple promise request, catch', function() {
        return req.request(url + '/400', {
            promise: true
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
        })
        .catch(function(result) {
            assert.strictEqual(result.status, 400);
        })
        ;
    });

    it('should not invoke config.success callback', function() {
        return req.request(url + '/200', {
            promise: true,
            success: function() {
                assert.strictEqual(true, false);
            }
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
        })
        ;
    });

    it('should not invoke config.error callback', function() {
        return req.request(url + '/400', {
            promise: true,
            error: function() {
                assert.strictEqual(true, false);
            }
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
        },
        function(result) {
            assert.strictEqual(result.status, 400);
        })
        ;
    });

    it('should still invoke config.always callback', function() {
        var called = false;
        return req.request(url + '/200', {
            promise: true,
            always: function(result) {
                called = true;
            }
        })
        .then(function() {
            //config.always called after config.success
            setTimeout(function() {
                assert.strictEqual(called, true);
            }, 500);
        })
        ;
    });

    it('should still invoke config.transformResponse callback', function() {
        var called = false;
        return req.request(url + '/200', {
            promise: true,
            transformResponse: function(result) {
                called = true;
            }
        })
        .then(function() {
            assert.strictEqual(called, true);
        })
        ;
    });

});
