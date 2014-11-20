"use strict";
var paused = true,
// Functions
    update,  init,
// Internal
    lvlUrl = 'maps/devtest.json';

init = function () {

    // ====== Internals ======

    scenemgr.init(scene, world);

    // -- Level --
    new Sexhr().req({
        url: lvlUrl,
        done: function (err, res) {
            if (err) {
                throw err;
            }
            level.load(res.text);
        }
    });

    // -- Player --
    player.init(camera);
    player.sceneObj.position.set(0, 2, 0);
    player.physBody.linearDamping = 0.95;
    scene.add(player.sceneObj);
    world.add(player.physBody);
};

update = function (time) {
    input.updateGamepad();
    if (paused === true) {
        input.resetDelta();
        return;
    }

    world.step(1 / 60, time, 2);

    player.update(time);
    scenemgr.copyWorldToScene();

    input.resetDelta();
};

module.exports = {
    world: world,
    scene: scene,
    level: level,

    init: init,

    pause: function () {
        paused = true;
    },

    halt: function () {
        console.warn("Stopping game!");
        paused = true;
        window.cancelAnimationFrame(animId);
    }
};