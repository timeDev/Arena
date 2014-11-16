define(['THREE', 'lib/cannon', 'console', 'input', 'keycode', 'Stats', 'settings', 'scene-manager', 'level', 'player', 'SeXHR', 'commands'],
    function (THREE, CANNON, console, input, keycode, Stats, settings, scenemgr, level, player, Sexhr, commands) {
        "use strict";
        var paused = true, world, scene, camera, renderer, renderStats, updateStats, timestamp, animId,
            // Functions
            tick, render, update, showDebugGrid, init,
            // Cannon
            solver = new CANNON.GSSolver(),
            split = true,
            // Internal
            lvlUrl = 'maps/devtest.json';

        // -- Console --
        document.body.appendChild(console.domElement);

        init = function () {

            // ====== Cannon ======

            world = new CANNON.World();
            world.quatNormalizeSkip = 0;
            world.quatNormalizeFast = false;

            world.defaultContactMaterial.contactEquationStiffness = 1e9;
            world.defaultContactMaterial.contactEquationRegularizationTime = 4;

            solver.iterations = 7;
            solver.tolerance = 0.1;
            if (split) {
                world.solver = new CANNON.SplitSolver(solver);
            } else {
                world.solver = solver;
            }

            world.gravity.set(0, -20, 0);
            world.broadphase = new CANNON.NaiveBroadphase();

            console.log("Cannon initialized");

            // ====== Three ======

            // -- Scene --
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(settings.graphics.fov, window.innerWidth / (window.innerHeight - 5), 0.1, 1000);

            renderer = new THREE.WebGLRenderer();
            // The -5 is to hide scrollbars
            renderer.setSize(window.innerWidth, window.innerHeight - 5);
            renderer.domElement.onclick = function () { input.trylockpointer(renderer.domElement); };
            window.onresize = function () {
                renderer.setSize(window.innerWidth, window.innerHeight - 5);
                camera.aspect = window.innerWidth / (window.innerHeight - 5);
                camera.updateProjectionMatrix();
            };
            document.body.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight());

            // ====== Internals ======

            settings.init();

            scenemgr.init(scene, world);

            // -- Level --
            new Sexhr().req({
                url: lvlUrl,
                done: function (err, res) {
                    if (err) { throw err; }
                    level.load(res.text);
                }
            });

            // -- Input --
            input.pointerlocked.add(function () {
                paused = false;
                input.prevent = true;
            });
            input.pointerunlocked.add(function () { paused = true; input.prevent = false; });
            input.escape.add(function () { paused = true; input.prevent = false; });

            input.bind('mouseaxis', 2, 'lookx');
            input.bind('mouseaxis', 3, 'looky');
            input.bind('key', keycode.w, 'movf');
            input.bind('key', keycode.a, 'movl');
            input.bind('key', keycode.s, 'movb');
            input.bind('key', keycode.d, 'movr');
            input.bind('key', keycode.space, 'jump');
            input.bind('mouse', 0, 'shoot');

            // -- Player --
            player.init(camera);
            player.sceneObj.position.set(0, 2, 0);
            player.physBody.linearDamping = 0.95;
            scene.add(player.sceneObj);
            world.add(player.physBody);

            // -- Debug --
            if (settings.debug.showGrid === true) {
                showDebugGrid();
            }

            // -- Stats --
            renderStats = new Stats();
            renderStats.domElement.style.position = 'absolute';
            renderStats.domElement.style.left = '0px';
            renderStats.domElement.style.top = '0px';
            document.body.appendChild(renderStats.domElement);
            updateStats = new Stats();
            updateStats.domElement.style.position = 'absolute';
            updateStats.domElement.style.left = '0px';
            updateStats.domElement.style.top = '48px';
            document.body.appendChild(updateStats.domElement);

            timestamp = Date.now();

            animId = window.requestAnimationFrame(tick);

            console.log("Initialization done");
        };

        tick = function () {
            var now = Date.now();
            animId = window.requestAnimationFrame(tick);
            updateStats.begin();
            update((now - timestamp) / 1000.0);
            updateStats.end();
            timestamp = now;
            renderStats.begin();
            render();
            renderStats.end();
        };

        render = function () {
            renderer.render(scene, camera);
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

        showDebugGrid = function () {
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
        };

        return {
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
            },

            conReg: function () {
                console.registerFunc('cl_refresh_vp', function (c, args) {
                    commands.validate([], args);
                    renderer.setSize(window.innerWidth, window.innerHeight - 5);
                    camera.aspect = window.innerWidth / (window.innerHeight - 5);
                    camera.fov = settings.graphics.fov;
                    camera.updateProjectionMatrix();
                });

                level.conReg();
            }
        };
    });