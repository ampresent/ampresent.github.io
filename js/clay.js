/**
 * clay.js — Clay molding and crafting system
 */
const ClaySystem = (() => {
  let scene;
  const clayInventory = [];
  const craftedAssistants = [];
  let currentClayAmount = 0;
  let activeMold = null;

  const ASSISTANT_TYPES = {
    fire: {
      name: '炎灵助手',
      emoji: '🔥',
      color: 0xff4422,
      emissive: 0xff2200,
      description: '忠诚的火焰助手，能熔炼矿石、提供温暖和照明',
      abilities: ['熔炼', '照明', '取暖'],
    },
    water: {
      name: '水灵助手',
      emoji: '💧',
      color: 0x2288ff,
      emissive: 0x0044aa,
      description: '柔和的水流助手，能灌溉植物、净化物质',
      abilities: ['灌溉', '净化', '治疗'],
    },
    wind: {
      name: '风灵助手',
      emoji: '🌪️',
      color: 0x88ccff,
      emissive: 0x4488aa,
      description: '自由的风暴助手，能飞行侦察、搬运重物',
      abilities: ['飞行', '搬运', '侦察'],
    },
    life: {
      name: '绿灵助手',
      emoji: '🌿',
      color: 0x44cc66,
      emissive: 0x228844,
      description: '温柔的生命助手，能培育植物、看护家园',
      abilities: ['培育', '看护', '生长'],
    },
  };

  function init(_scene) {
    scene = _scene;
  }

  function addClay(amount) {
    currentClayAmount += amount;
    UI.updateMana(currentClayAmount);
    UI.notify(`获得黏土 +${amount} ✨ (总计: ${currentClayAmount})`);
  }

  function getClayAmount() {
    return currentClayAmount;
  }

  function canCraft() {
    return currentClayAmount >= 10;
  }

  function craftAssistant(spellType) {
    if (!canCraft()) {
      UI.notify('黏土不足！需要至少 10 单位黏土');
      return null;
    }

    const template = ASSISTANT_TYPES[spellType];
    if (!template) {
      UI.notify('未知的魔法类型');
      return null;
    }

    currentClayAmount -= 10;

    // Create the assistant mesh
    const assistant = createAssistantMesh(template, spellType);
    const camera = Engine.getCamera();
    assistant.position.copy(camera.position);
    assistant.position.y -= 0.5;
    assistant.position.add(Engine.getCameraForward().multiplyScalar(3));

    scene.add(assistant);
    craftedAssistants.push(assistant);

    UI.updateMana(currentClayAmount);
    UI.notify(`🎉 成功创造: ${template.name}！`);
    UI.showDialog(template.emoji, template.name, template.description);

    // Spawn animation
    assistant.scale.set(0, 0, 0);
    assistant.userData.spawnTime = performance.now() / 1000;
    assistant.userData.spawning = true;

    return assistant;
  }

  function createAssistantMesh(template, type) {
    const group = new THREE.Group();

    // Body - slightly squished sphere
    const bodyGeo = new THREE.SphereGeometry(0.5, 12, 8);
    bodyGeo.scale(1, 0.85, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: template.color,
      emissive: template.emissive,
      emissiveIntensity: 0.2,
      roughness: 0.6,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 0.1, 0.4);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 0.1, 0.4);
    group.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.15, 0.1, 0.48);
    group.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.15, 0.1, 0.48);
    group.add(rightPupil);

    // Element-specific features
    if (type === 'fire') {
      // Flame hat
      const flameGeo = new THREE.ConeGeometry(0.2, 0.5, 5);
      const flameMat = new THREE.MeshStandardMaterial({
        color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8,
        transparent: true, opacity: 0.8,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0.6, 0);
      group.add(flame);
    } else if (type === 'water') {
      // Water bubble crown
      for (let i = 0; i < 5; i++) {
        const bubbleGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 8, 8);
        const bubbleMat = new THREE.MeshStandardMaterial({
          color: 0x88ccff, emissive: 0x4488cc, emissiveIntensity: 0.3,
          transparent: true, opacity: 0.6,
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        const angle = (i / 5) * Math.PI * 2;
        bubble.position.set(Math.cos(angle) * 0.3, 0.5 + Math.random() * 0.2, Math.sin(angle) * 0.3);
        group.add(bubble);
      }
    } else if (type === 'wind') {
      // Swirl rings
      const ringGeo = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xaaddff, emissive: 0x6699cc, emissiveIntensity: 0.4,
        transparent: true, opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.3;
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    } else if (type === 'life') {
      // Leaf ears
      const leafGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x44cc66, emissive: 0x228844, emissiveIntensity: 0.3,
      });
      const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
      leftLeaf.position.set(-0.35, 0.15, 0);
      leftLeaf.rotation.z = 0.5;
      group.add(leftLeaf);

      const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
      rightLeaf.position.set(0.35, 0.15, 0);
      rightLeaf.rotation.z = -0.5;
      group.add(rightLeaf);
    }

    // Ground glow
    const glowGeo = new THREE.CircleGeometry(0.6, 16);
    const glowMat = new THREE.MeshStandardMaterial({
      color: template.color,
      emissive: template.emissive,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.42;
    group.add(glow);

    group.userData.type = 'assistant';
    group.userData.assistantType = type;
    group.userData.template = template;
    group.userData.floatOffset = Math.random() * Math.PI * 2;
    group.userData.interactable = true;

    return group;
  }

  function update(time, delta) {
    // Animate crafted assistants
    craftedAssistants.forEach(a => {
      if (a.userData.spawning) {
        const elapsed = time - a.userData.spawnTime;
        if (elapsed < 1.0) {
          const t = elapsed;
          const scale = t < 0.6
            ? (t / 0.6) * 1.2
            : 1.2 - (t - 0.6) / 0.4 * 0.2;
          a.scale.set(scale, scale, scale);
        } else {
          a.scale.set(1, 1, 1);
          a.userData.spawning = false;
        }
      }

      // Hover animation
      const baseY = a.position.y;
      a.children[0].position.y = Math.sin(time * 2 + a.userData.floatOffset) * 0.05;

      // Rotate to face player sometimes
      const camera = Engine.getCamera();
      const toPlayer = new THREE.Vector3().subVectors(camera.position, a.position);
      toPlayer.y = 0;
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      a.rotation.y = THREE.MathUtils.lerp(a.rotation.y, targetAngle, 0.02);
    });
  }

  function getAssistants() {
    return craftedAssistants;
  }

  return {
    init, addClay, getClayAmount, canCraft, craftAssistant, update, getAssistants,
    ASSISTANT_TYPES,
  };
})();
