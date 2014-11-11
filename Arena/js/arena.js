define(['game', 'console'], function (game, console) {
    'use strict';
    return {
        version: '0.1.1',
        debug: true,
        init: function () {
            window.console.log("Playing Arena version", this.version);
            console.writeLine("Playing Arena version " + this.version);
            if (this.debug) {
                window.console.warn("Debug mode is enabled");
                console.writeLine("Debug mode is enabled", 'yellow');
                window.game = game;
                window.debugging = true;
            }
            game.init();
        }
    };
});