define([], function () {
    "use strict";
    var scene, world,
        objects = {},
        idtracker = 0,
        // Functions
        newId;

    newId = function () {
        return idtracker++;
    };

    return {
        scene: scene,
        world: world,

        init: function (sc, wo) {
            this.scene = scene = sc;
            this.world = world = wo;
        },

        addToScene: function (obj) {
            var id = newId();
            obj.tracker = { id: id, type: "scene" };
            scene.add(obj);
            objects[id] = obj;
            return id;
        },

        addToWorld: function (obj) {
            var id = newId();
            obj.tracker = { id: id, type: "world" };
            world.add(obj);
            objects[id] = obj;
            return id;
        },

        link: function (a, b) {
            if (typeof a === "number") {
                a = objects[a];
                b = objects[b];
            }
            a.tracker.link = b;
            b.tracker.link = a;
        },

        addLink: function (s, w) {
            this.addToScene(s);
            this.addToWorld(w);
            this.link(s, w);
        },

        copyWorldToScene: function () {
            var i, obj;
            for (i = 0; i < idtracker; i++) {
                if (objects[i] !== undefined) {
                    obj = objects[i];
                    if (obj.tracker.type === "scene" && obj.tracker.link !== undefined) {
                        obj.position.copy(obj.tracker.link.position);
                        obj.quaternion.copy(obj.tracker.link.quaternion);
                    }
                }
            }
        },

        copySceneToWorld: function () {
            var i, obj;
            for (i = 0; i < idtracker; i++) {
                if (objects[i] !== undefined) {
                    obj = objects[i];
                    if (obj.tracker.type === "world" && obj.tracker.link !== undefined) {
                        obj.position.copy(obj.link.position);
                        obj.quaternion.copy(obj.link.quaternion);
                    }
                }
            }
        }
    };
});