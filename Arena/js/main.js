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

require(['SeXHR'], function (Sexhr) {
    'use strict';
    window.xhr = new Sexhr();
});

// Entry point
require(['lib/domReady', 'arena', 'game', 'console'], function (domReady, arena, game, console) {
    'use strict';
    domReady(function () {
        window.console.log("Playing Arena version", arena.version);
        console.writeLine("Playing Arena version " + arena.version);
        if (arena.debug) {
            window.console.warn("Debug mode is enabled");
            console.writeLine("Debug mode is enabled", 'yellow');
            window.game = game;
            window.debugging = true;
        }
        game.init();
    });
});