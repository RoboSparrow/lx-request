'use strict';

let server = require('./helper.server');
let assert = require('assert');

let req = require('../req.xapi');

describe('test', function() {

    let url;

    before(function() {
        url = server.listen(8000);
    });

    after(function() {
        server.close();
    });

    it('should create a server', function(done) {
        var http = require('http');
        http.get('http://localhost:8000/200.html', function(res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    it('should make a simple request, the default method is GET', function(done) {
        req.request(url + '/200', {
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['content-type'], 'text/plain');
                done();
            }
        });
    });

    it('should make a simple GET request with params', function(done) {
        req.request(url + '/200.html?test=hello', {
            method: 'GET',
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['content-type'], 'text/html');
                assert.strictEqual(result.headers['x-req-method'], 'GET');
                assert.strictEqual(result.headers['x-req-search'], '?test=hello');
                done();
            }
        });
    });

    it('should make a simple POST request with data', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            data: 'a string',
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(result.data, 'a string');
                done();
            }
        });
    });

    it('should make a simple PUT request with data (string)', function(done) {
        req.request(url + '/204', {
            method: 'PUT',
            data: 'a string',
            always: function(result, response) {
                assert.strictEqual(result.status, 204);
                assert.strictEqual(result.headers['x-req-method'], 'PUT');
                assert.strictEqual(result.data, '');
                done();
            }
        });
    });

    it('should make a simple HEAD request', function(done) {
        req.request(url + '/200', {
            method: 'HEAD',
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'HEAD');
                assert.strictEqual(result.data, '');
                done();
            }
        });
    });

    it('should make a simple PATCH request', function(done) {
        req.request(url + '/204', {
            method: 'PATCH',
            data: {
                change: 'that'
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 204);
                assert.strictEqual(result.headers['x-req-method'], 'PATCH');
                assert.strictEqual(result.data, '');
                done();
            }
        });
    });

    it('should make a simple DELETE request', function(done) {
        req.request(url + '/204?id=1234', {
            method: 'DELETE',
            always: function(result, response) {
                assert.strictEqual(result.status, 204);
                assert.strictEqual(result.headers['x-req-method'], 'DELETE');
                assert.strictEqual(result.headers['x-req-search'], '?id=1234');
                assert.strictEqual(result.data, '');
                done();
            }
        });
    });

    // @todo automate and run through any staus code
    it('should NOT trigger ERROR callback when a success status is returned', function(done) {
        let trigger = {
            success: 0,
            error: 0,
            always: 0
        };
        req.request(url + '/204', {
            method: 'PUT',
            data: {
                some: 'data'
            },
            success: function(result, response) {
                trigger.success++;
            },
            error: function(result, response) {
                trigger.error++;
            },
            always: function(result, response) {
                trigger.always++;
                assert.strictEqual(result.status, 204);
                assert.strictEqual(trigger.success, 1);
                assert.strictEqual(trigger.error, 0);
                done();
            }
        });
    });

    // @todo automate and run through any staus code
    it('should NOT trigger SUCCSESS callback when an error status is returned', function(done) {
        let trigger = {
            success: 0,
            error: 0,
            always: 0
        };
        req.request(url + '/400', {
            method: 'GET',
            success: function(result, response) {
                trigger.success++;
            },
            error: function(result, response) {
                trigger.error++;
            },
            always: function(result, response) {
                trigger.always++;
                assert.strictEqual(result.status, 400);
                assert.strictEqual(trigger.success, 0);
                assert.strictEqual(trigger.error, 1);
                done();
            }
        });
    });

});
