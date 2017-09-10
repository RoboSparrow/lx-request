'use strict';

const assert = require('chai').assert;
const req = require('../../req.xapi');
const config = require('../config.lrs');

req.xapi.LRS = config.lrs;
req.xapi.AUTH = 'Basic ' + req.xapi.toBase64(config.auth);
req.xapi.VERSION = config.version;

const beforeTest = function() {
    req.xapi.LEGACY = true;
};

const afterTest =function() {
    req.xapi.LEGACY = false;
};


const registration = req.xapi.uuid();
let statementIds = []; //array of statement.ids

//TODO test xapi legacy

let created = 0;

const createStatement = (activitySuffix, id) => {
    id = id || null;
    const smt = {
        actor: {
            mbox: 'mailto:anonymous@xreq.com'
        },
        verb: {
            id: 'http://adlnet.gov/expapi/verbs/attempted'
        },
        object: {
            id: 'http://xreq.com/activities/lrs-check/legacy/' + activitySuffix
        },
        context: {
            registration: registration
        }
    };

    if(id) {
        smt.id = id;
    }
    created += 1;
    return smt;
};

//
// @see https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#appendix-c-cross-domain-request-example
//
// URL: http://example.com/xAPI/statements?method=PUT&statementId=c70c2b85-c294-464f-baca-cebd4fb9b348
// Method: POST
//
// Request Headers:
//     Accept:*/*
//     Accept-Encoding:gzip, deflate, sdch
//     Accept-Language:en-US,en;q=0.8
//     Content-Type: application/x-www-form-urlencoded
//     Content-Length: 745
//
// Content (with added line breaks and not URL encoded for readability):
//     statementId=c70c2b85-c294-464f-baca-cebd4fb9b348
//     &Authorization=Basic VGVzdFVzZXI6cGFzc3dvcmQ=
//     &X-Experience-API-Version=1.0.3
//     &Content-Type=application/json
//     &Content-Length=351
//     &content={"id":"c70c2b85-c294-464f-baca-cebd4fb9b348","timestamp":"2014-12-29T12:09:37.468Z","actor":{"objectType":"Agent","mbox":"mailto:example@example.com","name":"Test User"},"verb":{"id":"http://adlnet.gov/expapi/verbs/experienced","display":{"en-US":"experienced"}},"object":{"id":"http://example.com/xAPI/activities/myactivity","objectType":"Activity"}}
//
// * All xAPI requests issued MUST be POST.
// * The intended xAPI method MUST be included as the value of the "method" query string parameter.
// * The Learning Record Provider MUST NOT include any other query string parameters on the request.
// * Any query string parameters other than "method" MUST instead be included as a form parameter with the same name.
// * The LRS MUST treat any form parameters other than "content" or the header parameters listed above as query string parameters.
// * If the xAPI call involved sending content, the Learning Record Provider MUST URL encode that content and include it as a form parameter called "content".
// * The LRS MUST interpret this content as a UTF-8 string. Storing binary data is not supported with this syntax.
//
// @see https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#cors
// @see https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#alt-request-syntax
// @see https://blogs.msdn.microsoft.com/ieinternals/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds/
//

describe('req.xapi cross domain mode', function() {

    before(beforeTest);
    after(afterTest);

    it('PUT /statements: legacy', function(done) {

        const id = req.xapi.uuid();
        statementIds.push(id);
        const statement = createStatement('put');

        req.xapi(
            '/statements',
            {
                method: 'PUT',
                data: statement,
                query: {
                    statementId: id
                },
                transformRequest: function(config) {
                    assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded', 'request method was transformed to POST');
                    assert.strictEqual(config.method, 'POST', 'request method was transformed to POST');
                    assert.strictEqual(config.data.statementId, id, 'attaches query param to data body');
                    assert.strictEqual(config.data.content, JSON.stringify(statement), 'attaches statement to body.content');
                    assert.strictEqual(config.query.method, 'PUT', 'initial request method attached as query param `method`');
                },
                always: function(res, ins) {
                    assert.strictEqual(res.status, 204, 'response status: 204');
                    assert.strictEqual(res.data, '', 'body of a PUT call is empty');
                    done();
                }
            }
        );

    });

    it('POST /statements: legacy', function(done) {

        const id = req.xapi.uuid();
        statementIds.push(id);
        const statement = createStatement('post', id);

        req.xapi(
            '/statements',
            {
                method: 'POST',
                data: statement,
                transformRequest: function(config) {
                    assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded', 'request method was transformed to POST');
                    assert.strictEqual(config.method, 'POST', 'request method was transformed to POST');
                    assert.strictEqual(config.data.content, JSON.stringify(statement), 'attaches statement to body.content');
                    assert.strictEqual(config.query.method, 'POST', 'initial request method attached as query param `method`');
                },
                always: function(res, ins) {
                    assert.strictEqual(res.status, 200, 'response status: 200');
                    assert.strictEqual(Object.prototype.toString.call(res.data), '[object Array]', 'is an array');
                    assert.strictEqual(res.data.length, 1, 'has 1 element');
                    assert.strictEqual(res.data[0], id, 'returns submitted statementId');
                    done();
                }
            }
        );

    });

    it('GET /statements: legacy', function(done) {

        req.xapi(
            '/statements',
            {
                method: 'GET',
                query: {
                    registration: registration,
                    ascending: true
                },
                transformRequest: function(config) {
                    assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded', 'request method was transformed to POST');
                    assert.strictEqual(config.method, 'POST', 'request method was transformed to POST');
                    assert.strictEqual(config.data.registration, registration, 'attaches query param 1 to data body');
                    assert.strictEqual(config.data.ascending, true, 'attaches query param 2 to data body');
                    assert.strictEqual(config.query.method, 'GET', 'initial request method attached as query param `method`');
                },
                always: function(res, ins) {
                    assert.strictEqual(res.status, 200, 'response status: 200');
                    assert.strictEqual(Object.prototype.toString.call(res.data), '[object Object]', 'is an object');
                    assert.strictEqual(Object.prototype.toString.call(res.data.statements), '[object Array]', 'is an array');
                    assert.strictEqual(res.data.statements[0].id, statementIds[0], 'first statement has id ' + statementIds[0]);
                    assert.strictEqual(res.data.statements[1].id, statementIds[1], 'first statement has id ' + statementIds[1]);
                    done();
                }
            }
        );

    });

});
