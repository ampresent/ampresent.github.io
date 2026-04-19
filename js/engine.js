/**
 * engine.js — Core game engine: renderer, camera, input, game loop
 */
const Engine = (() => {
  let scene, camera, renderer, clock;
  let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();
  let isLocked = false;
  let yaw = 0, pitch = 0;
  const MOVE_SPEED = 8.0;
  const MOUSE_SENSITIVITY = 0.002;

  const listeners = {};

  function init(canvas) {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1028);
    scene.fog = new THREE.FogExp2(0x1a1028, 0.015);

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 2, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    clock = new THREE.Clock();

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Input
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', () => {
      isLocked = document.pointerLockElement === canvas;
    });

    return { scene, camera, renderer };
  }

  function lockPointer(canvas) {
    canvas.requestPointerLock();
  }

  function onKeyDown(e) {
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyW': moveForward = true; break;
      case 'KeyS': moveBackward = true; break;
      case 'KeyA': moveLeft = true; break;
      case 'KeyD': moveRight = true; break;
      case 'Space': emit('space'); break;
      case 'KeyE': emit('interact'); break;
      case 'Digit1': emit('tool', 'sculpt'); break;
      case 'Digit2': emit('tool', 'fire'); break;
      case 'Digit3': emit('tool', 'water'); break;
      case 'Digit4': emit('tool', 'wind'); break;
      case 'Digit5': emit('tool', 'life'); break;
      case 'Escape': emit('escape'); break;
      case 'Tab': e.preventDefault(); emit('craft'); break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': moveForward = false; break;
      case 'KeyS': moveBackward = false; break;
      case 'KeyA': moveLeft = false; break;
      case 'KeyD': moveRight = false; break;
    }
  }

  function onMouseMove(e) {
    if (!isLocked) return;
    yaw -= e.movementX * MOUSE_SENSITIVITY;
    pitch -= e.movementY * MOUSE_SENSITIVITY;
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
  }

  function onClick() {
    if (isLocked) emit('click');
  }

  function update(delta) {
    if (!isLocked) return;

    // Movement
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * MOVE_SPEED * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * MOVE_SPEED * delta;

    // Apply movement relative to camera yaw
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    camera.position.x += (-velocity.x * cosY - velocity.z * sinY);
    camera.position.z += (velocity.x * sinY - velocity.z * cosY);

    // Ground clamp
    const groundY = World.getGroundHeight(camera.position.x, camera.position.z);
    camera.position.y = groundY + 2;

    // Camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  // Simple event system
  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function emit(event, ...args) {
    (listeners[event] || []).forEach(fn => fn(...args));
  }

  function getCameraForward() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    return dir;
  }

  function getRaycastTarget(maxDist = 15) {
    const origin = camera.position.clone();
    const dir = getCameraForward();
    const raycaster = new THREE.Raycaster(origin, dir, 0, maxDist);
    raycaster.camera = camera;
    const intersects = raycaster.intersectObjects(scene.children, true);
    return intersects.length > 0 ? intersects[0] : null;
  }

  return {
    init, update, lockPointer, on, emit,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getClock: () => clock,
    getCameraForward,
    getRaycastTarget,
    isLocked: () => isLocked,
  };
})();
