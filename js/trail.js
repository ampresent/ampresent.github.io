/**
 * trail.js — Player movement trail particles
 */
const Trail = (() => {
  let scene;
  const particles = [];
  let lastPos = null;
  const MAX_PARTICLES = 30;
  let emitTimer = 0;

  function init(_scene) {
    scene = _scene;
  }

  function update(delta, playerPos, isMoving) {
    // Emit particles while moving
    if (isMoving) {
      emitTimer += delta;
      if (emitTimer > 0.05) {
        emitTimer = 0;
        emit(playerPos);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.userData.life += delta;

      if (p.userData.life >= p.userData.maxLife) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        particles.splice(i, 1);
        continue;
      }

      const ratio = p.userData.life / p.userData.maxLife;
      p.position.y += delta * 0.5;
      p.material.opacity = (1 - ratio) * 0.4;
      p.scale.multiplyScalar(0.98);
    }
  }

  function emit(pos) {
    if (particles.length >= MAX_PARTICLES) return;

    const spellType = SpellSystem.getCurrentSpell();
    const colors = {
      sculpt: 0xc87a4a,
      fire: 0xff6644,
      water: 0x4488ff,
      wind: 0x88ccff,
      life: 0x44cc66,
    };

    const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 4, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: colors[spellType] || 0xc87a4a,
      emissive: colors[spellType] || 0xc87a4a,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.4,
    });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(
      pos.x + (Math.random() - 0.5) * 0.3,
      pos.y - 1.5 + Math.random() * 0.2,
      pos.z + (Math.random() - 0.5) * 0.3
    );
    p.userData = { life: 0, maxLife: 0.5 + Math.random() * 0.3 };
    scene.add(p);
    particles.push(p);
  }

  return { init, update };
})();
