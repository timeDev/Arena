/// <reference path="js/game.js" />
/// <reference path="js/input.js" />
/// <reference path="js/level.js" />
/// <reference path="js/scene-manager.js" />
/// <reference path="js/settings.js" 
/// <reference path="js/player.js" />
/// <reference path="js/console.js"/>
/// <reference path="lib/cannon.js" />
/// <reference path="lib/SeXHR.min.js" />
/// <reference path="lib/three.js" />
/// <reference path="lib/stats.min.js" />
/// <reference path="lib/signals.js"/>

Math.clamp = function (n, min, max) {
    'use strict';
    return Math.min(Math.max(n, min), max);
};

var Arena = {};
Arena.version = '0.1.1';

var Sexhr = sexhr; // Circumvent JSLint errors
window.xhr = new Sexhr();