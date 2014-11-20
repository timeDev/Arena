/*global require, module, exports */
(function () {
    'use strict';
    // Polyfill and globals
    if (Math.clamp === undefined) {
        Math.clamp = function (n, min, max) {
            return Math.min(Math.max(n, min), max);
        };
    }

    if (Math.HALF_PI === undefined) {
        Math.HALF_PI = Math.PI / 2;
    }

    // Thanks to Stackoverflow user fearphage
    if (!String.format) {
        String.format = function (format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/\{(\d+)\}/g, function (match, number) {
                return args[number] !== undefined ? args[number] : match;
            });
        };
    }

    // Entry point
    function entrypoint() {
        var game = require('game'),
            arena = require('arena'),
            console = require('console');

        console.log("Playing Arena version", arena.version);
        if (arena.debug) {
            console.warn("Debug mode is enabled");
            window.game = game;
            window.debugging = true;
        }
        game.init();
    }

    if (document.readyState === 'interactive') {
        entrypoint();
    } else {
        document.addEventListener('DOMContentLoaded', entrypoint);
    }
}());