/*global require, module, exports */
var // Module
    THREE = require('../vendor/three'),
    CANNON = require('../vendor/cannon'),
    console = require('./console'),
    ocl = require('./ocl'),
    arena = require('./arena'),
    props = require('./props'),
    commands = require('./commands'),
    Sexhr = require('../vendor/SeXHR'),
    scenemgr = require('../client/scene-manager'),
// Local
    ids = [],
// Function
    spawn, clear, load;

ocl.define('obj', function (params) {
    if (params.pos) {
        this.pos = new THREE.Vector3(params.pos[0], params.pos[1], params.pos[2]);
    }
    if (params.quat) {
        this.quat = new THREE.Quaternion(params.quat[0], params.quat[1], params.quat[2], params.quat[3]);
    }
    if (params.flags) {
        this.flags = params.flags;
    }
});

ocl.define('mesh', function () {
    this.mesh = new THREE.Mesh(this.geo, this.mat);
});

ocl.define('prop', function (name) {
    var ctx = this;
    this.propName = name;
    this.ocl.suspend();
    props.load(name, function (prop) {
        ctx.prop = prop;
        ctx.mesh = prop.mesh;
        ctx.body = prop.body;
        ctx.link = prop.link;
        ctx.ocl.resume();
    });
});

ocl.define('compound', function () {
    this.link = true;
});

ocl.define('body', function (params) {
    params = params || {mass: 0};
    this.body = new CANNON.Body(params);
    if (this.shape) {
        this.body.addShape(this.shape);
    }
    for (var i = 1; i < arguments.length; i++) {
        this.body.addShape(arguments[i].shape);
    }
});

ocl.define('model', function (modelName) {
    var ctx = this;
    var cb = function (geometry, materials) {
        ctx.geo = geometry;
        if (materials.length) {
            ctx.mat = materials[0];
        }
        ctx.ocl.resume();
    };
    this.ocl.suspend();
    (new THREE.JSONLoader()).load(arena.modelDir + modelName + ".json", cb, arena.textureDir);
});

// Geometry

ocl.define('rbox', function (x, y, z) {
    this.geo = new THREE.BoxGeometry(x, y, z);
});

ocl.define('rcyl', function (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded) {
    this.geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded);
});

ocl.define('rico', function (radius, detail) {
    this.geo = new THREE.IcosahedronGeometry(radius, detail);
});

ocl.define('rpla', function (width, height, wSeg, hSeg) {
    this.geo = new THREE.PlaneGeometry(width, height, wSeg, hSeg);
});

ocl.define('rsph', function (params) {
    this.geo = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments, params.phiStart, params.phiLength, params.thetaStart, params.thetaLength);
});

ocl.define('rcir', function (params) {
    this.geo = new THREE.CircleGeometry(params.radius, params.segments, params.thetaStart, params.thetaLength);
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
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshBasicMaterial(params);
});

ocl.define('matdepth', function (params) {
    this.mat = new THREE.MeshDepthMaterial(params);
});

ocl.define('matlambert', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshLambertMaterial(params);
});

ocl.define('matnormal', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshNormalMaterial(params);
});

ocl.define('matphong', function (params) {
    if (typeof params.texture === 'string') {
        params.map = THREE.ImageUtils.loadTexture(params.texture);
    }
    this.mat = new THREE.MeshPhongMaterial(params);
});

exports.spawn = function (obj) {
    if (!obj.pos) {
        console.warn("Skipping map object without position.");
        return;
    }
    if (obj.mesh) {
        obj.mesh.position.copy(obj.pos);
        ids.push(scenemgr.addToScene(obj.mesh));
    }
    if (obj.body) {
        obj.body.position.copy(obj.pos);
        ids.push(scenemgr.addToWorld(obj.body));
    }
    if (obj.link) {
        scenemgr.link(obj.mesh, obj.body);
    }
};

exports.clear = function () {
    ids.forEach(scenemgr.remove);
    ids = [];
};

exports.load = function (str) {
    /// <summary>Loads a level from JSON.</summary>
    /// <param name="str" type="String">A string in JSON format.</param>
    ocl.load(str, function (objList) {
        objList.forEach(exports.spawn);
        console.log("Level loaded");
    });
};


exports.commands = {};

exports.commands.lv_clear = function (c, args) {
    commands.validate([], args);
    clear();
};

exports.commands.lv_load = function (c, args) {
    if (!commands.validate(['string'], args)) {
        return;
    }
    new Sexhr().req({
        url: args[1],
        done: function (err, res) {
            if (err) {
                throw err;
            }
            exports.load(res.text);
        }
    });
};

exports.commands.lv_spawn = function (c, args) {
    if (!commands.validate(['string'], args)) {
        return;
    }
    try {
        ocl.load(args[1], spawn);
    } catch (e) {
        console.error("Error parsing JSON!");
    }
};
