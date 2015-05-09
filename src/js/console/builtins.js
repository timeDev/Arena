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
    _ = require('lodash'),
    engine = require('./engine'),
    command = require('./command');


engine.registerCommand('echo', function (args) {
    if (args.length < 1) {
        engine.env.error("Syntax: echo <str> [args]");
    }
    var str = args[0];
    if (_.isString(str)) {
        str = str.replace(/\{(\d+)}/g, function (match, number) {
            return args[number + 1] !== undefined ? args[number + 1] : match;
        });
    }
    this.log(str);
    return str;
});

command("value [-s --silent|-v --verbose] <arg>", {
    mandatory: [{name: 'value', type: '*'}],
    flags: [{short: 's', long: 'silent', name: 'silent'},
        {short: 'v', long: 'verbose', name: 'verbose'}]
}, 'value', function (match) {
    var value = match.value;
    if (!match.silent || match.verbose) {
        this.log(value);
    }
    return value;
});

command("throw <value>", {
    mandatory: [{name: 'value', type: '*'}]
}, 'throw', function (match) {
    throw match.value;
});

command("json <str> [reviver]", {
    mandatory: [{name: 'str', type: 'string'}],
    optional: [{name: 'reviver', type: 'func'}]
}, 'json', function (match) {
    return JSON.parse(match.str, function (key, value) {
        return engine.executeFunction(match.reviver, [key, value], engine.env);
    });
});

engine.registerCommand('array', function (args) {
    return args;
    // Like, literally
});

engine.registerCommand('true', function () {
    return true;
});

engine.registerCommand('false', function () {
    return false;
});

engine.registerCommand('null', function () {
    return null;
});

engine.registerCommand('undefined', function () {
    return undefined;
});

command("cvar create|delete|list|handle", [
    {
        mandatory: [{
            name: 'mode', type: 'value', value: 'create'
        }, {
            name: 'name', type: 'string'
        }],
        flags: [{
            name: 'value', value: true, short: 'v', long: 'set-value'
        }, {
            name: 'handler', value: true, short: 'h', long: 'set-handler'
        }]
    },
    {
        mandatory: [{
            name: 'mode', type: 'value', value: 'delete'
        }, {
            name: 'name', type: 'string'
        }],
        flags: [{
            name: 'noget', short: 'G', long: 'no-get'
        }]
    },
    {
        mandatory: [{
            name: 'mode', type: 'value', value: 'list'
        }],
        flags: [{
            name: 'silent', short: 's', long: 'silent'
        }, {
            name: 'verbose', short: 'v', long: 'verbose'
        }]
    },
    {
        mandatory: [{
            name: 'mode', type: 'value', value: 'handle'
        }, {
            name: 'name', type: 'string'
        }, {
            name: 'getter', type: 'func'
        }, {
            name: 'setter', type: 'func'
        }]
    }
], 'cvar', function (match) {
    if (match.matchI === 0) {
        // create mode
        var value = _.has(match, 'value') ? match.value : null;
        var handlerFn = match.handler;
        if (handlerFn) {
            var env = engine.env;
            var handler = function () {
                engine.executeFunction(handlerFn, arguments, env);
            };
            engine.registerGetSet(match.name, handler, handler);
            handler(value);
        } else {
            engine.registerCvar(match.name, {value: value}, 'value');
        }
    } else if (match.matchI === 1) {
        // delete mode
        var retval = undefined;
        if (!match.noget) {
            retval = engine.getCvar(match.name);
        }
        engine.unregister(match.name);
        return retval;
    } else if (match.matchI === 2) {
        // list mode
        var list = [];
        var reg = engine.getRegistry();
        _.forOwn(reg, function (value, key) {
            if (value.type == 'cvar') {
                list.push({key: key, value: value.getter()});
            }
        });
        if (!match.silent || match.verbose) {
            _.forEach(list, function (obj) {
                this.log(obj.key + " ", obj.value);
            })
        }
        return list;
    } else if (match.matchI === 3) {
        // handle mode
        var prevVal = engine.isRegistered(match.name) ? engine.getCvar(match.name) : undefined;
        // Avoid name collision
        var env1 = engine.env;
        var getter = function () {
            return engine.executeFunction(match.getter, [], env1);
        };
        var setter = function (value) {
            return engine.executeFunction(match.setter, [value], env1);
        };
        engine.registerGetSet(match.name, getter, setter);
        if (prevVal !== undefined) {
            setter(prevVal);
        }
    }
});

command("exec <name>", {mandatory: [{name: 'name', type: 'string'}]}, 'exec', function (match) {
    var name = match.name;
    var cmd = window.localStorage.getItem(name);
    if (cmd === null) {
        this.error("Storage item not found: " + name);
    }
    engine.executeString(cmd, this);
});

module.exports.registered = true;
