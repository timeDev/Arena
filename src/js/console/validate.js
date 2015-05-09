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
var _ = require('lodash');

/** Validate the args according to syntax:
 altern: either syntax object or array of alternatives

 syntax.mandatory: array of mandatory positional arguments
 syntax.optional: array of optional positional arguments
 syntax.flags: array of optional flags

 argument.name: The name to use in the result object
 argument.type: one of number, string, array, object, func, *, value
 argument.value: (for type value) the value the argument has to match
 argument.condition: function (value) -> boolean, return falsey value to fail match

 flag.short: single letter abbreviation
 flag.long: full flag name
 flag.name: The name to use in the result
 flag.value: true, if the flag requires a value

 result.matchI: The index of the matched alternative, or -1 if no match
 result.matched: true, if any alternative could be matched
 result.tma: true, if optional argument count was exceeded
 result[name]: The value for a named argument
 */
module.exports = function validate(altern, args) {
    // Make array of alternatives
    if (!_.isArray(altern)) {
        altern = [altern];
    }
    // Attempt to match alternatives in order
    for (var k = 0; k < altern.length; k++) {
        var syntax = altern[k];
        var result = {};

        // Normalize syntax
        if (!syntax.mandatory) {
            syntax.mandatory = [];
        }
        if (!syntax.optional) {
            syntax.optional = [];
        }
        if (!syntax.flags) {
            syntax.flags = [];
        }

        result = matchSyntax(syntax, args);
        if (result.matched) {
            result.matchI = k;
            return result;
        }
    }
};

function matchSyntax(syntax, args) {
    var result = {matched: true};
    var mandatory = syntax.mandatory,
        optional = syntax.optional,
        flags = syntax.flags;

    // index in positional arguments
    var posI = 0;
    // Go through all the arguments
    for (var i = 0; i < args.length && result.matched; i++) {
        var a = args[i];
        // Attempt to match positional first
        var sArg, success;
        var posI2 = posI - mandatory.length;
        if (posI < mandatory.length) {
            // Mandatory argument
            sArg = mandatory[posI];
        } else if (posI2 < optional.length) {
            // Optional argument
            sArg = optional[posI2];
        } else {
            // Too Many Arguments
            result.tma = true;
            continue;
        }
        success = matchArgumentType(sArg, a);
        if (_.isFunction(sArg.condition)) {
            success = success && sArg.condition(a);
        }
        if (success) {
            result[sArg.name] = a;
            posI++;
            continue;
        }

        // Positional does not match, try flag
        if (a[0] === '-') {
            var matchedFlags, f;
            if (a[1] === '-') {
                // Long flag
                for (var j = 0; j < flags.length; j++) {
                    f = flags[j];
                    if (f.long === a.substr(2)) {
                        // Match! yay!
                        matchedFlags = [f];
                        break;
                    }
                }
                // Match failed!
                result.matched = false;
                continue;
            } else {
                // Short flag(s)
                matchedFlags = [];
                for (var l = 0; l < a.substr(1).length; l++) {
                    var flagChar = a[l + 1];
                    for (var m = 0; m < flags.length; m++) {
                        f = flags[m];
                        if (f.short === flagChar) {
                            // Match! yay!
                            matchedFlags.push(f);
                            break;
                        }
                    }
                }
                if (matchedFlags.length < 1) {
                    // Match failed!
                    result.matched = false;
                    continue;
                }
            }
            // Set all the flags, respect them value flags too
            for (var n = 0; n < matchedFlags.length; n++) {
                f = matchedFlags[n];
                if (f.value) {
                    result[f.name] = args[++i];
                } else {
                    result[f.name] = true;
                }
            }
        } else {
            result.matched = false;
        }
    }
    return result;
}

function matchArgumentType(sArg, a) {
    switch (sArg.type) {
        case 'number':
            return _.isNumber(a);
        case 'string':
            return _.isString(a);
        case 'array':
            return _.isArray(a);
        case 'object':
            return _.isPlainObject(a);
        case '*':
            return true;
        case 'func':
            return typeof a === 'object' && a["type"] === 'fn' && typeof a["body"] === 'object';
        case 'value':
            return a === sArg.value;
        default:
            throw "Illegal argument type :" + sArg.type;
    }
}
