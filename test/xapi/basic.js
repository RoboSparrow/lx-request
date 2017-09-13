'use strict';

const assert = require('chai').assert;
const req = require('../../req.xapi');
const config = require('../config.lrs');

const beforeSpec = function(done) {
    req.xapi.LRS = config.lrs;
    req.xapi.AUTH = 'Basic ' + req.xapi.toBase64(config.auth);
    req.xapi.VERSION = config.version;
    req.xapi.LEGACY = false;
    done();
};

describe('xapi basic' , function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(0);

    const registration = req.xapi.uuid();
    let retrieved = []; //array of statement.ids
    let created = 0;

    const createStatement = () => {
        const smt = {
            actor: {
                mbox: 'mailto:anonymous@xreq.com'
            },
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/attempted'
            },
            object: {
                id: 'http://xreq.com/activities/lrs-check'
            },
            context: {
                registration: registration
            }
        };
        created += 1;
        return smt;
    };

    before(beforeSpec);

    describe('req.xapi basic connectivity', function() {

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
            setTimeout(done, 500);
        });

    });

    describe('req.xapi POST statements', function() {
        // eslint-disable-next-line no-invalid-this
        this.timeout(0);

        let result;

        before(function(done) {
            req.xapi(
                '/statements',
                {
                    method: 'POST',
                    data: createStatement(),
                    always: function(res, ins) {
                        result = res;
                        ////
                        // set statement ids
                        ////
                        retrieved = retrieved.concat(res.data);
                        setTimeout(done, 500);
                    }
                }
            );
        });

        it('POST /statements: write 1 statement to LRS', function(done) {
            assert.strictEqual(result.status, 200, 'response status: 200');
            assert.strictEqual(Object.prototype.toString.call(result.data), '[object Array]', 'is an array');
            assert.strictEqual(result.data.length, 1, 'has 1 element');
            setTimeout(done, 500);
        });

    });

    describe('req.xapi POST array of statements', function() {
        // eslint-disable-next-line no-invalid-this
        this.timeout(0);

        let result;

        before(function(done) {
            req.xapi(
                '/statements',
                {
                    method: 'POST',
                    data: [
                        createStatement(),
                        createStatement()
                    ],
                    always: function(res, ins) {
                        result = res;
                        ////
                        // set statement ids
                        ////
                        retrieved = retrieved.concat(res.data);
                        setTimeout(done, 500);
                    }
                }
            );
        });

        it('POST /statements: write 1 statement to LRS', function(done) {
            assert.strictEqual(result.status, 200, 'response status: 200');
            assert.strictEqual(Object.prototype.toString.call(result.data), '[object Array]', 'is an array');
            assert.strictEqual(result.data.length, 2, 'has 1 element');
            setTimeout(done, 500);
        });

    });

    describe('req.xapi PUT statements', function() {
        // eslint-disable-next-line no-invalid-this
        this.timeout(0);

        let result;

        before(function(done) {
            req.xapi(
                '/statements',
                {
                    method: 'PUT',
                    data: createStatement(),
                    query: {
                        statementId: req.xapi.uuid()
                    },
                    always: function(res, ins) {
                        result = res;
                        setTimeout(done, 500);
                    }
                }
            );
        });

        it('PUT /statements: write 1 statement to LRS', function(done) {
            assert.strictEqual(result.status, 204, 'response status: 204');
            setTimeout(done, 500);
        });

    });

    describe('req.xapi GET statements', function() {
        // eslint-disable-next-line no-invalid-this
        this.timeout(0);

        let result;

        before(function(done) {
            req.xapi.statements(
                {
                    query: {
                        registration: registration
                    },
                    always: function(res, ins) {
                        result = res;
                        setTimeout(done, 500);
                    }
                }
            );
        });

        it('retrieved all ' + created + ' stored statements from LRS', function(done) {
            assert.strictEqual(result.status, 200, 'response status: 200');
            assert.strictEqual(Object.prototype.toString.call(result.data.statements), '[object Array]', 'is an array');
            assert.strictEqual(result.data.statements.length, created, 'has ' + created + ' elements');
            setTimeout(done, 500);
        });

    });

});
