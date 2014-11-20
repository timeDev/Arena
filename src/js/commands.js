/*global require, module, exports */
var console = require('./console');
var // Function
    validate;

validate = function (expected, args) {
    var i, result = true;
    if (args.length !== expected.length + 1) {
        console.warn("Mismatched arguments! Expected {0}, got {1}", expected.length, args.length - 1);
        return false;
    }
    for (i = 0; i < expected.length; i++) {
        if (typeof args[i + 1] !== expected[i]) {
            console.warn("Mismatched argument types! [{0}] Expected {1}, got {2}", i + 1, expected[i], typeof args[i + 1]);
            result = false;
        }
    }
    return result;
};

module.exports = {
    api: {
        validate: validate,
        register: function () {
            for (var key in module) {
                if (module.hasOwnProperty(key) && key !== 'api') {
                    console.registerFunc(key, module[key]);
                }
            }
        }
    }
};