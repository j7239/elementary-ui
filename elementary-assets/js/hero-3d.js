/**
 * Interactive 3D Physics Background
 * Built with Three.js and Cannon-es 
 */
window.initHero3D = () => {
    const container = document.getElementById('hero-3d-root');
    if (!container) return;

    const gettingStartedSection = document.getElementById('getting-started');

    // Returns true only when the home/getting-started view is the active section
    const isHomeActive = () => gettingStartedSection && !gettingStartedSection.classList.contains('d-none');

    // --- BLOOM STATE ---
    const heroGradient = document.getElementById('hero-gradient');
    // Defaults: track movement
    let targetLeftX = 25, targetRightX = 75, targetY = 50;
    let currentLeftX = 25, currentRightX = 75, currentY = 50;
    // Opacity: defaults to 0.5 unclicked
    let targetLeftOpacity = 0.5, targetRightOpacity = 0.5;
    let currentLeftOpacity = 0.5, currentRightOpacity = 0.5;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    // Ambient color blending
    // Set up transparent background so the underlying page background shows through
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // Size it correctly
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    // Camera is pulled back a bit
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 3, 0);

    // Light Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    // widen the shadow camera to cover everything
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x635bff, 0.5); // Brand Purple fill
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // --- CANNON.JS SETUP ---
    const world = new CANNON.World();
    world.gravity.set(0, -20.0, 0); // strong gravity to feel heavy
    // Use Sweep-and-prune for better performance
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 10;
    world.defaultContactMaterial.friction = 0.3;
    world.defaultContactMaterial.restitution = 0.2; // some bounce

    const cubes = [];

    // --- GROUND BASE ---
    // So cubes have somewhere to stack
    const groundMat = new CANNON.Material();
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat, shape: groundShape });
    // rotate plane to be horizontal facing up
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    // Move ground to bottom edge of screen exactly
    groundBody.position.set(0, -2, 0);
    world.addBody(groundBody);

    // Add a visual base that the cubes appear to rest on
    const baseGeometry = new THREE.BoxGeometry(100, 4, 100);
    const baseMaterial = new THREE.ShadowMaterial({
        opacity: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    // Physics plane is exactly at y = -2. A 4-unit high box centered at y = -4 will feature its top surface exactly at y = -2.
    baseMesh.position.set(0, -4, 0);
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Optional: adding invisible walls to prevent blocks from falling completely off-screen
    const wallLeft = new CANNON.Body({ mass: 0 });
    wallLeft.addShape(new CANNON.Plane());
    wallLeft.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    wallLeft.position.set(-15, 0, 0);
    world.addBody(wallLeft);

    const wallRight = new CANNON.Body({ mass: 0 });
    wallRight.addShape(new CANNON.Plane());
    wallRight.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    wallRight.position.set(15, 0, 0);
    world.addBody(wallRight);

    const wallBack = new CANNON.Body({ mass: 0 });
    wallBack.addShape(new CANNON.Plane());
    wallBack.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
    wallBack.position.set(0, 0, -10);
    world.addBody(wallBack);

    const wallFront = new CANNON.Body({ mass: 0 });
    wallFront.addShape(new CANNON.Plane());
    wallFront.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
    wallFront.position.set(0, 0, 10);
    world.addBody(wallFront);

    // Generate a purple block 
    const boxSize = 1.25;
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

    // For when they split into 4 smaller blocks
    const smallBoxSize = boxSize / 2;
    const smallBoxGeometry = new THREE.BoxGeometry(smallBoxSize, smallBoxSize, smallBoxSize);

    // Generate brand purple blocks with slight pastel tone matching the theme
    const purpleMaterial = new THREE.MeshStandardMaterial({
        color: 0x635bff, // primary color
        roughness: 0.1,  // shiny/smooth feeling 
        metalness: 0.1
    });

    // Add variations for fun
    const materials = [
        purpleMaterial,
        new THREE.MeshStandardMaterial({ color: 0xff3e76, roughness: 0.2, metalness: 0.1 }), // pink
    ];

    function createBlock(x, y, z, isSmall = false) {
        const currentSize = isSmall ? smallBoxSize : boxSize;
        const currentGeometry = isSmall ? smallBoxGeometry : boxGeometry;

        // Randomize slightly
        const mat = materials[Math.floor(Math.random() * materials.length)];

        // Three.js Mesh
        const mesh = new THREE.Mesh(currentGeometry, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Cannon.js Body
        const shape = new CANNON.Box(new CANNON.Vec3(currentSize / 2, currentSize / 2, currentSize / 2));
        const body = new CANNON.Body({
            mass: isSmall ? 0.25 : 1, // heavy objects
            shape: shape,
            position: new CANNON.Vec3(x, y, z),
            material: new CANNON.Material()
        });

        // Add some random rotation out of the gate so they don't land flat perfectly
        body.angularVelocity.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );

        world.addBody(body);
        cubes.push({ mesh, body, isSmall });

        // Keep performance clean by limiting to 50 active blocks
        if (cubes.length > 50) {
            const oldest = cubes.shift();
            scene.remove(oldest.mesh);
            world.remove(oldest.body);
            // Dispose geometries to avoid memory leaks
        }
    }

    // Drop 8 cubes randomly from the sky initially
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            // Drop them evenly spread out horizontally between -8 and 8
            const randomX = (Math.random() * 16) - 8;
            // Drop from high up with slight variance to prevent perfect stacking at the start
            const randomY = 10 + (Math.random() * 15);
            // Drop on the Z plane (slightly staggered to give depth)
            const randomZ = (Math.random() * 2) - 1;

            createBlock(randomX, randomY, randomZ);
        }, i * 200); // Stagger their spawns by 200ms
    }

    // --- INTERACTION SETUP (DRAG AND DROP) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dropPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersect = new THREE.Vector3();

    // Variables for holding the block we are currently dragging
    let draggedCube = null;
    let dragConstraint = null;
    const grabOffset = new THREE.Vector3();

    // A kinematic "mouse body" that we use to attach the constraint to
    const mousePhysicsBody = new CANNON.Body({ mass: 0 }); // Kinematic body (mass 0) ignores gravity
    mousePhysicsBody.addShape(new CANNON.Sphere(0.1));
    mousePhysicsBody.collisionFilterGroup = 0; // Don't collide with anything itself
    world.addBody(mousePhysicsBody);

    function getIntersects(event) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // Find meshes we hit
        const threeMeshes = cubes.map(c => c.mesh);
        return raycaster.intersectObjects(threeMeshes);
    }

    // Pointer Down (Grab)
    container.addEventListener('pointerdown', (event) => {
        const hits = getIntersects(event);

        if (hits.length > 0) {
            // We clicked on a block!
            const hitMesh = hits[0].object;
            // Find its matching physics object from our array
            draggedCube = cubes.find(c => c.mesh === hitMesh);

            if (draggedCube) {
                // Fix the drop plane rigidly to Z = 0 so all blocks pull forward/backward to the exact same depth
                dropPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0));

                // Determine exactly where on the drop plane we clicked
                const intersect = raycaster.ray.intersectPlane(dropPlane, planeIntersect);

                if (intersect) {
                    // Temporarily wake up the body, lock its rotation, and zero out its current velocities so it grabs smoothly
                    draggedCube.body.wakeUp();
                    draggedCube.body.fixedRotation = true;
                    draggedCube.body.updateMassProperties();
                    draggedCube.body.velocity.set(0, 0, 0);
                    draggedCube.body.angularVelocity.set(0, 0, 0);

                    // Calculate the visual offset between where we clicked and the center of the block
                    grabOffset.copy(hitMesh.position).sub(planeIntersect);
                    // Force Z offset to 0 so the block is pulled to the dropPlane depth
                    // instead of maintaining its original Z depth difference.
                    grabOffset.z = 0;

                    // Move our invisible kinematic mouse body perfectly to the center of the block
                    mousePhysicsBody.position.copy(draggedCube.body.position);

                    // Create a standard center-to-center PointToPoint constraint 
                    dragConstraint = new CANNON.PointToPointConstraint(
                        draggedCube.body,
                        new CANNON.Vec3(0, 0, 0), // center of block
                        mousePhysicsBody,
                        new CANNON.Vec3(0, 0, 0) // center of mouse body
                    );

                    world.addConstraint(dragConstraint);

                    // Determine left or right side click for opacity highlight
                    if (mouse.x < 0) {
                        targetLeftOpacity = 1.0;
                        targetRightOpacity = 0.2;
                    } else {
                        targetRightOpacity = 1.0;
                        targetLeftOpacity = 0.2;
                    }

                    // Allow dragging to pan across the screen without selecting text
                    container.style.cursor = 'grabbing';
                }
            }
        }
    });

    // Pointer Move (Drag)
    window.addEventListener('pointermove', (event) => {
        // Don't process mouse data when not on the home page
        if (!isHomeActive()) return;

        const rect = container.getBoundingClientRect();

        // Update Bloom Targets
        if (heroGradient) {
            const rawX = ((event.clientX - rect.left) / rect.width) * 100;
            const rawY = ((event.clientY - rect.top) / rect.height) * 100;
            targetLeftX = Math.min(rawX, 45);
            targetRightX = Math.max(rawX, 55);
            targetY = Math.max(0, Math.min(rawY, 100)); // Clamp to 0-100%
        }

        if (!draggedCube) {
            // Check for hover to change cursor to open hand
            const hits = getIntersects(event);
            if (hits.length > 0) {
                container.style.cursor = 'grab';
            } else {
                container.style.cursor = 'default';
            }
            return;
        }

        // If we are dragging, continuously update our invisible mouse body's position
        // so the constraint pulls the block along with it
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersect = raycaster.ray.intersectPlane(dropPlane, planeIntersect);

        if (intersect) {
            // Apply our saved offset so the block doesn't snap its center directly to the mouse
            mousePhysicsBody.position.set(
                planeIntersect.x + grabOffset.x,
                planeIntersect.y + grabOffset.y,
                planeIntersect.z + grabOffset.z
            );

            // Wake up the dragged block just in case it fell asleep
            draggedCube.body.wakeUp();
        }
    });

    // Pointer Up (Release)
    window.addEventListener('pointerup', () => {
        // Always release any active drag constraint to avoid orphaned physics bodies,
        // even if the user navigated away from home mid-drag.
        if (dragConstraint) {
            if (draggedCube) {
                // Restore its ability to spin freely based on collisions
                draggedCube.body.fixedRotation = false;
                draggedCube.body.updateMassProperties();
            }

            // Remove the link holding the block and our mouse together
            world.removeConstraint(dragConstraint);
            dragConstraint = null;
            draggedCube = null;
            container.style.cursor = 'default';

            // Only reset bloom opacities when on the home page
            if (isHomeActive()) {
                targetLeftOpacity = 0.5;
                targetRightOpacity = 0.5;
            }
        }
    });

    // --- TRANSFORMATION LOGIC ---
    let hasExploded = false;

    function checkStacking() {
        if (hasExploded) return;

        // Find all big blocks
        const bigBlocks = cubes.filter(c => !c.isSmall);
        if (bigBlocks.length !== 8) return; // Only process if we have exactly 8 big blocks

        // If dragging, don't explode yet (it crashes if we delete constraints mid-drag)
        if (draggedCube) return;

        let minX = Infinity, maxX = -Infinity;
        let maxVelocity = 0;

        for (let i = 0; i < bigBlocks.length; i++) {
            const p = bigBlocks[i].body.position;
            const v = bigBlocks[i].body.velocity;
            const angV = bigBlocks[i].body.angularVelocity;

            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;

            const speed = v.lengthSquared();
            if (speed > maxVelocity) maxVelocity = speed;
            const angSpeed = angV.lengthSquared();
            if (angSpeed > maxVelocity) maxVelocity = angSpeed;
        }

        // If they form a rough vertical column (X variation < boxSize * 0.8) and are sleeping/resting
        if (maxX - minX < boxSize * 0.8 && maxVelocity < 0.1) {
            explodeBlocks(bigBlocks);
        }
    }

    function explodeBlocks(blocksToExplode) {
        hasExploded = true;

        for (let i = 0; i < blocksToExplode.length; i++) {
            const oldC = blocksToExplode[i];
            const pos = oldC.body.position;

            // Remove from Three and Cannon
            scene.remove(oldC.mesh);
            world.remove(oldC.body);

            // Remove from our tracker array
            const index = cubes.indexOf(oldC);
            if (index > -1) cubes.splice(index, 1);

            // Spawn 4 small blocks exactly slightly offset around the original block's position
            const offset = boxSize / 4;
            createBlock(pos.x - offset, pos.y + offset, pos.z, true);
            createBlock(pos.x + offset, pos.y + offset, pos.z, true);
            createBlock(pos.x - offset, pos.y - offset, pos.z, true);
            createBlock(pos.x + offset, pos.y - offset, pos.z, true);
        }
    }

    // Resize helper — called whenever the container may have changed size
    function handleResize() {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Standard window resize
    window.addEventListener('resize', handleResize);

    // Sidebar toggle animates the container width over 0.3s.
    // Run handleResize on every rAF frame for the duration of that transition
    // so the canvas and camera track the container width smoothly in real time.
    let resizeRafId = null;

    function startSmoothResize() {
        if (resizeRafId) return; // already running
        function loop() {
            handleResize();
            resizeRafId = requestAnimationFrame(loop);
        }
        resizeRafId = requestAnimationFrame(loop);
    }

    function stopSmoothResize() {
        if (resizeRafId) {
            cancelAnimationFrame(resizeRafId);
            resizeRafId = null;
        }
        // One final sync to land exactly on the settled size
        handleResize();
    }

    // When the getting-started section transitions from d-none to visible,
    // the container goes from 0 dimensions to real ones — resize immediately.
    if (gettingStartedSection) {
        const sectionObserver = new MutationObserver(() => {
            if (!gettingStartedSection.classList.contains('d-none')) {
                requestAnimationFrame(() => handleResize());
            }
        });
        sectionObserver.observe(gettingStartedSection, { attributes: true, attributeFilter: ['class'] });
    }

    const pageContentWrapper = document.getElementById('page-content-wrapper');
    if (pageContentWrapper) {
        pageContentWrapper.addEventListener('transitionstart', (e) => {
            if (e.propertyName === 'width') startSmoothResize();
        });
        pageContentWrapper.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'width') stopSmoothResize();
        });
        // Safety net: cancel if transition is interrupted (e.g. rapid toggles)
        pageContentWrapper.addEventListener('transitioncancel', (e) => {
            if (e.propertyName === 'width') stopSmoothResize();
        });
    }

    // --- ANIMATION RENDER LOOP ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        // Lerp Blooms — only update CSS vars when home page is active
        if (heroGradient && isHomeActive()) {
            const ease = 0.15;
            currentLeftX += (targetLeftX - currentLeftX) * ease;
            currentRightX += (targetRightX - currentRightX) * ease;
            currentY += (targetY - currentY) * ease;

            // Lerp bloom opacities
            currentLeftOpacity += (targetLeftOpacity - currentLeftOpacity) * ease;
            currentRightOpacity += (targetRightOpacity - currentRightOpacity) * ease;

            heroGradient.style.setProperty('--mouse-y', `${currentY}%`);
            heroGradient.style.setProperty('--left-x', `${currentLeftX}%`);
            heroGradient.style.setProperty('--right-x', `${currentRightX}%`);
            heroGradient.style.setProperty('--left-opacity', currentLeftOpacity);
            heroGradient.style.setProperty('--right-opacity', currentRightOpacity);
        }

        const dt = Math.min(clock.getDelta(), 0.1); // prevent massive jumps if tab suspended
        // Step the physics world
        world.step(1 / 60, dt, 3);

        // Sync visual meshes with the physics bodies
        for (let i = 0; i < cubes.length; i++) {
            cubes[i].mesh.position.copy(cubes[i].body.position);
            cubes[i].mesh.quaternion.copy(cubes[i].body.quaternion);
        }

        // Check for success state
        checkStacking();

        renderer.render(scene, camera);
    }

    animate();
};
document.addEventListener('DOMContentLoaded', window.initHero3D);
