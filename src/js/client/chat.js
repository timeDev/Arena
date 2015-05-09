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
    keycode = require('../util/keycode'),
    protocol = require('../net/client'),
// Local
    domElement = document.createElement('div'),
    inElement = document.createElement('input'),
    outElement = document.createElement('div');

exports.init = _.noop;
exports.render = _.noop;

exports.initDom = function () {
    document.body.appendChild(domElement);
};

exports.update = function (dt, data) {
    _(data.packets).where({type: 'chatMsg'}).forEach(function (pck) {
        exports.write(pck.msg);
        exports.refresh();
    });
};

domElement.classList.add("chat-container");
inElement.classList.add("chat-input");
outElement.classList.add("chat-output");

domElement.style.position = 'absolute';
domElement.style.left = '0';
domElement.style.bottom = '0';

domElement.insertAdjacentHTML('afterbegin', "Chat<br>");
domElement.appendChild(outElement);
domElement.appendChild(inElement);

inElement.addEventListener('keypress', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    if (which === keycode.enter) {
        protocol.send(protocol.makePacket('chatMsg', inElement.value));
        inElement.value = "";
    }
});

exports.write = function (str) {
    outElement.insertAdjacentHTML('beforeend', str);
    outElement.scrollTop = outElement.scrollHeight;
};

exports.refresh = function () {
    window.clearInterval(fadeId);
    window.clearTimeout(fadeWaitId);
    if (!focused) {
        fadeWaitId = _.delay(exports.fade, 3000);
    }
};

document.addEventListener('keydown', function (e) {
    var which = e.which || e.charCode || e.keyCode;
    var el = document.activeElement;
    if (el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
        el.tagName.toLowerCase() == 'textarea')) {
        // focused element is a text input or textarea
        return;
    }
    if (which === keycode.t) {
        exports.focus();
        e.preventDefault();
    }
}, false);

var focused;

exports.focus = function () {
    focused = true;
    exports.refresh();
    domElement.style.display = '';
    domElement.style.opacity = '1';
    domElement.style.filter = '';
    inElement.focus();
};

inElement.addEventListener('blur', function () {
    focused = false;
    exports.fade();
}, false);

var fadeId = -1, fadeWaitId = -1;

exports.fade = function () {
    var op = 1;  // initial opacity
    fadeId = setInterval(function () {
        if (op <= 0.05) {
            clearInterval(fadeId);
            fadeId = -1;
            domElement.style.display = 'none';
        }
        domElement.style.opacity = op;
        domElement.style.filter = "alpha(opacity=" + op * 100 + ")";
        op *= 0.95;
    }, 20);
    fadeWaitId = -1;
};
