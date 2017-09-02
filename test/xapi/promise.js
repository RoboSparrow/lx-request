'use strict';

const assert = require('assert');
const req = require('../../req.xapi');
const config = require('../config.lrs');

req.xapi.LRS = config.lrs;
req.xapi.AUTH = 'Basic ' + req.xapi.toBase64(config.auth);
req.xapi.VERSION = config.version;

//TODO test xapi legacy

var createStatements = (length, registration) => {
    const smts = [];
    for (let i = 0; i < length; i++) {
        smts.push({
            actor: {
                mbox: 'mailto:anonymous@lxhive.com'
            },
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/attempted'
            },
            object: {
                id: 'http://lxhive.com/activities/lrs-check/' + i
            },
            context: {
                registration: registration
            }
        });
    }
    return smts;
};

describe('req.xapi promise', function() {

    it('request should return an instance of Promise', function() {
        const ref = Object.prototype.toString.call(Promise.resolve());
        const ins = req.xapi('/statements', {
            query: {
                limit: 1
            },
            promise: true
        });
        assert.strictEqual(Object.prototype.toString.call(ins), ref);
    });

    it('should make a simple promise request, success', function() {
        return req.xapi('/statements', {
            query: {
                limit: 1
            },
            promise: true
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200);
            assert.strictEqual(typeof (result.data.statements), 'object');
        })
        .catch(function(result) {
            console.log('CATCH ERROR: ', result);
            assert.strictEqual(true, false);
        })
        ;
    });
});

describe('req.xapi promise POST many statements', function() {
    const batchLength = 10;
    const queryLimit = 2;
    const expectedSteps = batchLength/queryLimit;

    const registration = req.xapi.uuid();
    const now = new Date();

    let retrieved;
    let count = 0;

    it('POST /statements: write ' + batchLength + ' statements to LRS', function() {
        // eslint-disable-next-line no-invalid-this
        this.timeout(0);

        return req.xapi('/statements', {
            method: 'POST',
            data: createStatements(batchLength, registration),
            promise: true
        })
        .then(function(result) {
            retrieved = result.data;
            assert.strictEqual(result.status, 200, 'response status: 200');
            assert.strictEqual(result.data.length, batchLength, 'has ' + batchLength + ' elements');
            return req.xapi.statements({
                promise: true,
                query: {
                    since: now.toISOString(),
                    limit: queryLimit,
                    registration: registration
                },
                always: function(result) {
                    count++;
                }
            });
        })
        .then(function(result) {
            assert.strictEqual(result.status, 200, 'response status: 200');
            assert.strictEqual(Object.prototype.toString.call(result.data.statements), '[object Array]', 'is an array');
            assert.strictEqual(result.data.statements.length, batchLength, 'has ' + batchLength + ' elements');
            assert.strictEqual(count, expectedSteps, 'aggregted in ' + expectedSteps + ' steps');
        })
        .catch(function(result) {
            console.log('CATCH ERROR: ', result);
            assert.strictEqual(true, false);
        })
        ;
    });

    // TODO
    // describe('acy xapi legpromise', function() {
    //     before(function() {
    //         req.xapi.LEGACY = true;
    //     });
    //
    //     after(function() {
    //         req.xapi.LEGACY = false;
    //     });
    //
    //     const registration = req.xapi.uuid();
    //
    //     it('should make a simple promise request, success', function() {
    //         return req.xapi('/statements', {
    //             method: 'PUT',
    //             query: {
    //                 statementId: req.xapi.uuid()
    //             }
    //             data: createStatements(1, registration)[0],
    //             promise: true
    //         })
    //         .then(function(result) {
    //             assert.strictEqual(result.status, 200);
    //             assert.strictEqual(typeof (result.data.statements), 'object');
    //         })
    //         .catch(function(result) {
    //             console.log('CATCH ERROR: ', result);
    //             assert.strictEqual(true, false);
    //         })
    //         ;
    //     });
    // });
});
