/**
 * collectibles.js — Scattered exploration collectibles
 */
const Collectibles = (() => {
  let scene;
  const items = [];
  const collected = new Set();

  function init(_scene) {
    scene = _scene;
    spawnCollectibles();
  }

  function spawnCollectibles() {
    const types = [
      { id: 'ancient_scroll', name: '远古卷轴', emoji: '📜', color: 0xe8c87a, glow: 0xc87a4a },
      { id: 'magic_orb', name: '魔力宝珠', emoji: '🔮', color: 0xaa88ff, glow: 0x8844cc },
      { id: 'clay_shard', name: '黏土碎片', emoji: '💎', color: 0x44ccaa, glow: 0x228866 },
      { id: 'star_fragment', name: '星之碎片', emoji: '⭐', color: 0xffee88, glow: 0xccaa44 },
    ];

    // Spawn in a ring around the world
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 15 + Math.random() * 25;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const type = types[i % types.length];

      const geo = new THREE.OctahedronGeometry(0.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: type.color,
        emissive: type.glow,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const y = World.getGroundHeight(x, z);
      mesh.position.set(x, y + 1.2, z);
      mesh.userData.type = 'collectible';
      mesh.userData.itemType = type;
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      mesh.userData.id = `${type.id}_${i}`;

      // Glow ring
      const ringGeo = new THREE.TorusGeometry(0.4, 0.02, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({
        color: type.color,
        emissive: type.glow,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.3,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.8;
      mesh.add(ring);

      scene.add(mesh);
      items.push(mesh);
    }
  }

  function collect(item) {
    if (collected.has(item.userData.id)) return;
    collected.add(item.userData.id);

    const type = item.userData.itemType;
    Notify.success(`获得 ${type.emoji} ${type.name}`);

    // Add rewards
    Inventory.add('crystals', 1);
    if (type.id === 'clay_shard') Inventory.add('clay', 5);

    // Remove with animation
    item.userData.collecting = true;
    item.userData.collectStart = performance.now() / 1000;

    AudioSystem.playSFX('craft');
  }

  function update(time) {
    items.forEach(item => {
      if (collected.has(item.userData.id) && !item.userData.removing) {
        if (!item.userData.collecting) {
          // Already collected, hide
          item.visible = false;
          return;
        }
        // Collect animation
        const elapsed = time - item.userData.collectStart;
        if (elapsed < 0.5) {
          item.scale.multiplyScalar(1.05);
          item.position.y += 0.05;
          item.material.opacity = 1 - elapsed * 2;
        } else {
          scene.remove(item);
          item.userData.removing = true;
        }
        return;
      }

      // Float animation
      item.position.y += Math.sin(time * 2 + item.userData.floatOffset) * 0.002;
      item.rotation.y = time + item.userData.floatOffset;

      // Pulse glow
      item.material.emissiveIntensity = 0.3 + Math.sin(time * 3 + item.userData.floatOffset) * 0.2;
    });
  }

  function getItems() { return items; }
  function getCollectedCount() { return collected.size; }
  function getTotalCount() { return items.length; }

  return { init, collect, update, getItems, getCollectedCount, getTotalCount };
})();
