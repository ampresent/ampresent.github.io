/**
 * secrets.js — Hidden areas, puzzles, easter eggs
 */
const Secrets = (() => {
  let scene;
  const secrets = [];
  const discovered = new Set();

  function init(_scene) {
    scene = _scene;
    createSecretAreas();
  }

  function createSecretAreas() {
    // Hidden treasure under waterfall
    createTreasure([20, 0.5, -13], 'waterfall_treasure', '瀑布宝藏');

    // Secret mushroom ring
    createMushroomRing([-18, 15], 'mushroom_ring', '蘑菇圈');

    // Floating crystal at highest point
    createFloatingCrystal([30, 12, -25], 'sky_crystal', '天空水晶');

    // Buried clay tablet
    createClayTablet([5, -22], 'ancient_tablet', '远古石板');

    // Hidden cave behind waterfall
    createHiddenCave([22, 3, -16], 'waterfall_cave', '瀑布洞穴');
  }

  function createTreasure(pos, id, name) {
    const y = World.getGroundHeight(pos[0], pos[2]);
    const geo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a6a3a, roughness: 0.7,
    });
    const chest = new THREE.Mesh(geo, mat);
    chest.position.set(pos[0], y + 0.2, pos[2]);
    chest.castShadow = true;
    chest.userData = { type: 'secret', secretId: id, name, interactable: true };
    scene.add(chest);

    // Gold glow
    const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xcc9900, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.2,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(chest.position);
    scene.add(glow);

    secrets.push({ id, name, mesh: chest, pos: chest.position.clone() });
  }

  function createMushroomRing(pos, id, name) {
    const y = World.getGroundHeight(pos[0], pos[1]);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 2;
      const x = pos[0] + Math.cos(angle) * r;
      const z = pos[1] + Math.sin(angle) * r;

      const capGeo = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const colors = [0xff6688, 0x88aaff, 0xffaa44, 0xaa88ff];
      const color = colors[i % colors.length];
      const capMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.4,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, y + 0.4, z);
      scene.add(cap);

      const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xddccaa });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, y + 0.15, z);
      scene.add(stem);
    }

    // Center altar stone
    const stoneGeo = new THREE.DodecahedronGeometry(0.3, 0);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x888899, emissive: 0x444466, emissiveIntensity: 0.2,
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(pos[0], y + 0.2, pos[1]);
    stone.userData = { type: 'secret', secretId: id, name, interactable: true };
    scene.add(stone);

    secrets.push({ id, name, mesh: stone, pos: stone.position.clone() });
  }

  function createFloatingCrystal(pos, id, name) {
    const geo = new THREE.OctahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffaaff, emissive: 0xcc66cc, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.8,
    });
    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.set(pos[0], pos[1], pos[2]);
    crystal.userData = {
      type: 'secret', secretId: id, name, interactable: true,
      floatOffset: 0,
    };
    scene.add(crystal);

    // Beam of light
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 12, 4);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xffccff, emissive: 0xff88ff, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.1,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos[0], pos[1] - 6, pos[2]);
    scene.add(beam);

    secrets.push({ id, name, mesh: crystal, pos: new THREE.Vector3(pos[0], pos[1], pos[2]) });
  }

  function createClayTablet(pos, id, name) {
    const y = World.getGroundHeight(pos[0], pos[1]);
    const geo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7a6a5a, roughness: 0.9, flatShading: true,
    });
    const tablet = new THREE.Mesh(geo, mat);
    tablet.position.set(pos[0], y + 0.1, pos[1]);
    tablet.rotation.x = -0.2;
    tablet.userData = { type: 'secret', secretId: id, name, interactable: true };
    scene.add(tablet);

    // Rune markings
    const runeGeo = new THREE.TorusGeometry(0.2, 0.02, 8, 16);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xe8c87a, emissive: 0xc87a4a, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.4,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(pos[0], y + 0.15, pos[1] + 0.05);
    scene.add(rune);

    secrets.push({ id, name, mesh: tablet, pos: tablet.position.clone() });
  }

  function createHiddenCave(pos, id, name) {
    const y = World.getGroundHeight(pos[0], pos[2]);
    // Cave mouth arch
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a5a, roughness: 0.85, flatShading: true,
    });

    const leftGeo = new THREE.BoxGeometry(0.5, 2.5, 0.5);
    const left = new THREE.Mesh(leftGeo, archMat);
    left.position.set(pos[0] - 1, y + 1.25, pos[2]);
    scene.add(left);

    const right = new THREE.Mesh(leftGeo, archMat);
    right.position.set(pos[0] + 1, y + 1.25, pos[2]);
    scene.add(right);

    const topGeo = new THREE.BoxGeometry(2.5, 0.4, 0.6);
    const top = new THREE.Mesh(topGeo, archMat);
    top.position.set(pos[0], y + 2.6, pos[2]);
    scene.add(top);

    // Dark interior
    const innerGeo = new THREE.PlaneGeometry(1.8, 2.3);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x0a0a12 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(pos[0], y + 1.2, pos[2] + 0.1);
    inner.userData = { type: 'secret', secretId: id, name, interactable: true };
    scene.add(inner);

    secrets.push({ id, name, mesh: inner, pos: new THREE.Vector3(pos[0], y, pos[2]) });
  }

  function discover(id) {
    if (discovered.has(id)) return;
    discovered.add(id);

    const secret = secrets.find(s => s.id === id);
    if (secret) {
      Notify.success(`🗺️ 发现隐藏地点: ${secret.name}！`);
      Inventory.add('crystals', 5);
      Player.addXP(20);
      AudioSystem.playSFX('quest');
    }
  }

  function update(time) {
    secrets.forEach(s => {
      if (s.mesh.userData.type === 'secret' && s.mesh.userData.floatOffset !== undefined) {
        s.mesh.position.y = s.pos.y + Math.sin(time * 1.5) * 0.3;
        s.mesh.rotation.y = time * 0.5;
      }
    });
  }

  function getSecrets() { return secrets; }
  function getDiscoveredCount() { return discovered.size; }

  return { init, discover, update, getSecrets, getDiscoveredCount };
})();
