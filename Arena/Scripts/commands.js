define(['console'], function (console) {
    'use strict';
    var module,
        // Function
        validate;

    validate = function (expected, args) {
        /// <param name="expected" type="Array" elementType="String"></param>
        /// <param name="args" type="Array"></param>
        var result = true;
        if (args.length !== expected.length + 1) {
            console.warn("Mismatched arguments! Expected {0}, got {1}", expected.length, args.length - 1);
            return false;
        }
        for (var i = 0; i < expected.length; i++) {
            if (typeof args[i + 1] !== expected[i]) {
                console.warn("Mismatched argument types! [{0}] Expected {1}, got {2}", i + 1, expected[i], typeof args[i + 1]);
                result = false;
            }
        }
        return result;
    };

    module = {
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

    return module;
});