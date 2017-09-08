'use strict';

const assert = require('chai').assert;
const req = require('../../req.xapi');
const server = require('../helper.server');

const LRS = 'http://localhost:8000/xapi';
const AUTH = 'Basic ' + req.xapi.toBase64('test:test');
const VERSION = '1.0.2';
const LEGACY = false;

req.xapi.LRS = LRS;
req.xapi.AUTH = AUTH;
req.xapi.VERSION = VERSION;
req.xapi.LEGACY = false;

const beforeTest = function() {
    server.listen(8000);
};

const afterTest =function() {
    server.close();
};

describe('req.xapi config.lrs overwrites global settings', function() {

    before(beforeTest);
    after(afterTest);

    it('should create a server', function(done) {
        var http = require('http');
        http.get('http://localhost:8000/xapi/statements', function(res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    it('should ensure a standard request with lrs globals', function(done) {
        req.xapi.get('/statements', {
            always: function(res) {
                assert.equal(200, res.status);
                done();
            }
        });
    });


    it('GET /statements: req.xapi config.lrs overwrites req[SETTING]', function(done) {

        // bad globals
        req.xapi.LRS = 'invalid';
        req.xapi.AUTH = 'invalid';
        req.xapi.VERSION = 'invalid';
        req.xapi.LEGACY = 'invalid';

        req.xapi(
            '/statements',
            {
                method: 'GET',
                xapi: {
                    // good config
                    lrs: LRS,
                    auth: AUTH,
                    version: VERSION,
                    legacy: LEGACY
                },
                always: function(res) {
                    assert.strictEqual(res.status, 200, 'request should have passed with response status: 200');

                    assert.strictEqual(req.xapi.AUTH, 'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.VERSION,'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.LRS, 'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.LEGACY,'invalid', 'retained invalid LRS globals');
                    done();
                }
            }
        );

    });

    it('LEGACY MODE: GET /statements: req.xapi config.lrs overwrites req[SETTING]', function(done) {

        // bad globals
        req.xapi.LRS = 'invalid';
        req.xapi.AUTH = 'invalid';
        req.xapi.VERSION = 'invalid';
        req.xapi.LEGACY = 'invalid';

        req.xapi(
            '/statements',
            {
                method: 'GET',
                xapi: {
                    // good config
                    lrs: LRS,
                    auth: AUTH,
                    version: VERSION,
                    legacy: true
                },
                always: function(res) {
                    assert.strictEqual(res.status, 200, 'request should have passed with response status: 200');

                    assert.strictEqual(req.xapi.AUTH, 'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.VERSION,'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.LRS, 'invalid', 'retained invalid LRS globals');
                    assert.strictEqual(req.xapi.LEGACY,'invalid', 'retained invalid LRS globals');
                    done();
                }
            }
        );

    });

});
