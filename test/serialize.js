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

describe('Default serialization', function() {

    const url = 'http://localhost:8000';
    const body = 'a string';

    before(beforeSpec);
    after(afterSpec);

    it('should create a server', function(done) {
        var http = require('http');
        http.get(url + '/200.html', function(res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    it('req.request(), default serializer is "application/x-www-form-urlencoded; charset=utf-8"', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=utf-8');
                assert.strictEqual(config.preset, '');
                assert.strictEqual(config.type, 'form'); //!!!
                assert.strictEqual(data,  encodeURI(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(decodeURI(result.data), body);
                done();
            }
        });
    });

});

describe('application/x-www-form-urlencoded', function() {

    const url = 'http://localhost:8000';
    const body = 'a string';

    before(beforeSpec);
    after(afterSpec);

    it('req.request(), header application/x-www-form-urlencoded', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.preset, '');
                assert.strictEqual(config.type, 'form');
                assert.strictEqual(data,  encodeURI(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(decodeURI(result.data), body);
                done();
            }
        });
    });

    it('req.request(), preset: form', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            preset: 'form',
            headers: {
                'Content-Type': 'text/plain' // overwrite
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=utf-8');
                assert.strictEqual(config.preset, 'form');
                assert.strictEqual(config.type, 'form');
                assert.strictEqual(data,  encodeURI(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(decodeURI(result.data), body);
                done();
            }
        });
    });

    it('req.form()', function(done) {
        req.form(url + '/200', {
            method: 'POST',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=utf-8');
                assert.strictEqual(config.preset, 'form');
                assert.strictEqual(config.type, 'form');
                assert.strictEqual(data,  encodeURI(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(decodeURI(result.data), body);
                done();
            }
        });
    });

});

describe('application/json', function() {

    const url = 'http://localhost:8000';
    const body = {
        value: 'a string'
    };

    before(beforeSpec);
    after(afterSpec);

    it('req.request(), header application/json', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.preset, '');
                assert.strictEqual(config.type, 'json');
                assert.strictEqual(data, JSON.stringify(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.deepStrictEqual(result.data, body);
                done();
            }
        });
    });

    it('req.request(), preset: json', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            preset: 'json',
            headers: {
                'Content-Type': 'text/plain' // overwrite
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'application/json; charset=utf-8');
                assert.strictEqual(config.preset, 'json');
                assert.strictEqual(config.type, 'json');
                assert.strictEqual(data, JSON.stringify(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.deepStrictEqual(result.data, body);
                done();
            }
        });
    });

    it('req.json()', function(done) {
        req.json(url + '/200', {
            method: 'POST',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'application/json; charset=utf-8');
                assert.strictEqual(config.preset, 'json');
                assert.strictEqual(config.type, 'json');
                assert.strictEqual(data, JSON.stringify(body));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.deepStrictEqual(result.data, body);
                done();
            }
        });
    });

});

describe('text/plain', function() {

    const url = 'http://localhost:8000';
    const body = 'a string';

    before(beforeSpec);
    after(afterSpec);

    it('req.request(), header text/plain', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.preset, '');
                assert.strictEqual(config.type, 'plain');
                assert.strictEqual(data, body);
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(result.data, body);
                done();
            }
        });
    });

    it('req.request(), preset: plain', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            preset: 'plain',
            headers: {
                'Content-Type': 'application/json' // overwrite
            },
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'text/plain; charset=utf-8');
                assert.strictEqual(config.preset, 'plain');
                assert.strictEqual(config.type, 'plain');
                assert.strictEqual(data, body);
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(result.data, body);
                done();
            }
        });
    });

    it('req.plain()', function(done) {
        req.plain(url + '/200', {
            method: 'POST',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], 'text/plain; charset=utf-8');
                assert.strictEqual(config.preset, 'plain');
                assert.strictEqual(config.type, 'plain');
                assert.strictEqual(data, body);
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.deepStrictEqual(result.data, body);
                done();
            }
        });
    });

});

describe('text/raw, a special mode without serialization', function() {

    const url = 'http://localhost:8000';
    const body = '[1, 2, 3]';

    before(beforeSpec);
    after(afterSpec);

    it('req.request(), preset: raw', function(done) {
        req.request(url + '/200', {
            method: 'POST',
            preset: 'raw',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], undefined);
                assert.strictEqual(config.preset, 'raw');
                assert.strictEqual(config.type, 'raw');
                assert.strictEqual(data, body);
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.strictEqual(result.data, body);
                done();
            }
        });
    });

    it('req.raw()', function(done) {
        req.raw(url + '/200', {
            method: 'POST',
            data: body,
            beforeSend: function(config, data) {
                assert.strictEqual(config.headers['Content-Type'], undefined);
                assert.strictEqual(config.preset, 'raw');
                assert.strictEqual(config.type, 'raw');
                assert.strictEqual(data, body);
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');
                assert.deepStrictEqual(result.data, body);
                done();
            }
        });
    });

});

describe('Custom serialize callback', function() {

    const url = 'http://localhost:8000';
    const body = ['an', 'array'];

    before(beforeSpec);
    after(afterSpec);

    it('req.post() allows replacing serialization with a custom "serialize" callback', function(done) {

        let triggered = false;
        let transformed = false;

        req.post(url + '/200', body, {

            serialize: function(data) {
                triggered = true;
                assert.deepStrictEqual(data, body);
                return body.toString();
            },
            beforeSend: function(config, data) {
                transformed = triggered; //should be true now
                assert.strictEqual(triggered, true);
                assert.strictEqual(data, body.toString());
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');

                assert.strictEqual(triggered, true);
                assert.strictEqual(transformed, true);
                assert.deepStrictEqual(result.data, body.toString());
                done();
            }
        });
    });

    it('req.json() presets also allow replacing serialization with a custom "serialize" callback', function(done) {

        let triggered = false;
        let transformed = false;

        const testBody = ['an', 'mutated', 'array'];

        req.json(url + '/200', {
            method: 'POST',
            data: body,
            serialize: function(data) {
                triggered = true;
                assert.deepStrictEqual(data, body);
                return JSON.stringify(testBody);
            },
            beforeSend: function(config, data) {
                transformed = triggered; //should be true now
                assert.strictEqual(triggered, true);
                assert.strictEqual(config.preset, 'json');
                assert.strictEqual(data, JSON.stringify(testBody));
            },
            always: function(result, response) {
                assert.strictEqual(result.status, 200);
                assert.strictEqual(result.headers['x-req-method'], 'POST');

                assert.strictEqual(triggered, true);
                assert.strictEqual(transformed, true);
                assert.deepStrictEqual(result.data, testBody);
                done();
            }
        });
    });
});
