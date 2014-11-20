/*global require, module, exports */
var // Module
    input = require('./input'),
    keycode = require('./keycode'),
    //Local
    paused = true;

input.pointerlocked.add(function () {
    paused = false;
    input.prevent = true;
});
input.pointerunlocked.add(function () {
    paused = true;
    input.prevent = false;
});
input.escape.add(function () {
    paused = true;
    input.prevent = false;
});

input.bind('mouseaxis', 2, 'lookx');
input.bind('mouseaxis', 3, 'looky');
input.bind('key', keycode.w, 'movf');
input.bind('key', keycode.a, 'movl');
input.bind('key', keycode.s, 'movb');
input.bind('key', keycode.d, 'movr');
input.bind('key', keycode.space, 'jump');
input.bind('mouse', 0, 'shoot');