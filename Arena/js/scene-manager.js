Arena.SceneManager = (function () {
    "use strict";
    var SceneManager = function (scene, world) {
        this.scene = scene;
        this.world = world;
        this.objects = {};
    }, idtracker = 0;

    SceneManager.prototype.newId = function () {
        return idtracker++;
    };

    SceneManager.prototype.addToScene = function (obj) {
        var id = this.newId();
        obj.tracker = { id: id, type: "scene" };
        this.scene.add(obj);
        this.objects[id] = obj;
        return id;
    };

    SceneManager.prototype.addToWorld = function (obj) {
        var id = this.newId();
        obj.tracker = { id: id, type: "world" };
        this.world.add(obj);
        this.objects[id] = obj;
        return id;
    };

    SceneManager.prototype.link = function (a, b) {
        if (typeof a === "number") {
            a = this.objects[a];
            b = this.objects[b];
        }
        a.tracker.link = b;
        b.tracker.link = a;
    };

    SceneManager.prototype.addLink = function (s, w) {
        this.addToScene(s);
        this.addToWorld(w);
        this.link(s, w);
    };

    SceneManager.prototype.copyWorldToScene = function () {
        var i, obj;
        for (i = 0; i < idtracker; i++) {
            if (this.objects[i] !== undefined) {
                obj = this.objects[i];
                if (obj.tracker.type === "scene" && obj.tracker.link !== undefined) {
                    obj.position.copy(obj.tracker.link.position);
                    obj.quaternion.copy(obj.tracker.link.quaternion);
                }
            }
        }
    };

    SceneManager.prototype.copySceneToWorld = function () {
        var i, obj;
        for (i = 0; i < idtracker; i++) {
            if (this.objects[i] !== undefined) {
                obj = this.objects[i];
                if (obj.tracker.type === "world" && obj.tracker.link !== undefined) {
                    obj.position.copy(obj.link.position);
                    obj.quaternion.copy(obj.link.quaternion);
                }
            }
        }
    };

    return SceneManager;
}());