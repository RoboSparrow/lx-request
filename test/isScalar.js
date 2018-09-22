'use strict';

const assert = require('assert');

const { isScalar } =  require('../req');

describe('isScalar', function() {

    it('should accept scalar values', function() {
        assert.strictEqual(isScalar(0), true);
        assert.strictEqual(isScalar(42), true, 'Answer to the Ultimate Question of Life, the Universe, and Everything');
        assert.strictEqual(isScalar(Math.PI), true);
        assert.strictEqual(isScalar(Infinity), true);
        assert.strictEqual(isScalar(NaN), true);

        assert.strictEqual(isScalar(''), true);
        assert.strictEqual(isScalar('a'), true);
        assert.strictEqual(isScalar('0123'), true);
        assert.strictEqual(isScalar(42), true, 'Answer to the Ultimate Question of Life, the Universe, and Everything');
        assert.strictEqual(isScalar('{ "json": true }'), true);

        assert.strictEqual(isScalar(null), true);
        assert.strictEqual(isScalar(false), true);
        assert.strictEqual(isScalar(true), true);

    });

    it('should reject undefined values and not defined params', function() {
        assert.strictEqual(isScalar(undefined), false);
        assert.strictEqual(isScalar(), false);
    });

    it('should reject complex values', function() {
        assert.strictEqual(isScalar({}), false);
        assert.strictEqual(isScalar([]), false);
        assert.strictEqual(isScalar(Symbol()), false);
        assert.strictEqual(isScalar(Date), false);
        assert.strictEqual(isScalar(()=> 42), false);
    });

});
