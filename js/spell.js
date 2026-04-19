/**
 * spell.js — Spell casting visual effects and system
 */
const SpellSystem = (() => {
  let scene;
  const activeParticles = [];
  let currentSpell = 'sculpt';

  const SPELL_COLORS = {
    sculpt: 0xc87a4a,
    fire: 0xff4422,
    water: 0x2288ff,
    wind: 0x88ccff,
    life: 0x44cc66,
  };

  function init(_scene) {
    scene = _scene;
  }

  function setSpell(type) {
    currentSpell = type;
  }

  function getCurrentSpell() {
    return currentSpell;
  }

  function castAt(position) {
    const color = SPELL_COLORS[currentSpell] || 0xffffff;
    const count = currentSpell === 'sculpt' ? 8 : 20;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geo, mat);
      particle.position.copy(position);

      // Random velocity
      const speed = 1 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const upSpeed = 1 + Math.random() * 2;
      particle.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        upSpeed,
        Math.sin(angle) * speed
      );
      particle.userData.life = 0;
      particle.userData.maxLife = 0.5 + Math.random() * 0.5;

      scene.add(particle);
      activeParticles.push(particle);
    }

    // Spell-specific effects
    if (currentSpell === 'fire') {
      createFirePillar(position);
    } else if (currentSpell === 'water') {
      createWaterRipple(position);
    } else if (currentSpell === 'wind') {
      createWindTornado(position);
    } else if (currentSpell === 'life') {
      createLifeBloom(position);
    }
  }

  function createFirePillar(pos) {
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff4400,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.9,
      });
      const flame = new THREE.Mesh(geo, mat);
      flame.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + i * 0.3,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      flame.userData.velocity = new THREE.Vector3(0, 2 + Math.random(), 0);
      flame.userData.life = 0;
      flame.userData.maxLife = 0.8;
      scene.add(flame);
      activeParticles.push(flame);
    }
  }

  function createWaterRipple(pos) {
    const geo = new THREE.RingGeometry(0.1, 0.3, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      emissive: 0x2266cc,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos);
    ring.position.y += 0.05;
    ring.rotation.x = -Math.PI / 2;
    ring.userData.velocity = new THREE.Vector3(0, 0, 0);
    ring.userData.life = 0;
    ring.userData.maxLife = 1.5;
    ring.userData.isRipple = true;
    scene.add(ring);
    activeParticles.push(ring);
  }

  function createWindTornado(pos) {
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.TetrahedronGeometry(0.06, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        emissive: 0x6699cc,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const shard = new THREE.Mesh(geo, mat);
      shard.position.copy(pos);
      const angle = (i / 15) * Math.PI * 2;
      const radius = 0.5 + Math.random();
      shard.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * radius,
        1 + Math.random() * 2,
        Math.sin(angle) * radius
      );
      shard.userData.life = 0;
      shard.userData.maxLife = 1.0;
      shard.userData.tornado = true;
      scene.add(shard);
      activeParticles.push(shard);
    }
  }

  function createLifeBloom(pos) {
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.TetrahedronGeometry(0.08, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x66ff88,
        emissive: 0x44cc66,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      });
      const petal = new THREE.Mesh(geo, mat);
      petal.position.copy(pos);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.5;
      petal.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * radius,
        0.5 + Math.random(),
        Math.sin(angle) * radius
      );
      petal.userData.life = 0;
      petal.userData.maxLife = 1.2;
      scene.add(petal);
      activeParticles.push(petal);
    }
  }

  function update(delta) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.userData.life += delta;

      if (p.userData.life >= p.userData.maxLife) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        activeParticles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.userData.life / p.userData.maxLife;

      if (p.userData.isRipple) {
        const scale = 1 + lifeRatio * 5;
        p.scale.set(scale, scale, 1);
        p.material.opacity = 0.8 * (1 - lifeRatio);
      } else {
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        p.userData.velocity.y -= delta * 2; // gravity
        p.material.opacity = 1 - lifeRatio;
        p.scale.multiplyScalar(1 - delta * 0.5);
      }

      if (p.userData.tornado) {
        const angle = p.userData.life * 5;
        p.rotation.x = angle;
        p.rotation.z = angle * 0.7;
      }
    }
  }

  return {
    init, setSpell, getCurrentSpell, castAt, update,
    SPELL_COLORS,
  };
})();
