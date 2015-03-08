/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Oskar Homburg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/*global require, module, exports */
var
// Module
    parser = require('./parser'),
    executor = require('./executor'),
// Local
    registry = {};

executor.commandEngine = exports;

exports.env = null;

exports.executeString = function (cmdstring, env, ctx) {
    exports.env = env;
    var retval = executor.execute(parser.parse(cmdstring), ctx);
    exports.env = null;
    return retval;
};

exports.executeFunction = function (fn, args, env) {
    var ctx = {};
    if (Array.isArray(args)) {
        ctx['arguments'] = args;
        if (args.length > 0) {
            ctx['$'] = args[0];
            for (var i = 1; i < args.length; i++) {
                ctx[i] = args[i];
            }
        }
    } else {
        ctx = args;
    }
    var envRestore = exports.env;
    exports.env = env;
    var retval = executor.execute(fn.body, ctx);
    exports.env = envRestore;
    return retval;
};

exports.executeCommand = function (name, args) {
    var cmd = registry[name];
    if (!cmd) {
        throw "Command '" + name + "' could not be found.";
    }
    if (cmd.type === 'function') {
        return cmd.handler.call(null, args);
    } else if (cmd.type === 'cvar') {
        if (args.length > 0) {
            return cmd.setter(args[0]);
        } else {
            return cmd.getter();
        }
    } else {
        // How did you get here??
        debugger;
        throw "Unknown command type in command registry";
    }
};

exports.registerCommand = function (name, handler) {
    if (registry[name]) {
        // warn("Command '" + name + "' already exists. Overriding.");
    }
    registry[name] = {type: 'function', handler: handler};
};

exports.registerCvar = function (name, object, key) {
    exports.registerGetSet(name, function () {
        return object[key];
    }, function (value) {
        object[key] = value;
    })
};

exports.registerGetSet = function (name, getter, setter) {
    if (registry[name]) {
        // warn("Command '" + name + "' already exists. Overriding.");
    }
    if (setter === undefined) {
        setter = getter;
    }
    registry[name] = {type: 'cvar', getter: getter, setter: setter};
};

exports.registerAlias = function (name, fn) {
    exports.registerCommand(name, function (args) {
        exports.executeFunction(fn, args);
    });
};

exports.getCvar = function (name) {
    return registry[name].getter();
};

exports.setCvar = function (name, value) {
    registry[name].setter(value);
};

exports.isRegistered = function (name) {
    return registry.hasOwnProperty(name);
};

function toValueString(obj) {
    if (typeof obj === 'string') {
        return '"' + obj + '"';
    }
    if (typeof obj === 'number') {
        // toString might give us exponential form, which we dont support
        // toPrecision might too, but it's less likely.
        return obj.toPrecision(21);
    }
    if (typeof obj === 'undefined') {
        return "[undefined]";
    }
    if (obj === null) {
        return "[null]";
    }
    if (obj === true) {
        return '[true]';
    }
    if (obj === false) {
        return '[false]';
    }
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return '[array ' + obj.map(toValueString).join(" ") + ']';
        }
        // Resort to json command
        return '[json "' + JSON.stringify(obj) + '"]';
    }
    // This should not happen, so debug if it does
    debugger;
    throw 'Unknown type';
}

exports.getCfgString = function () {
    var str = "";
    for (var k in registry) {
        if (registry.hasOwnProperty(k) && registry[k].type == 'cvar') {
            str += k + " " + toValueString(registry[k].getter()) + ";";
        }
    }
    return str;
};

// Low level access
exports.unregister = function (name) {
    delete registry[name];
};

exports.getBinding = function (name) {
    return registry[name];
};

exports.getRegistry = function () {
    return registry;
};
