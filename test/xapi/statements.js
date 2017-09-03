'use strict';

const assert = require('chai').assert;
const req = require('../../req.xapi');
const config = require('../config.lrs');

req.xapi.LRS = config.lrs;
req.xapi.AUTH = 'Basic ' + req.xapi.toBase64(config.auth);
req.xapi.VERSION = config.version;

const registration = req.xapi.uuid();
const batchLength = 10;
const queryLimit = 2;
const expectedSteps = batchLength/queryLimit + 1; // n resonses(more !== null) + 1 response(more === null)

let now;
let retrieved; //array of statement.ids

//TODO test xapi legacy

const createStatements = (length) => {
    const smts = [];
    for (let i = 0; i < length; i++) {
        smts.push({
            actor: {
                mbox: 'mailto:anonymous@xreq.com'
            },
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/attempted'
            },
            object: {
                id: 'http://xreq.com/activities/lrs-check/' + i
            },
            context: {
                registration: registration
            }
        });
    }
    return smts;
};

describe('req.xapi basic connectivity', function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(0);

    let result;

    before(function(done) {
        req.xapi(
            '/about',
            {
                method: 'GET',
                always: function(res, ins) {
                    result = res;
                    setTimeout(done, 500);
                }
            }
        );
    });

    // make sure the test is valid
    it('GET /about: makes sure the LRS is present', function(done) {
        assert.strictEqual(result.status, 200, 'response status: 200');
        done();
    });

});

describe('req.xapi POST many statements', function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(0);

    let result;
    now = new Date();

    const statements = createStatements(batchLength);

    before(function(done) {
        req.xapi(
            '/statements',
            {
                method: 'POST',
                data: statements,
                always: function(res, ins) {
                    result = res;
                    ////
                    // set statement ids
                    ////
                    retrieved = res.data;
                    setTimeout(done, 500);
                }
            }
        );
    });

    it('POST /statements: write ' + batchLength + ' statements to LRS', function(done) {
        assert.strictEqual(result.status, 200, 'response status: 200');
        assert.strictEqual(Object.prototype.toString.call(result.data), '[object Array]', 'is an array');
        assert.strictEqual(result.data.length, batchLength, 'has ' + batchLength + ' elements');
        done();
    });

});

describe('req.xapi.statements get many with limit', function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(0);

    let result;
    let count = 0;

    before(function(done) {
        req.xapi.statements(
            {
                query: {
                    since: now.toISOString(),
                    limit: queryLimit,
                    registration: registration
                },
                success: function(res, ins) {
                    result = res;
                    setTimeout(done, 500);
                },
                error: function(res, ins) {
                    result = res;
                    setTimeout(done, 500);
                },
                always: function(result) {
                    count++;
                }
            }
        );
    });

    it('retrieved all ' + batchLength + ' stored statements from LRS', function(done) {
        assert.strictEqual(result.status, 200, 'response status: 200');
        assert.strictEqual(Object.prototype.toString.call(result.data.statements), '[object Array]', 'is an array');
        assert.strictEqual(result.data.statements.length, batchLength, 'has ' + batchLength + ' elements');
        assert.strictEqual(count, expectedSteps, 'aggregted in ' + expectedSteps + ' steps');

        const ids = result.data.statements.map((smt) => {
            return smt.id;
        });
        assert.deepEqual(ids.reverse(), retrieved, 'statementIds are returned in reversed order');
        done();
    });

});
