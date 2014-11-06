define(['game'], function (game) {
    'use strict';
    return {
        version: '0.1.1',
        debug: true,
        init: function () {
            window.console.log("Playing Arena version", this.version);
            if (this.debug) {
                window.console.warn("Debug mode is enabled");
                window.game = game;
            }
            game.init();
        }
    };
});