requirejs.config({
    paths: {
        'THREE': 'lib/three',
        'Stats': 'lib/Stats',
        'SeXHR': 'lib/SeXHR'
    },
    shim: {
        'THREE': {
            exports: 'THREE'
        },
        'Stats': {
            exports: 'Stats'
        },
        'SeXHR': {
            exports: 'Sexhr'
        }
    }
});

// Polyfill and globals
if (Math.clamp === undefined) {
    Math.clamp = function (n, min, max) {
        'use strict';
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
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
              ? args[number]
              : match
            ;
        });
    };
}

// Entry point
require(['lib/domReady', 'arena', 'game', 'console'], function (domReady, arena, game, console) {
    'use strict';
    domReady(function () {
        console.log("Playing Arena version", arena.version);
        if (arena.debug) {
            console.warn("Debug mode is enabled");
            window.game = game;
            window.debugging = true;
        }
        game.init();
    });
});