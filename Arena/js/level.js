define(['THREE', 'lib/cannon', 'scene-manager', 'console', 'ocl'], function (THREE, CANNON, scenemgr, console, ocl) {
    "use strict";
    ocl.define('obj', function (params) {
        if (params.pos) { this.pos = new THREE.Vector3(params.pos[0], params.pos[1], params.pos[2]); }
        if (params.quat) { this.quat = new THREE.Quaternion(params.quat[0], params.quat[1], params.quat[2], params.quat[3]); }
        if (params.flags) { this.flags = params.flags; }
    });

    ocl.define('mesh', function () {
        this.mesh = new THREE.Mesh(this.geo, this.mat);
    });

    ocl.define('prop', function (name) {
        this.name = name;
    });

    ocl.define('compound', function () {
        this.link = true;
    });

    ocl.define('body', function (params) {
        params = params || { mass: 0 };
        this.body = new CANNON.Body(params);
        if (this.shape) {
            this.body.addShape(this.shape);
        }
        for (var i = 1; i < arguments.length; i++) {
            this.body.addShape(arguments[i].shape);
        }
    });

    // Geometry

    ocl.define('rbox', function (x, y, z) {
        this.geo = new THREE.BoxGeometry(x, y, z);
    });

    ocl.define('rcyl', function (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded) {
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded);
    });

    ocl.define('rico', function (radius, detail) {
        return new THREE.IcosahedronGeometry(radius, detail);
    });

    ocl.define('rpla', function (width, height, wSeg, hSeg) {
        return new THREE.PlaneGeometry(width, height, wSeg, hSeg);
    });

    ocl.define('rsph', function (params) {
        return new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments, params.phiStart, params.phiLength, params.thetaStart, params.thetaLength);
    });

    ocl.define('rcir', function (params) {
        return new THREE.CircleGeometry(params.radius, params.segmetns, params.thetaStart, params.thetaLength);
    });

    // Collision objects

    ocl.define('cbox', function (x, y, z) {
        this.shape = new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, z / 2));
    });

    ocl.define('csph', function (radius) {
        this.shape = new CANNON.Sphere(radius);
    });

    ocl.define('ccyl', function (radiusTop, radiusBottom, height, numSegments) {
        this.shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
    });

    ocl.define('cpla', function () {
        this.shape = new CANNON.Plane();
    });

    // Material

    ocl.define('matbasic', function (params) {
        if (typeof params.texture === 'string') {
            params.map = THREE.TextureUtils.loadTexture(params.texture);
        }
        this.mat = new THREE.MeshBasicMaterial(params);
    });

    ocl.define('matdepth', function (params) {
        this.mat = new THREE.MeshDepthMaterial(params);
    });

    ocl.define('matlambert', function (params) {
        if (typeof params.texture === 'string') {
            params.map = THREE.TextureUtils.loadTexture(params.texture);
        }
        this.mat = new THREE.MeshLambertMaterial(params);
    });

    ocl.define('matnormal', function (params) {
        if (typeof params.texture === 'string') {
            params.map = THREE.TextureUtils.loadTexture(params.texture);
        }
        this.mat = new THREE.MeshNormalMaterial(params);
    });

    ocl.define('matphong', function (params) {
        if (typeof params.texture === 'string') {
            params.map = THREE.TextureUtils.loadTexture(params.texture);
        }
        this.mat = new THREE.MeshPhongMaterial(params);
    });

    return {
        load: function (str) {
            var i, objList = ocl.load(str);
            for (i = 0; i < objList.length; i++) {
                var obj = objList[i];
                if (!obj.pos) {
                    console.writeLine("Skipping map object without position.", 'yellow');
                    continue;
                }
                if (obj.mesh) {
                    obj.mesh.position.copy(obj.pos);
                    scenemgr.addToScene(obj.mesh);
                }
                if (obj.body) {
                    obj.body.position.copy(obj.pos);
                    scenemgr.addToWorld(obj.body);
                }
                if (obj.link) {
                    scenemgr.link(obj.mesh, obj.body);
                }
            }
        }
    };
});
