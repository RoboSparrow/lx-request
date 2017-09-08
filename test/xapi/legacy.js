'use strict';

const assert = require('chai').assert;
const req = require('../../req.xapi');
const server = require('../helper.server');

req.xapi.LRS = 'http://localhost:8000/xapi';
req.xapi.AUTH = 'Basic ' + req.xapi.toBase64('test:test');
req.xapi.VERSION = '1.0.2';
req.xapi.LEGACY = true;

const beforeTest = function() {
    server.listen(8000);
};

const afterTest =function() {
    server.close();
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

    it('should create a server', function(done) {
        var http = require('http');
        http.get('http://localhost:8000/xapi/statements', function(res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    it('GET /statements: transforms headers and method to POST', function(done) {
        req.xapi(
            '/statements',
            {
                method: 'GET',
                transformRequest: function(config) {
                    assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded', 'request method was transformed to POST');
                    assert.strictEqual(config.method, 'POST', 'request method was transformed to POST');
                    assert.strictEqual(config.query.method, 'GET', 'initial request method attached as query param `method`');
                },
                always: function(res, ins) {
                    assert.strictEqual(res.status, 200, 'response status: 200');
                    done();
                }
            }
        );

    });

    it('GET /statements: returns JSON & attaches xapi headers to POST body', function(done) {
        req.xapi(
            '/statements',
            {
                method: 'GET',
                always: function(res, ins) {
                    // helper server returns body as received (encoded as JSON)
                    // below assertions imply parsed JSON body who was sucessfuy parsed
                    assert.strictEqual(res.data['Content-Type'], 'application/json', 'body hast prop "Content-Type":"application/json"');
                    assert.strictEqual(res.data['X-Experience-API-Version'], req.xapi.VERSION, 'body hast prop "X-Experience-API-Version"');
                    assert.strictEqual(typeof res.data['Authorization'], 'string', 'body hast prop "Authorization"');
                    done();
                }
            }
        );

    });

    it('PUT /statements: query params other than "method" are attached to body and content ', function(done) {

        const data = {test: 'test'};
        const id = req.xapi.uuid();
        req.xapi(
            '/statements',
            {
                method: 'PUT',
                data: data,
                query: {
                    statementId: id
                },
                always: function(res, ins) {
                    // helper server returns body as received (encoded as JSON)
                    assert.strictEqual(res.data.statementId, id, 'attaches query param to json body');
                    assert.strictEqual(typeof(res.data.content), 'object', 'body has a param "content"');
                    assert.strictEqual(JSON.stringify(res.data.content), JSON.stringify(data), 'body.conent contains payload data');
                    done();
                }
            }
        );

    });

});
