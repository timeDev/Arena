Arena.Level = (function () {
    "use strict";
    var Level = function (obj, manager) {
        var i, geoArr;
        this.idList = [];
        this.objList = [];
        this.scene = manager.scene;
        //console.warn("Stub function called");

        if (Array.isArray(obj.geometry)) {
            geoArr = obj.geometry;
            for (i = 0; i < geoArr.length; i++) {
                this.loadGeometry(geoArr[i]);
            }
        }
    };

    Level.prototype.loadGeometry = function (geo) {
        var type = geo.type, pos = geo.position, material = this.loadMaterial(geo.material), mesh, size;
        switch (type) {
            case 'box':
                size = geo.size;
                mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
                break;
            default:
                console.warn("Unknown geometry type in map: " + type);
                break;
        }
        mesh.position.set(pos[0], pos[1], pos[2]);
        this.scene.add(mesh);
        this.idList.push(mesh.id);
        this.objList.push(geo);
    };

    Level.prototype.loadMaterial = function (mat) {
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

    Level.prototype.addConstraints = function () {
        console.warn("Stub function called");
    };

    Level.prototype.getJSON = function () {
        console.warn("Stub function called");
    };

    return Level;
}());