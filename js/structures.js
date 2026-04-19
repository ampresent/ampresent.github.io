/**
 * structures.js — Buildings and structures in the world (with 3D model support)
 */
const Structures = (() => {
  let scene;
  const MODEL_BASE = 'models/';

  const TREE_MODELS = [
    'tree_default.glb', 'tree_oak.glb', 'tree_simple.glb',
    'tree_small.glb', 'tree_tall.glb', 'tree_detailed.glb',
    'tree_pineDefaultA.glb', 'tree_pineRoundA.glb',
  ];
  const FLOWER_MODELS = ['flower_purpleA.glb', 'flower_redA.glb', 'flower_yellowA.glb'];
  const MUSHROOM_MODELS = ['mushroom_red.glb', 'mushroom_tan.glb'];
  const ROCK_MODELS = ['rock_largeA.glb', 'rock_smallA.glb', 'rock_tallA.glb'];
  const GRASS_MODELS = ['grass.glb', 'grass_large.glb'];
  const BUSH_MODELS = ['plant_bush.glb', 'plant_bushLarge.glb'];
  const STUMP_MODELS = ['stump_round.glb', 'stump_old.glb'];
  const STONE_MODELS = ['stone_smallA.glb', 'stone_largeA.glb'];

  async function init(_scene) {
    scene = _scene;
    createWorkshop();
    createTownCenter();
    createFences();
    await createTreesFromModels();
    await createEnvironmentModels();
    createMushrooms(); // fallback procedural mushrooms as accent
  }

  async function placeModel(filename, x, z, scale, yOff) {
    try {
      const model = await ModelLoader.load(MODEL_BASE + filename);
      const y = World.getGroundHeight(x, z);
      model.position.set(x, y + (yOff || 0), z);
      model.scale.multiplyScalar(scale || 1);
      model.castShadow = true;
      model.receiveShadow = true;
      // Enable shadows on all child meshes
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      return model;
    } catch (e) {
      console.warn('Failed to load model:', filename, e);
      return null;
    }
  }

  function createWorkshop() {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    // Floor
    const floorGeo = new THREE.BoxGeometry(6, 0.2, 5);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9, flatShading: true });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.1; floor.receiveShadow = true;
    group.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.85, flatShading: true });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.3), wallMat);
    backWall.position.set(0, 1.7, -2.5); backWall.castShadow = true;
    group.add(backWall);

    const sideGeo = new THREE.BoxGeometry(0.3, 3, 5);
    const leftWall = new THREE.Mesh(sideGeo, wallMat);
    leftWall.position.set(-3, 1.7, 0); leftWall.castShadow = true;
    group.add(leftWall);
    const rightWall = new THREE.Mesh(sideGeo, wallMat);
    rightWall.position.set(3, 1.7, 0); rightWall.castShadow = true;
    group.add(rightWall);

    // Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a4a2a, roughness: 0.8, flatShading: true });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2, 4), roofMat);
    roof.position.set(0, 4, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    group.add(roof);

    // Workbench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x6a5030, roughness: 0.85 }));
    bench.position.set(0, 0.6, -1.5); bench.castShadow = true;
    group.add(bench);

    // Clay pots
    for (let i = -1; i <= 1; i++) {
      const colors = [0xc87a4a, 0x5a8aaa, 0x6aaa5a];
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: colors[i + 1], roughness: 0.7 }));
      pot.position.set(i * 0.8, 1.1, -1.5); pot.castShadow = true;
      group.add(pot);
    }

    // Door frame
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 }));
    door.position.set(0, 1.45, 2.5);
    group.add(door);

    // Lantern
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff8800, emissiveIntensity: 0.8 }));
    lantern.position.set(0, 3, 2.6);
    group.add(lantern);
    const lanternLight = new THREE.PointLight(0xffaa44, 0.8, 8);
    lanternLight.position.copy(lantern.position);
    group.add(lanternLight);

    // Sign (sprite)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256; signCanvas.height = 64;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#e8c87a'; ctx.textAlign = 'center';
    ctx.fillText('\uD83E\uDDF1 黏土工坊', 128, 42);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex }));
    sign.position.set(0, 3.8, 2.6); sign.scale.set(2, 0.5, 1);
    group.add(sign);

    scene.add(group);
  }

  function createTownCenter() {
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9, flatShading: true });
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.1, 24), plazaMat);
    plaza.position.set(0, 0.05, 0); plaza.receiveShadow = true;
    scene.add(plaza);

    const altarMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a, roughness: 0.7, metalness: 0.2, flatShading: true });
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 1.5, 6), altarMat);
    altar.position.set(0, 0.8, 0); altar.castShadow = true;
    altar.userData.type = 'altar';
    scene.add(altar);

    const runeMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x4466cc, emissiveIntensity: 0.5, transparent: true, opacity: 0.4 });
    const rune = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 24), runeMat);
    rune.position.set(0, 1.6, 0); rune.rotation.x = Math.PI / 2;
    rune.userData.type = 'runeRing';
    scene.add(rune);
  }

  function createFences() {
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9, flatShading: true });
    [[-5,0,4],[-5,0,0],[-5,0,-4],[5,0,4],[5,0,0],[5,0,-4]].forEach(([x,,z]) => {
      const y = World.getGroundHeight(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.5, 6), fenceMat);
      post.position.set(x, y + 0.75, z); post.castShadow = true;
      scene.add(post);
    });
  }

  async function createTreesFromModels() {
    const treePositions = [
      [-10, -8], [12, -6], [-8, 12], [15, 8], [-18, -3],
      [20, -12], [-14, 16], [7, -15], [-22, 10], [18, 18],
      [-6, -18], [10, 14], [-16, -14], [22, 4], [-11, 20],
      [-25, -15], [25, 12], [-20, 22], [14, -22], [-28, 5],
      [8, 25], [-12, -25], [22, -8], [-8, -22], [16, -16],
    ];

    for (let i = 0; i < treePositions.length; i++) {
      const [x, z] = treePositions[i];
      const model = TREE_MODELS[i % TREE_MODELS.length];
      const scale = 0.8 + Math.random() * 0.8;
      await placeModel(model, x, z, scale, 0);
    }
  }

  async function createEnvironmentModels() {
    // Flowers scattered around
    const flowerCount = 40;
    for (let i = 0; i < flowerCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 30;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.sqrt(x*x + z*z) < 5) continue;
      const model = FLOWER_MODELS[i % FLOWER_MODELS.length];
      await placeModel(model, x, z, 0.6 + Math.random() * 0.4, 0);
    }

    // Grass tufts
    const grassCount = 50;
    for (let i = 0; i < grassCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      if (Math.sqrt(x*x + z*z) < 4) continue;
      const model = GRASS_MODELS[i % GRASS_MODELS.length];
      await placeModel(model, x, z, 0.5 + Math.random() * 0.5, 0);
    }

    // Rocks
    const rockCount = 20;
    for (let i = 0; i < rockCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 35;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const model = ROCK_MODELS[i % ROCK_MODELS.length];
      await placeModel(model, x, z, 0.8 + Math.random() * 1.5, 0);
    }

    // Bushes
    const bushCount = 25;
    for (let i = 0; i < bushCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * 28;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const model = BUSH_MODELS[i % BUSH_MODELS.length];
      await placeModel(model, x, z, 0.7 + Math.random() * 0.6, 0);
    }

    // Stumps (less common)
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 25;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const model = STUMP_MODELS[i % STUMP_MODELS.length];
      await placeModel(model, x, z, 0.6 + Math.random() * 0.5, 0);
    }

    // Scattered stones
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 55;
      const z = (Math.random() - 0.5) * 55;
      const model = STONE_MODELS[i % STONE_MODELS.length];
      await placeModel(model, x, z, 0.5 + Math.random() * 1.0, 0);
    }

    // Place obelisk statue as landmark
    await placeModel('statue_obelisk.glb', 15, -15, 1.5, 0);
    await placeModel('statue_obelisk.glb', -18, 12, 1.2, 0);

    // Campfire near workshop
    await placeModel('campfire_stones.glb', -4, 3, 1.0, 0);

    // Tent for adventurer
    await placeModel('tent_detailedOpen.glb', 8, -5, 1.0, 0);

    // Pots near workshop
    await placeModel('pot_large.glb', -3.5, 3.5, 0.8, 0);
    await placeModel('pot_large.glb', 3.5, -2, 0.6, 0);
  }

  function createMushrooms() {
    // Keep some procedural glowing mushrooms as magical accent
    const colors = [0xff6688, 0x88aaff, 0xffaa44, 0xaa88ff, 0x44ffaa];
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      if (Math.sqrt(x * x + z * z) < 8) continue;
      const y = World.getGroundHeight(x, z);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.1 + Math.random() * 0.2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.3, size * 0.4, size, 6),
        new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.8 }));
      stem.position.set(x, y + size / 2, z); scene.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(size * 0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.5 }));
      cap.position.set(x, y + size, z); scene.add(cap);
    }
  }

  return { init };
})();
