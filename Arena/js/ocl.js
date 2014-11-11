// Object class Loader
define([], function () {
    'use strict';
    var classes = {},
        // Functions
        define, load, reviver;

    define = function (name, fun) {
        classes[name] = fun;
    };

    load = function (str) {
        return JSON.parse(str, reviver);
    };

    reviver = function (key, value) {
        var i, cl, params, result = {};
        if (typeof value !== 'object') { return value; }
        if (value.class === undefined) { return value; }
        if (!Array.isArray(value.class)) { value.class = [value.class]; }

        result.ocl = {};
        result.ocl.key = key;
        result.ocl.value = value;
        result.ocl.classes = value.class;

        for (i = 0; i < value.class.length; i++) {
            cl = value.class[i];
            params = value[cl] === undefined ? [] : Array.isArray(value[cl]) ? value[cl] : [value[cl]];
            classes[cl].apply(result, params);
        }

        return result;
    };

    return {
        reviver: reviver,

        define: define,

        load: load
    };
});