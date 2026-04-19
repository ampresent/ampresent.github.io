/**
 * quest-anim.js — Quest completion celebration effects
 */
const QuestAnim = (() => {
  let scene;
  const activeAnims = [];

  function init(_scene) {
    scene = _scene;
  }

  function celebrate(questName) {
    const camera = Engine.getCamera();
    const pos = camera.position.clone();
    pos.y += 1;

    // Burst of particles
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.OctahedronGeometry(0.08, 0);
      const colors = [0xffd700, 0xe8c87a, 0xffaa44, 0xff6644];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1,
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI - Math.PI / 2;
      const speed = 2 + Math.random() * 3;
      p.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elev) * speed,
          Math.sin(elev) * speed + 2,
          Math.sin(angle) * Math.cos(elev) * speed
        ),
        life: 0,
        maxLife: 1 + Math.random() * 0.5,
      };

      scene.add(p);
      activeAnims.push(p);
    }

    // Flash
    ScreenFX.flash('rgba(255,215,0,0.15)', 400);
    AudioSystem.playSFX('quest');
    Notify.success(`🎉 任务完成: ${questName}`);
  }

  function update(delta) {
    for (let i = activeAnims.length - 1; i >= 0; i--) {
      const p = activeAnims[i];
      p.userData.life += delta;

      if (p.userData.life >= p.userData.maxLife) {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        activeAnims.splice(i, 1);
        continue;
      }

      p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
      p.userData.velocity.y -= delta * 5;
      p.rotation.x += delta * 3;
      p.rotation.z += delta * 2;

      const ratio = p.userData.life / p.userData.maxLife;
      p.material.opacity = 1 - ratio;
      p.scale.multiplyScalar(0.99);
    }
  }

  return { init, celebrate, update };
})();
