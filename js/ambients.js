/**
 * ambients.js — Ambient creatures and world life
 */
const Ambients = (() => {
  let scene;
  const creatures = [];

  function init(_scene) {
    scene = _scene;
    spawnButterflies();
    spawnBirds();
    spawnFish();
  }

  function spawnButterflies() {
    for (let i = 0; i < 15; i++) {
      const group = new THREE.Group();
      const colors = [0xffaa44, 0xff6688, 0x88aaff, 0xaaffaa, 0xffccff];
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Wings (two planes)
      const wingGeo = new THREE.PlaneGeometry(0.15, 0.1);
      const wingMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.3,
        side: THREE.DoubleSide, transparent: true, opacity: 0.8,
      });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.x = -0.08;
      leftWing.userData.isWing = true;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
      rightWing.position.x = 0.08;
      rightWing.userData.isWing = true;
      group.add(rightWing);

      // Body
      const bodyGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      group.add(body);

      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const y = World.getGroundHeight(x, z) + 1 + Math.random() * 3;
      group.position.set(x, y, z);

      group.userData = {
        type: 'butterfly',
        basePos: group.position.clone(),
        speed: 0.3 + Math.random() * 0.5,
        radius: 1 + Math.random() * 2,
        wingPhase: Math.random() * Math.PI * 2,
      };

      scene.add(group);
      creatures.push(group);
    }
  }

  function spawnBirds() {
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group();

      // Body
      const bodyGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x555566, flatShading: true,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Wings
      const wingGeo = new THREE.PlaneGeometry(0.4, 0.1);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x444455, side: THREE.DoubleSide,
      });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.2, 0, 0);
      leftWing.userData.isWing = true;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.2, 0, 0);
      rightWing.userData.isWing = true;
      group.add(rightWing);

      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      group.position.set(
        Math.cos(angle) * dist,
        8 + Math.random() * 5,
        Math.sin(angle) * dist
      );

      group.userData = {
        type: 'bird',
        angle,
        dist,
        speed: 0.5 + Math.random() * 0.3,
        height: group.position.y,
        wingPhase: Math.random() * Math.PI * 2,
      };

      scene.add(group);
      creatures.push(group);
    }
  }

  function spawnFish() {
    // Fish near the pond
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.ConeGeometry(0.08, 0.25, 4);
      geo.rotateZ(Math.PI / 2);
      const colors = [0xff8844, 0x44aaff, 0xffcc44, 0x44ff88];
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.1,
      });
      const fish = new THREE.Mesh(geo, mat);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 4;
      fish.position.set(
        -12 + Math.cos(angle) * dist,
        -0.3,
        -5 + Math.sin(angle) * dist
      );

      fish.userData = {
        type: 'fish',
        angle,
        dist,
        speed: 0.3 + Math.random() * 0.4,
        centerX: -12,
        centerZ: -5,
      };

      scene.add(fish);
      creatures.push(fish);
    }
  }

  function update(time) {
    creatures.forEach(c => {
      const ud = c.userData;

      if (ud.type === 'butterfly') {
        c.position.x = ud.basePos.x + Math.sin(time * ud.speed + ud.radius) * ud.radius;
        c.position.y = ud.basePos.y + Math.sin(time * 1.5 + ud.radius) * 0.5;
        c.position.z = ud.basePos.z + Math.cos(time * ud.speed * 0.7 + ud.radius) * ud.radius;

        // Wing flap
        c.children.forEach(child => {
          if (child.userData.isWing) {
            const flap = Math.sin(time * 15 + ud.wingPhase);
            child.rotation.y = flap * 0.8;
          }
        });
      }

      if (ud.type === 'bird') {
        ud.angle += ud.speed * 0.01;
        c.position.x = Math.cos(ud.angle) * ud.dist;
        c.position.z = Math.sin(ud.angle) * ud.dist;
        c.position.y = ud.height + Math.sin(time * 0.5) * 0.5;
        c.rotation.y = ud.angle + Math.PI / 2;

        // Wing flap
        c.children.forEach(child => {
          if (child.userData.isWing) {
            const flap = Math.sin(time * 8 + ud.wingPhase);
            child.rotation.x = flap * 0.5;
          }
        });
      }

      if (ud.type === 'fish') {
        ud.angle += ud.speed * 0.02;
        c.position.x = ud.centerX + Math.cos(ud.angle) * ud.dist;
        c.position.z = ud.centerZ + Math.sin(ud.angle) * ud.dist;
        c.position.y = -0.3 + Math.sin(time * 3 + ud.angle) * 0.05;
        c.rotation.y = ud.angle + Math.PI / 2;
      }
    });
  }

  return { init, update };
})();
