'use strict';

const server = require('./helper.server');
const assert = require('assert');
const req = require('../req');

const beforeSpec = function(done) {
    server.listen(8000);
    done();
};

const afterSpec = function(done) {
    req.LOGFN = undefined;
    req.ASYNC = 'callback';
    server.close();
    done();
};

describe('req.LOGFN', function() {

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

    it('LOGFN defaults to null', function(done) {
        assert.strictEqual(req.LOGFN, null, 'LOGFN === null');
        done();
    });

    it('should call LOGFN (promise)', function() {
        let tick = 0;

        req.LOGFN = function(res, conf) {
            tick += 1;
        };

        // extras.always is being called after config.always, so we can't use callbackes easily in order to count ticks
        return req.request(url + '/200', { promise: true })
        .then(function(result) {
            assert.strictEqual(tick, 1, 'LOGFN has been called');
            return req.request(url + '/200', { promise: true });
        })
        .then(function(result) {
            assert.strictEqual(tick, 2, 'LOGFN has been called');
            return req.request(url + '/200', { promise: true });
        })
        .then(function(result) {
            assert.strictEqual(tick, 3, 'LOGFN has been called')
            return true;
        })
        ;
    });

    it('should call LOGFN on error', function() {
        let tick = 0;

        req.LOGFN = function(res, conf) {
            tick += 1;
        };

        // extras.always is being called after config.always, so we can't use callbackes easily in order to count ticks
        return req.request(url + '/400', { promise: true })
        .catch(function(result) {
            assert.strictEqual(tick, 1, 'LOGFN has been called');
            return req.request(url + '/400', { promise: true });
        })
        .catch(function(result) {
            assert.strictEqual(tick, 2, 'LOGFN has been called');
            return req.request(url + '/400', { promise: true });
        })
        .catch(function(result) {
            assert.strictEqual(tick, 3, 'LOGFN has been called')
            return true;
        })
        ;
    });

});
