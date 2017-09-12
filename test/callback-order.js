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

describe('Callback sequence order', function() {

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

    it('should follow the callback order for a successful (200) request', function(done) {
        const called = [];
        const expected = ['transformRequest', 'transformResponse', 'success', 'always'];
        req.request(
            url + '/200',
            {
                method: 'GET',
                transformRequest: function(config, options) {
                    called.push('transformRequest');
                },
                transformResponse: function(config, options) {
                    called.push('transformResponse');
                },
                error: function() {
                    called.push('error');
                },
                success: function() {
                    called.push('success');
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 200, 'response status: 200');

                    let s;
                    s = 'transformRequest';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));
                    s = 'success';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));
                    s = 'always';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));

                    // special
                    assert.strictEqual(called.length, expected.length, 'the number of called callbacks mathches the number of ecpected callbacks.');
                    assert.strictEqual(called.indexOf('transformRequest'), expected.indexOf('transformRequest'), 'transformRequest() was called first');
                    assert.strictEqual(called.indexOf('error'), expected.indexOf('error'), 'error() was not called');
                    assert.strictEqual(called.indexOf('always'), expected.length - 1, 'always() was called last');

                    done();
                }
            }
        );
    });

    it('should follow the callback for an errornous (400) request', function(done) {
        const called = [];
        const expected = ['transformRequest', 'transformResponse', 'error', 'always'];
        req.request(
            url + '/400',
            {
                method: 'GET',
                transformRequest: function(config, options) {
                    called.push('transformRequest');
                },
                transformResponse: function(config, options) {
                    called.push('transformResponse');
                },
                error: function() {
                    called.push('error');
                },
                success: function() {
                    called.push('success');
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 400, 'response status: 400');

                    let s;
                    s = 'transformRequest';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));
                    s = 'error';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));
                    s = 'always';
                    assert.strictEqual(called.indexOf(s), expected.indexOf(s), s + '() was called on index ' + expected.indexOf(s));

                    // special
                    assert.strictEqual(called.length, expected.length, 'the number of called callbacks mathches the number of ecpected callbacks.');
                    assert.strictEqual(called.indexOf('transformRequest'), expected.indexOf('transformRequest'), 'transformRequest() was called first');
                    assert.strictEqual(called.indexOf('success'), expected.indexOf('success'), 'success() was not called');
                    assert.strictEqual(called.indexOf('always'), expected.length - 1, 'always() was called last');

                    done();
                }
            }
        );
    });

});
