/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Oskar Homburg
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
    keycode = require('./keycode'),
    commands = require('../common/commands'),
// Local
    dragging, offsetX, offsetY,
    domElement = document.createElement('div'),
    inElement = document.createElement('input'),
    outElement = document.createElement('div');

domElement.style.position = "absolute";
domElement.style.left = "100px";
domElement.style.top = "100px";
domElement.style.backgroundColor = "#202020";
domElement.style.padding = "10px";
domElement.style.overflow = "hidden";
inElement.style.backgroundColor = "#505050";
inElement.style.borderWidth = "0px";
inElement.style.marginTop = "10px";
inElement.style.width = "100%";
outElement.style.backgroundColor = "#505050";
outElement.style.padding = "2px";
outElement.style.fontSize = "12px";
outElement.style.maxHeight = "350px";
outElement.style.overflowY = "scroll";

domElement.insertAdjacentHTML('afterbegin', "Console<br>");
domElement.appendChild(outElement);
domElement.appendChild(inElement);

inElement.addEventListener('keypress', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    if (which === keycode.enter) {
        try {
            var result = commands.execute(inElement.value, 'cl');
            if (result !== undefined) {
                exports.log(result);
            }
        } catch (e) {
            exports.error(e.toString());
            throw e;
        }
        inElement.value = "";
    }
});

// Make the console draggable
domElement.addEventListener('mousedown', function (e) {
    var rect = domElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    if (offsetY <= 26) {
        dragging = true;
        domElement.style.cursor = "default";
    }
});

window.addEventListener('mousemove', function (e) {
    if (dragging) {
        domElement.style.left = (e.clientX - offsetX) + "px";
        domElement.style.top = (e.clientY - offsetY) + "px";
        e.preventDefault();
    }
});

domElement.addEventListener('mouseup', function () {
    dragging = false;
    domElement.style.cursor = "";
});

exports.domElement = domElement;
exports.w = window.console;

exports.log = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str);
    // Mirror output to web console
    window.console.log(str);
};

exports.warn = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str, 'yellow');
    // Mirror output to web console
    window.console.warn(str);
};

exports.error = function () {
    var str = String.format.apply(null, arguments);
    this.writeLine(str, 'red');
    // Mirror console output to web console
    window.console.error(str);
};

exports.write = function (str, color) {
    if (color) {
        str = '<span style="color: ' + color + '">' + str + '</span>';
    }
    outElement.insertAdjacentHTML('beforeend', str);
    outElement.scrollTop = outElement.scrollHeight;
};

exports.writeLine = function (str, color) {
    str = str || "";
    if (color) {
        str = '<span style="color: ' + color + '">' + str + '</span>';
    }
    outElement.insertAdjacentHTML('beforeend', str + "<br>");
    outElement.scrollTop = outElement.scrollHeight;
};
