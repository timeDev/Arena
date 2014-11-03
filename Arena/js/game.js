Arena.ArenaGame = (function () {
    "use strict";
    var HALF_PI = Math.PI / 2,
        ArenaGame = function () {
            this.paused = true;
            var self = this,
            // Cannon
                solver = new CANNON.GSSolver(),
                split = true,
                groundShape = new CANNON.Plane(),
                groundBody = new CANNON.Body({ mass: 0 }),
                geometry = new THREE.PlaneGeometry(300, 300, 50, 50),
            // Internal
                lvlUrl = 'maps/devtest.json';

            // -- Console --
            this.console = new Arena.Console();
            document.body.appendChild(this.console.domElement);

            // ====== Cannon ======

            this.world = new CANNON.World();
            this.world.quatNormalizeSkip = 0;
            this.world.quatNormalizeFast = false;

            this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
            this.world.defaultContactMaterial.contactEquationRegularizationTime = 4;

            solver.iterations = 7;
            solver.tolerance = 0.1;
            if (split) {
                this.world.solver = new CANNON.SplitSolver(solver);
            } else {
                this.world.solver = solver;
            }

            this.world.gravity.set(0, -20, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();

            // Create a plane
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.add(groundBody);

            this.console.writeLine("Cannon initialized");

            // ====== Three ======

            // -- Scene --
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 5), 0.1, 1000);

            this.scene.add(new THREE.AmbientLight(0x111111));

            this.renderer = new THREE.WebGLRenderer();
            // The -5 is to hide scrollbars
            this.renderer.setSize(window.innerWidth, window.innerHeight - 5);
            this.renderer.domElement.onclick = function () { self.input.trylockpointer(self.renderer.domElement); };
            window.onresize = function () {
                self.renderer.setSize(window.innerWidth, window.innerHeight - 5);
                self.camera.aspect = window.innerWidth / (window.innerHeight - 5);
                self.camera.updateProjectionMatrix();
            };
            document.body.appendChild(this.renderer.domElement);

            // -- Floor --
            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

            // ====== Internals ======

            Arena.settings.init();

            this.manager = new Arena.SceneManager(this.scene, this.world);

            // -- Level --
            window.xhr.req({
                url: lvlUrl,
                json: true,
                success: function (res) {
                    self.level = new Arena.Level(res.json, self.manager);
                    self.console.writeLine("Level loaded");
                },
                error: function (err) { window.console.error(err); }
            });

            // -- Input --
            this.input = new Arena.Input();
            this.input.onpointerlocked = function () {
                self.paused = false;
                self.input.prevent = true;
            };
            this.input.onpointerunlocked = function () { self.paused = true; self.input.prevent = false; };
            this.input.onescape = function () { self.paused = true; self.input.prevent = false; };

            this.input.bind('mouseaxis', 2, 'lookx');
            this.input.bind('mouseaxis', 3, 'looky');
            this.input.bind('key', keycode.w, 'movf');
            this.input.bind('key', keycode.a, 'movl');
            this.input.bind('key', keycode.s, 'movb');
            this.input.bind('key', keycode.d, 'movr');
            this.input.bind('key', keycode.space, 'jump');
            this.input.bind('mouse', 0, 'shoot');

            // -- Player --
            this.player = new Arena.Player(this.camera, this.input);
            this.player.yawObj.position.set(0, 2, 0);
            this.player.cannonBody.linearDamping = 0.95;
            this.scene.add(this.player.yawObj);
            this.world.add(this.player.cannonBody);

            // -- Debug --
            if (Arena.settings.debug.showGrid === true) {
                this.showDebugGrid();
            }

            // -- Stats --
            this.renderStats = new Stats();
            this.renderStats.domElement.style.position = 'absolute';
            this.renderStats.domElement.style.left = '0px';
            this.renderStats.domElement.style.top = '0px';
            document.body.appendChild(this.renderStats.domElement);
            this.updateStats = new Stats();
            this.updateStats.domElement.style.position = 'absolute';
            this.updateStats.domElement.style.left = '0px';
            this.updateStats.domElement.style.top = '48px';
            document.body.appendChild(this.updateStats.domElement);

            this.timestamp = Date.now();

            window.requestAnimationFrame(function () { self.tick(); });

            this.console.writeLine("Initialization done");
        };

    ArenaGame.prototype.tick = function () {
        var self = this, now = new Date();
        window.requestAnimationFrame(function () { self.tick(); });
        this.updateStats.begin();
        this.update((now - this.timestamp) / 1000.0);
        this.updateStats.end();
        this.timestamp = now;
        this.renderStats.begin();
        this.render();
        this.renderStats.end();
    };


    ArenaGame.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    ArenaGame.prototype.update = function (time) {
        if (this.paused === true) {
            this.input.resetDelta();
            return;
        }

        this.world.step(1 / 60, time, 2);

        this.player.update(time);
        this.manager.copyWorldToScene();

        this.input.resetDelta();
    };

    ArenaGame.prototype.showDebugGrid = function () {
        var gridXZ = new THREE.GridHelper(100, 1),
            gridXY = new THREE.GridHelper(100, 1),
            gridYZ = new THREE.GridHelper(100, 1);

        gridXZ.setColors(0xf00000, 0xff0000);
        gridXY.setColors(0x00f000, 0x00ff00);
        gridYZ.setColors(0x0000f0, 0x0000ff);

        gridXZ.position.set(100, 0, 100);
        gridXY.position.set(100, 100, 0);
        gridYZ.position.set(0, 100, 100);

        gridXY.rotation.x = HALF_PI;
        gridYZ.rotation.z = HALF_PI;

        this.scene.add(gridXZ);
        this.scene.add(gridXY);
        this.scene.add(gridYZ);
    };

    return ArenaGame;
}());