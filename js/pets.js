/**
 * pets.js — Pet/following companion system (beyond assistants)
 */
const Pets = (() => {
  let scene;
  const pets = [];

  const PET_TYPES = {
    clayBunny: {
      name: '黏土兔',
      emoji: '🐰',
      color: 0xddbbaa,
      size: 0.25,
      speed: 3,
      desc: '一只活泼的小兔子，会蹦蹦跳跳地跟着你',
    },
    crystalFox: {
      name: '水晶狐',
      emoji: '🦊',
      color: 0xffaa66,
      size: 0.3,
      speed: 4,
      desc: '由水晶构成的灵狐，尾尖闪烁着微光',
    },
    slime: {
      name: '魔法史莱姆',
      emoji: '🟢',
      color: 0x66cc88,
      size: 0.2,
      speed: 2,
      desc: '一团可爱的黏液生物',
    },
  };

  function init(_scene) {
    scene = _scene;
  }

  function adopt(typeId) {
    const template = PET_TYPES[typeId];
    if (!template) return;

    const camera = Engine.getCamera();
    const pet = createPetMesh(template, typeId);
    pet.position.copy(camera.position);
    pet.position.y -= 0.5;
    pet.position.x += (Math.random() - 0.5) * 2;
    pet.position.z += (Math.random() - 0.5) * 2;

    scene.add(pet);
    pets.push(pet);

    Notify.success(`🎉 ${template.emoji} ${template.name} 成为了你的伙伴！`);
    AudioSystem.playSFX('craft');
  }

  function createPetMesh(template, typeId) {
    const group = new THREE.Group();

    if (typeId === 'clayBunny') {
      // Body
      const bodyGeo = new THREE.SphereGeometry(template.size, 8, 6);
      bodyGeo.scale(1, 0.9, 1.1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.7 });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Head
      const headGeo = new THREE.SphereGeometry(template.size * 0.7, 8, 6);
      const head = new THREE.Mesh(headGeo, bodyMat.clone());
      head.position.set(0, template.size * 0.5, template.size * 0.6);
      group.add(head);

      // Ears
      const earGeo = new THREE.CapsuleGeometry(template.size * 0.12, template.size * 0.5, 4, 4);
      const leftEar = new THREE.Mesh(earGeo, bodyMat.clone());
      leftEar.position.set(-template.size * 0.25, template.size * 1.1, template.size * 0.5);
      leftEar.rotation.x = -0.2;
      group.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, bodyMat.clone());
      rightEar.position.set(template.size * 0.25, template.size * 1.1, template.size * 0.5);
      rightEar.rotation.x = -0.2;
      group.add(rightEar);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(template.size * 0.08, 6, 6);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-template.size * 0.15, template.size * 0.6, template.size * 1.2);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(template.size * 0.15, template.size * 0.6, template.size * 1.2);
      group.add(rightEye);
    } else if (typeId === 'crystalFox') {
      const bodyGeo = new THREE.SphereGeometry(template.size, 8, 6);
      bodyGeo.scale(1.2, 0.8, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: template.color, emissive: 0xcc6633, emissiveIntensity: 0.1, roughness: 0.4,
      });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Tail
      const tailGeo = new THREE.ConeGeometry(template.size * 0.2, template.size * 0.8, 6);
      const tailMat = new THREE.MeshStandardMaterial({
        color: 0xffcc88, emissive: 0xffaa44, emissiveIntensity: 0.3,
      });
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.set(0, template.size * 0.2, -template.size * 0.8);
      tail.rotation.x = 0.8;
      group.add(tail);
    } else {
      // Slime
      const bodyGeo = new THREE.SphereGeometry(template.size, 8, 6);
      bodyGeo.scale(1, 0.7, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: template.color, emissive: 0x44aa66, emissiveIntensity: 0.2,
        transparent: true, opacity: 0.7,
      });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(template.size * 0.15, 6, 6);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-template.size * 0.3, template.size * 0.2, template.size * 0.7);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(template.size * 0.3, template.size * 0.2, template.size * 0.7);
      group.add(rightEye);
    }

    group.userData = {
      type: 'pet',
      template,
      floatOffset: Math.random() * Math.PI * 2,
    };

    return group;
  }

  function update(time, delta) {
    const camera = Engine.getCamera();
    const playerPos = camera.position;

    pets.forEach((pet, idx) => {
      const ud = pet.userData;
      const dist = pet.position.distanceTo(playerPos);

      // Follow
      if (dist > 3 + idx) {
        const dir = new THREE.Vector3().subVectors(playerPos, pet.position).normalize();
        pet.position.add(dir.multiplyScalar(ud.template.speed * delta));

        // Face movement
        pet.rotation.y = Math.atan2(dir.x, dir.z);
      }

      // Ground clamp
      const gy = World.getGroundHeight(pet.position.x, pet.position.z);
      pet.position.y = gy + ud.template.size + Math.sin(time * 4 + ud.floatOffset) * 0.05;

      // Bounce animation
      const body = pet.children[0];
      if (body) {
        body.scale.y = 0.7 + Math.sin(time * 6 + ud.floatOffset) * 0.1;
      }
    });
  }

  function getPets() { return pets; }

  return { init, adopt, update, getPets, PET_TYPES };
})();
