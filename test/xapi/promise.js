'use strict';

const assert = require('assert');
const req = require('../../req.xapi');
const config = require('../config.lrs');

const beforeSpec = function(done) {
    req.xapi.LRS = config.lrs;
    req.xapi.AUTH = 'Basic ' + req.xapi.toBase64(config.auth);
    req.xapi.VERSION = config.version;
    req.xapi.LEGACY = false;
    done();
};

describe('req.xapi promise', function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(0);

    before(beforeSpec);

    const createStatements = (length, registration) => {
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

    before(beforeSpec);

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
        ;
    });

});
