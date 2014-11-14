// Object class Loader
define([], function () {
    'use strict';
    var classes = {},
        // Functions
        define, load, reviver, suspend, resume, run;

    define = function (name, fun) {
        classes[name] = fun;
    };

    load = function (str, cb) {
        var value, callback = function () {
            callback.i--;
            if (value !== undefined && callback.i <= 0) {
                if (cb) { cb(value); }
            }
        };
        callback.i = 0;
        value = JSON.parse(str, function (k, v) { return reviver(k, v, callback); });
        return value;
    };

    reviver = function (key, value, cb) {
        var result = {};
        if (typeof value !== 'object') { return value; }
        if (value.class === undefined) { return value; }
        if (!Array.isArray(value.class)) { value.class = [value.class]; }

        result.ocl = {
            key: key,
            value: value,
            classes: value.class,
            i: 0,
            suspended: false,
            suspend: suspend,
            resume: resume,
            run: function () { run(result); },
            done: cb
        };

        cb.i++;

        result.ocl.run();

        return result;
    };

    run = function (obj) {
        var params, cl;
        for (; obj.ocl.i < obj.ocl.classes.length && !obj.ocl.suspended; obj.ocl.i++) {
            cl = obj.ocl.classes[obj.ocl.i];
            params = obj.ocl.value[cl] === undefined ? [] : Array.isArray(obj.ocl.value[cl]) ? obj.ocl.value[cl] : [obj.ocl.value[cl]];
            classes[cl].apply(obj, params);
        }
        obj.ocl.done();
    };

    suspend = function () {
        this.suspended = true;
    };

    resume = function () {
        this.suspended = false;
        this.run();
    };

    return {
        /// <summary>The reviver function used by ocl. Needs to be wrapped to provide callback.</summary>
        reviver: reviver,

        /// <summary>Defines a class.</summary>
        /// <param name="name" type="String">The name of the class.</param>
        /// <param name="fun" type="Function">The class function.</param>
        define: define,

        /// <summary>Loads an object or array from a JSON string.</summary>
        /// <param name="str" type="String">A JSON string.</param>
        /// <param name="cb" type="Function">A callback function for the result.</param>
        /// <returns type="Object">The parsed value.</returns>
        load: load
    };
});