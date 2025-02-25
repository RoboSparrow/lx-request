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

    it('should call LOGFN (callback)', function(done) {
        let tick = 0;

        req.LOGFN = function(res, conf) {
            tick += 1;
        };

        req.request(url + '/200', {
            success: function(result, response) {
                assert.strictEqual(result.status, 200);
            },
            always: function(result, response) {
                assert.strictEqual(tick, 1, 'LOGFN has been called');
                done();
            }
        });
    });

    it('should call LOGFN (promise)', function() {
        let tick = 0;

        req.LOGFN = function(res, conf) {
            tick += 1;
        };

        return req.request(url + '/200', {
            promise: true
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
            assert.strictEqual(tick, 1, 'LOGFN has been called');
        })
        ;
    });

    it('should call LOGFN on error', function(done) {
        let tick = 0;

        req.LOGFN = function(res, conf) {
            tick += 1;
        };

        const trigger = {
            success: 0,
            error: 0,
            always: 0
        };
        req.request(url + '/400?dsa', {
            method: 'GET',
            success: function(result, response) {
                trigger.success++;
            },
            error: function(result, response) {
                trigger.error++;
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 400);
                assert.strictEqual(trigger.success, 0);
                assert.strictEqual(trigger.error, 1);

                assert.strictEqual(tick, 1, 'LOGFN has been called');
                done();
            }
        });
    });

});
