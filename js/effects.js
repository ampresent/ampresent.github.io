/**
 * effects.js — Ambient world particle effects
 */
const Effects = (() => {
  let scene;
  const fireflies = [];
  const dustParticles = [];
  const workshopSparks = [];

  function init(_scene) {
    scene = _scene;
    createFireflies();
    createDustMotes();
    createWorkshopSparks();
  }

  function createFireflies() {
    for (let i = 0; i < 40; i++) {
      const geo = new THREE.SphereGeometry(0.03, 4, 4);
      const colors = [0xffee44, 0x88ff66, 0xffaa44, 0x44ffcc];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8,
      });
      const ff = new THREE.Mesh(geo, mat);

      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const y = 1 + Math.random() * 4;
      ff.position.set(x, y, z);

      ff.userData = {
        basePos: ff.position.clone(),
        offset: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        radius: 1 + Math.random() * 2,
        vertSpeed: 0.2 + Math.random() * 0.3,
      };

      scene.add(ff);
      fireflies.push(ff);
    }
  }

  function createDustMotes() {
    const geo = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const brightness = 0.3 + Math.random() * 0.4;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness * 0.7;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });

    const dust = new THREE.Points(geo, mat);
    dust.userData.type = 'dust';
    scene.add(dust);
  }

  function createWorkshopSparks() {
    // Floating runes near workshop
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.OctahedronGeometry(0.06, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xe8c87a,
        emissive: 0xc87a4a,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
      });
      const spark = new THREE.Mesh(geo, mat);

      const angle = (i / 6) * Math.PI * 2;
      spark.position.set(
        Math.cos(angle) * 3,
        1.5 + Math.random() * 2,
        Math.sin(angle) * 2
      );

      spark.userData = {
        angle,
        radius: 3,
        height: 1.5 + Math.random() * 0.5,
        speed: 0.3 + Math.random() * 0.2,
        vertOffset: Math.random() * Math.PI * 2,
      };

      scene.add(spark);
      workshopSparks.push(spark);
    }
  }

  function update(time) {
    // Fireflies
    fireflies.forEach(ff => {
      const d = ff.userData;
      ff.position.x = d.basePos.x + Math.sin(time * d.speed + d.offset) * d.radius;
      ff.position.y = d.basePos.y + Math.sin(time * d.vertSpeed + d.offset * 2) * 0.5;
      ff.position.z = d.basePos.z + Math.cos(time * d.speed + d.offset * 1.5) * d.radius;

      // Pulse glow
      ff.material.emissiveIntensity = 0.8 + Math.sin(time * 3 + d.offset) * 0.7;
      ff.material.opacity = 0.4 + Math.sin(time * 2 + d.offset) * 0.4;
    });

    // Dust motes - gentle drift
    scene.children.forEach(obj => {
      if (obj.userData.type === 'dust') {
        const pos = obj.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i);
          y += Math.sin(time * 0.5 + i) * 0.002;
          if (y > 10) y = 0.5;
          pos.setY(i, y);

          let x = pos.getX(i);
          x += Math.sin(time * 0.3 + i * 0.5) * 0.001;
          pos.setX(i, x);
        }
        pos.needsUpdate = true;
      }
    });

    // Workshop sparks orbit
    workshopSparks.forEach(spark => {
      const d = spark.userData;
      spark.position.x = Math.cos(time * d.speed + d.angle) * d.radius;
      spark.position.y = d.height + Math.sin(time * 1.5 + d.vertOffset) * 0.3;
      spark.position.z = Math.sin(time * d.speed + d.angle) * d.radius * 0.7;
      spark.rotation.x = time * 2;
      spark.rotation.y = time * 3;
    });
  }

  return { init, update };
})();
