define(['THREE'], function (THREE) {
    "use strict";
    var scene,
        idList = [],
        objList = [],
        // Functions
        loadGeometry,
        loadMaterial;

    loadGeometry = function (geo) {
        var type = geo.type, pos = geo.position, material = loadMaterial(geo.material), mesh, size;
        switch (type) {
            case 'box':
                size = geo.size;
                mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
                break;
            default:
                window.console.warn("Unknown geometry type in map: " + type);
                break;
        }
        mesh.position.set(pos[0], pos[1], pos[2]);
        scene.add(mesh);
        idList.push(mesh.id);
        objList.push(geo);
    };

    loadMaterial = function (mat) {
        if (mat === undefined) {
            return new THREE.MeshBasicMaterial({ color: 0x0000ff });
        }
        switch (mat.type) {
            case 'basic':
                return new THREE.MeshBasicMaterial(mat);
            default:
                return new THREE.MeshBasicMaterial({ color: 0x0000ff });
        }
    };

    return {
        load: function (obj, manager) {
            var i, geoArr;
            idList = [];
            objList = [];
            scene = manager.scene;

            if (Array.isArray(obj.geometry)) {
                geoArr = obj.geometry;
                for (i = 0; i < geoArr.length; i++) {
                    loadGeometry(geoArr[i]);
                }
            }
        },

        addConstraints: function () {
            window.console.warn("Stub function called");
        },
        getJSON: function () {
            window.console.warn("Stub function called");
        }
    };
});