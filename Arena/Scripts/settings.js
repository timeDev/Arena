define({
    init: function () {
        'use strict';
        return undefined;
    },
    mouse: {
        sensitivityX: 2.0 / 1000,
        sensitivityY: 2.0 / 1000
    },
    gameplay: {
    },
    player: {
        mass: 80,
        radius: 1.3,
        speed: 5.0,
        maxAcc: 10.0,
        jumpVel: 12.0
    },
    graphics: {
        fov: 75.0
    },
    debug: {
        showGrid: true
    }
});