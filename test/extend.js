'use strict';

const assert = require('assert');

const req = require('../req');

describe('Config', function() {

    it('should ignore undefined properties', function() {
        const defaults = {
            udef: undefined
        };

        const config = {
            valid: 1
        };

        const merged = req.extend(config, defaults);
        assert.strictEqual('udef' in merged, false, 'did not merge properties with value === undefined');
    });

    it('should merge scalar properties', function() {
        const defaults = {
            valid: 1
        };

        const config = {
            num: 1,
            nil: null,
            bool: true,
            str: 'string'
        };

        const m = req.extend(defaults, config);
        assert.strictEqual(m.valid, 1);
        assert.strictEqual(m.num, 1);
        assert.strictEqual(m.nil, null);
        assert.strictEqual(m.bool, true);
        assert.strictEqual(m.str, 'string');
    });

    it('should overwrite scalar src properties', function() {
        const defaults = {
            num: 2,
            nil: null,
            bool: false,
            str: 'another string'
        };

        const config = {
            num: 1,
            nil: null,
            bool: true,
            str: 'string'
        };

        const m = req.extend(defaults, config);
        assert.strictEqual(m.num, 1);
        assert.strictEqual(m.nil, null);
        assert.strictEqual(m.bool, true);
        assert.strictEqual(m.str, 'string');
    });

    it('by default objects and arrays are NOT deeply merged', function() {
        const defaults = {
            arr: ['defaults'],
            obj: {
                val: 'defaults'
            }
        };

        const config = {
            arr: ['config'],
            obj: {
                val: 'config'
            }
        };

        const m = req.extend(defaults, config);
        assert.deepStrictEqual(m.arr, ['config']);
        assert.deepStrictEqual(m.obj, {val:'config'});
    });

    it('the first argument can be a boolean flag (deep merge)', function() {
        const defaults = {
            val: 'defaults'
        };

        const config = {
            val: 'config'
        };

        const m = req.extend(false, defaults, config);
        assert.strictEqual(m.val, 'config');
    });

    it('deep merge: arrays', function() {
        const defaults = {
            arr: ['defaults', 'val']
        };

        const config = {
            arr: ['config']
        };

        const m = req.extend(true, defaults, config);
        assert.deepStrictEqual(m.arr, ['config', 'val']);
    });

    it('deep merge: arrays merge uniquely', function() {
        const defaults = {
            arr: ['defaults']
        };

        const config = {
            arr: ['defaults', 'config']
        };

        const m = req.extend(true, defaults, config);
        assert.deepStrictEqual(m.arr, ['defaults', 'config']);
    });

    // superfluous, however important to point this out explicitly
    it('deep merge: objects are replaced if the src property was declared but not an object', function() {
        const defaults = {
            first: {
                second: null
            },
            second: undefined
        };

        const config = {
            first: {
                second: {
                    val: 'config'
                },
                newProp: 'new'
            },
            second: {
                val :'new'
            }
        };

        const m = req.extend(true, defaults, config);
        assert.deepStrictEqual(Object.keys(m), ['first', 'second']);
        assert.deepStrictEqual(Object.keys(m.first), ['second', 'newProp']);
        assert.strictEqual(m.first.second.val, 'config');
        assert.strictEqual(m.first.newProp, 'new');
        assert.strictEqual(m.second.val, 'new');
    });

    it('deep merge: objects deep merge', function() {
        const defaults = {
            first: {
                second: {
                    third: 'defaults'
                }
            }
        };

        const config = {
            first: {
                second: {
                    val: 'config'
                },
                newProp: 'new'
            },
            second: {
                val :'new'
            }
        };

        const m = req.extend(true, defaults, config);
        assert.deepStrictEqual(Object.keys(m), ['first', 'second']);
        assert.deepStrictEqual(Object.keys(m.first), ['second', 'newProp']);
        assert.strictEqual(m.first.second.val, 'config');
        assert.strictEqual(m.first.newProp, 'new');
        assert.strictEqual(m.second.val, 'new');
    });

    it('deep merge: MANY arrays deep merge', function() {
        const defaults = {
            first: {
                second: {
                    third: 'defaults'
                }
            }
        };

        const config = {
            first: {
                second: {
                    val: 'config'
                },
                newProp: 'new'
            },
            second: {
                val :'new'
            }
        };

        const secondConfig = {
            first: {
                second: {
                    val: 'secondConfig'
                },
                // newProp: 'secondNew', commented out and left!
                secondNewProp: 'secondNew'
            },
            second: {
                val :'secondNew'
            },
            third: {
                val :'new'
            }
        };

        const m = req.extend(true, defaults, config, secondConfig);
        assert.deepStrictEqual(Object.keys(m), ['first', 'second', 'third']);
        assert.deepStrictEqual(Object.keys(m.first), ['second', 'newProp', 'secondNewProp']);
        assert.strictEqual(m.first.second.val, 'secondConfig');
        assert.strictEqual(m.first.newProp, 'new');
        assert.strictEqual(m.first.secondNewProp, 'secondNew');
        assert.strictEqual(m.second.val, 'secondNew');
        assert.strictEqual(m.third.val, 'new');
    });

    it('deep merge: MANY arrays deep merge', function() {
        const defaults = {
            arr: [1, 'defaults']
        };

        const config = {
            arr: [2, 'config', 3]
        };

        const secondConfig = {
            arr: [3, 'secondConfig']
        };

        const m = req.extend(true, defaults, config, secondConfig);
        assert.deepStrictEqual(m.arr, [3, 'secondConfig', 3]);
    });

});
