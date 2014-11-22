/*global require, module, exports */
var console = require('./console');

exports.validate = function (expected, args) {
    var i, result = true;
    if (args.length !== expected.length + 1) {
        console.warn("Mismatched arguments! Expected {0}, got {1}", expected.length, args.length - 1);
        return false;
    }
    for (i = 0; i < expected.length; i++) {
        if (expected[i] === 'number') {
            var val = args[i + 1];
            if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
                val = parseFloat(val);
            }
            args[i + 1] = val;
        }
        if (typeof args[i + 1] !== expected[i]) {
            console.warn("Mismatched argument types! [{0}] Expected {1}, got {2}", i + 1, expected[i], typeof args[i + 1]);
            result = false;
        }
    }
    return result;
};

exports.register = function (list) {
    for (var key in list) {
        if (list.hasOwnProperty(key)) {
            console.registerFunc(key, list[key]);
        }
    }
};