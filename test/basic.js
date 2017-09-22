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

describe('Basic test', function() {

    const url = 'http://localhost:8000';

    before(beforeSpec);
    after(afterSpec);

    it('should create a server', function(done) {
        var http = require('http');
        http.get(url + '/200.html', function(res) {
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
            preset: 'raw',
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
            preset: 'raw',
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
            preset: 'json',
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
        const trigger = {
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
    it('should NOT trigger SUCCESS callback when an error status is returned', function(done) {
        const trigger = {
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

describe('Headers', function() {

    const url = 'http://localhost:8000';

    before(beforeSpec);
    after(afterSpec);

    it('shoud normalize header names to first letter uppercase and retain the values', function(done) {
        req.get(url + '/200', {
            headers: {
                'X-UPPERCASE': 'UPPER',
                'x-lowercase': 'lower',
                'x-MixED-CaSe': 'mixed'
            },
            beforeSend: function(config) {
                assert.strictEqual(config.headers['X-UPPERCASE'], undefined);
                assert.strictEqual(config.headers['x-lowercase'], undefined);
                assert.strictEqual(config.headers['x-MixED-CaSe'], undefined);

                assert.strictEqual(config.headers['X-Uppercase'], 'UPPER');
                assert.strictEqual(config.headers['X-Lowercase'], 'lower');
                assert.strictEqual(config.headers['X-Mixed-Case'], 'mixed');
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                done();
            }
        });
    });

    it('different case headers are treated as one', function(done) {
        req.get(url + '/200', {
            headers: {
                'X-CUSTOM': 'one',
                'x-custom': 'two'
            },
            beforeSend: function(config) {
                assert.strictEqual(config.headers['X-CUSTOM'], undefined);
                assert.strictEqual(config.headers['X-Custom'], 'two');
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                done();
            }
        });
    });

});

describe('Query string', function() {

    const url = 'http://localhost:8000';

    before(beforeSpec);
    after(afterSpec);

    it('should append the query object to the url', function(done) {
        req.get(url + '/200', {
            query: {
                query: 1
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-search'], '?query=1');
                done();
            }
        });
    });

    it('should append the query object to an url parameter with an existing (hardcoded) query', function(done) {
        req.get(url + '/200?query=1', {
            query: {
                query: 2
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-search'], '?query=1&query=2');
                done();
            }
        });
    });
});
