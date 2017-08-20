'use strict';

const server = require('./helper.server');
const assert = require('assert');

const req = require('../req.xapi');

describe('request query parsing', function() {

    let url;

    const agent = {
        mbox: 'mailto:test@test.test'
    };

    before(function() {
        url = server.listen(8000);
    });

    after(function() {
        server.close();
    });

    it('if request is not `application/json` then, complex GET params sholuld be parsed php-like', function(done) {
        req.request(url + '/200', {
            query: {
                agent
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.notEqual(result.headers['x-req-content-type'], 'application/json');// empty, in fact

                const search = result.headers['x-req-search'];
                const expected = '?agent[mbox]=mailto:test@test.test';
                assert.strictEqual(decodeURIComponent(search), expected);
                done();
            }
        });
    });

    it('if request is `application/json` then complex GET params sholuld be parsed to json', function(done) {

        req.json(url + '/200', {
            query: {
                agent
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-content-type'], 'application/json');

                const search = result.headers['x-req-search'];
                const expected = '?agent=' + JSON.stringify(agent);
                assert.strictEqual(decodeURIComponent(search), expected);
                done();
            }
        });
    });

    it('if request.xapi then complex GET params sholuld be parsed to json', function(done) {
        req.xapi('/statements', {
            query: {
                agent
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(Object.prototype.toString.call(result.data.statements), '[object Array]', 'is an array');
                done();
            }
        });
    });

});