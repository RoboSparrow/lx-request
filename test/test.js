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

    it('should re.request', function(done) {
        req.request(url + '/200.html', {
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                done();
            }
        });
    });
});
