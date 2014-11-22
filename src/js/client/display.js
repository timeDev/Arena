/*global require, module, exports */
var // Module
    THREE = require('../vendor/THREE'),
    Stats = require('../vendor/Stats'),
    commands = require('../commands'),
    console = require('../console'),
    settings = require('../settings'),
    input = require('./input'),
    // Local
    scene, camera, renderer,
    // Function
    render;

// -- Setup --
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight - 5), 0.1, 1000);

renderer = new THREE.WebGLRenderer();
// The -5 is to hide scrollbars
renderer.setSize(window.innerWidth, window.innerHeight - 5);
renderer.domElement.onclick = function () {
    input.trylockpointer(renderer.domElement);
};
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    camera.aspect = window.innerWidth / (window.innerHeight - 5);
    camera.updateProjectionMatrix();
});
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight());

document.body.appendChild(console.domElement);

// -- Stats --
var renderStats = new Stats();
renderStats.domElement.style.position = 'absolute';
renderStats.domElement.style.left = '0px';
renderStats.domElement.style.top = '0px';
document.body.appendChild(renderStats.domElement);

render = function () {
    renderStats.begin();
    renderer.render(scene, camera);
    renderStats.end();
};

if (settings.debug.showGrid) {
    var gridXZ = new THREE.GridHelper(100, 1),
        gridXY = new THREE.GridHelper(100, 1),
        gridYZ = new THREE.GridHelper(100, 1);

    gridXZ.setColors(0xf00000, 0xff0000);
    gridXY.setColors(0x00f000, 0x00ff00);
    gridYZ.setColors(0x0000f0, 0x0000ff);

    gridXZ.position.set(100, 0, 100);
    gridXY.position.set(100, 100, 0);
    gridYZ.position.set(0, 100, 100);

    gridXY.rotation.x = Math.HALF_PI;
    gridYZ.rotation.z = Math.HALF_PI;

    scene.add(gridXZ);
    scene.add(gridXY);
    scene.add(gridYZ);
}

module.exports = {
    scene: scene,
    render: render,
    camera: camera
};

// -- Commands --
module.exports.commands = {};
module.exports.commands.cl_refresh_vp = function (c, args) {
    commands.api.validate([], args);
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    camera.aspect = window.innerWidth / (window.innerHeight - 5);
    camera.fov = settings.graphics.fov;
    camera.updateProjectionMatrix();
};
