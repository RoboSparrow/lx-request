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

    it('should follow the callback order for a successful (200) GET request', function(done) {
        const called = [];
        const expected = ['transformRequest', 'transformResponse', 'success', 'always'];
        req.request(
            url + '/200',
            {
                method: 'GET',
                serialize: function(data) {
                    called.push('serialize');// should not be called here
                    return data;
                },
                transformRequest: function(config, options) {
                    called.push('transformRequest');
                },
                transformResponse: function(config, options) {
                    called.push('transformResponse');
                },
                error: function() {
                    called.push('error'); // should not be called here
                },
                success: function() {
                    called.push('success');
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 200, 'response status: 200');
                    assert.strictEqual(called.toString(), expected.toString(), 'callbacks were called in the exact order of: ' + expected.toString());
                    done();
                }
            }
        );
    });

    it('should follow the callback for an errornous (400) GET request', function(done) {
        const called = [];
        const expected = ['transformRequest', 'transformResponse', 'error', 'always'];
        req.request(
            url + '/400',
            {
                method: 'GET',
                serialize: function(data) {
                    called.push('serialize');// should not be called here
                    return data;
                },
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
                    called.push('success'); //should not be called here
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 400, 'response status: 400');
                    assert.strictEqual(called.toString(), expected.toString(), 'callbacks were called in the exact order of: ' + expected.toString());
                    done();
                }
            }
        );
    });

    it('should follow the callback order for a successful (204) data (PUT) request', function(done) {
        const called = [];
        const expected = ['serialize', 'transformRequest', 'transformResponse', 'success', 'always'];
        req.request(
            url + '/204',
            {
                method: 'PUT',
                data: 'data',
                serialize: function(data) {
                    called.push('serialize');
                    return data;
                },
                transformRequest: function(config, options) {
                    called.push('transformRequest');
                },
                transformResponse: function(config, options) {
                    called.push('transformResponse');
                },
                error: function() {
                    called.push('error');// should bnot be called here
                },
                success: function() {
                    called.push('success');
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 204, 'response status: 204');
                    assert.strictEqual(called.toString(), expected.toString(), 'callbacks were called in the exact order of: ' + expected.toString());
                    done();
                }
            }
        );
    });

    it('should follow the callback order for anrrornous (400) data (PUT) request', function(done) {
        const called = [];
        const expected = ['serialize', 'transformRequest', 'transformResponse', 'error', 'always'];
        req.request(
            url + '/400',
            {
                method: 'PUT',
                data: 'data',
                serialize: function(data) {
                    called.push('serialize');
                    return data;
                },
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
                    called.push('success');// should bnot be called here
                },
                always: function(res, ins) {
                    called.push('always');

                    assert.strictEqual(res.status, 400, 'response status: 400');
                    assert.strictEqual(called.toString(), expected.toString(), 'callbacks were called in the exact order of: ' + expected.toString());
                    done();
                }
            }
        );
    });

});
