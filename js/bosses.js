/**
 * bosses.js — Boss encounters
 */
const Bosses = (() => {
  let scene;
  let activeBoss = null;
  const bossSpawnPoints = [
    { pos: [-25, -20], type: 'clayKing', requiredLevel: 5 },
    { pos: [22, 18], type: 'crystalDragon', requiredLevel: 8 },
  ];

  const BOSS_TYPES = {
    clayKing: {
      name: '黏土之王',
      emoji: '👑',
      title: '远古黏土的守护者',
      color: 0xc87a4a,
      emissive: 0xa05a2a,
      size: 1.5,
      hp: 200,
      speed: 1.2,
      damage: 20,
      xp: 150,
      phases: 3,
      desc: '沉睡千年的黏土之王，被你的到来惊醒。',
    },
    crystalDragon: {
      name: '水晶龙',
      emoji: '🐉',
      title: '魔力水晶的化身',
      color: 0xaa88ff,
      emissive: 0x8844cc,
      size: 2,
      hp: 500,
      speed: 2,
      damage: 30,
      xp: 500,
      phases: 4,
      desc: '由纯粹魔力水晶构成的巨龙，极度危险。',
    },
  };

  function init(_scene) {
    scene = _scene;
    // Create dormant boss markers
    bossSpawnPoints.forEach(bp => {
      const y = World.getGroundHeight(bp.pos[0], bp.pos[1]);

      // Altar
      const altarGeo = new THREE.CylinderGeometry(2, 2.5, 1, 8);
      const altarMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a5a, roughness: 0.8, metalness: 0.2, flatShading: true,
      });
      const altar = new THREE.Mesh(altarGeo, altarMat);
      altar.position.set(bp.pos[0], y + 0.5, bp.pos[1]);
      altar.castShadow = true;
      scene.add(altar);

      // Warning sign
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(40,10,10,0.7)';
      ctx.fillRect(0, 0, 256, 64);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#ff6644';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠ Lv.${bp.requiredLevel} Boss区`, 128, 40);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(bp.pos[0], y + 2.5, bp.pos[1]);
      sprite.scale.set(2.5, 0.6, 1);
      scene.add(sprite);

      // Red glow
      const light = new THREE.PointLight(0xff4444, 0.3, 8);
      light.position.set(bp.pos[0], y + 1, bp.pos[1]);
      scene.add(light);

      bp.altar = altar;
      bp.sprite = sprite;
      bp.light = light;
    });
  }

  function trySpawnBoss(playerPos) {
    if (activeBoss) return;

    bossSpawnPoints.forEach(bp => {
      if (activeBoss) return;
      const dist = Math.sqrt(
        (playerPos.x - bp.pos[0]) ** 2 +
        (playerPos.z - bp.pos[1]) ** 2
      );

      if (dist < 5 && Player.getLevel() >= bp.requiredLevel) {
        spawnBoss(bp);
      }
    });
  }

  function spawnBoss(bp) {
    const template = BOSS_TYPES[bp.type];
    Notify.warning(`⚠️ ${template.emoji} ${template.name} 苏醒了！`);

    const y = World.getGroundHeight(bp.pos[0], bp.pos[1]);
    const group = new THREE.Group();

    // Large body
    const bodyGeo = new THREE.SphereGeometry(template.size, 16, 12);
    bodyGeo.scale(1, 0.9, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: template.color,
      emissive: template.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Crown / horns
    if (bp.type === 'clayKing') {
      const crownGeo = new THREE.ConeGeometry(template.size * 0.5, template.size * 0.6, 5);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xcc9900, emissiveIntensity: 0.5,
      });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = template.size * 0.9;
      group.add(crown);
    } else {
      // Crystal spines
      for (let i = 0; i < 6; i++) {
        const spineGeo = new THREE.ConeGeometry(0.15, 0.8, 4);
        const spineMat = new THREE.MeshStandardMaterial({
          color: 0xcc99ff, emissive: 0xaa66cc, emissiveIntensity: 0.6,
          transparent: true, opacity: 0.8,
        });
        const spine = new THREE.Mesh(spineGeo, spineMat);
        const angle = (i / 6) * Math.PI * 2;
        spine.position.set(
          Math.cos(angle) * template.size * 0.7,
          template.size * 0.3,
          Math.sin(angle) * template.size * 0.7
        );
        spine.lookAt(group.position);
        group.add(spine);
      }
    }

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(template.size * 0.12, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xff0000, emissiveIntensity: 1,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-template.size * 0.3, template.size * 0.2, template.size * 0.75);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(template.size * 0.3, template.size * 0.2, template.size * 0.75);
    group.add(rightEye);

    // HP bar
    const hpBgGeo = new THREE.PlaneGeometry(template.size * 3, 0.15);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBg.position.y = template.size + 0.5;
    group.add(hpBg);

    const hpGeo = new THREE.PlaneGeometry(template.size * 3, 0.12);
    const hpMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const hpBar = new THREE.Mesh(hpGeo, hpMat);
    hpBar.position.y = template.size + 0.5;
    hpBar.position.z = 0.01;
    group.add(hpBar);

    group.position.set(bp.pos[0], y + template.size, bp.pos[1]);
    group.userData = {
      type: 'boss',
      template: { ...template },
      hp: template.hp,
      maxHp: template.hp,
      alive: true,
      phase: 1,
      attackCooldown: 0,
      floatOffset: 0,
    };

    scene.add(group);
    activeBoss = group;

    ScreenFX.flash('rgba(255,0,0,0.2)', 800);
    AudioSystem.playSFX('quest');
  }

  function damageBoss(amount) {
    if (!activeBoss || !activeBoss.userData.alive) return;

    activeBoss.userData.hp -= amount;
    const ratio = activeBoss.userData.hp / activeBoss.userData.maxHp;

    // Update HP bar
    const hpBar = activeBoss.children[activeBoss.children.length - 1];
    if (hpBar) {
      hpBar.scale.x = ratio;
      hpBar.material.color.setHex(ratio > 0.5 ? 0xff4444 : ratio > 0.25 ? 0xffaa44 : 0xff2200);
    }

    // Phase transitions
    const template = activeBoss.userData.template;
    const newPhase = Math.ceil((1 - ratio) * template.phases) + 1;
    if (newPhase > activeBoss.userData.phase) {
      activeBoss.userData.phase = newPhase;
      Notify.warning(`${template.emoji} ${template.name} 进入第${newPhase}阶段！`);
      ScreenFX.flash('rgba(255,100,0,0.15)', 400);
    }

    ScreenFX.flash('rgba(255,255,255,0.08)', 80);

    if (activeBoss.userData.hp <= 0) {
      defeatBoss();
    }
  }

  function defeatBoss() {
    if (!activeBoss) return;
    const template = activeBoss.userData.template;

    Notify.success(`🎉 击败了 ${template.emoji} ${template.name}！`);
    Player.addXP(template.xp);
    Inventory.add('crystals', 20);
    Inventory.add('clay', 50);

    // Special drops
    if (activeBoss.userData.template.name === '黏土之王') {
      Abilities.unlock('spellPower');
      Notify.quest('🏆 获得「黏土之王的祝福」—— 技能解锁！');
    } else {
      Abilities.unlock('rareHarvest');
      Notify.quest('🏆 获得「水晶龙的馈赠」—— 技能解锁！');
    }

    activeBoss.userData.alive = false;
    activeBoss.userData.deathTime = performance.now() / 1000;

    Achievements.complete('master_crafter');
  }

  function update(time, delta, playerPos) {
    if (!activeBoss) {
      trySpawnBoss(playerPos);
      return;
    }

    const ud = activeBoss.userData;
    if (!ud.alive) {
      const elapsed = time - ud.deathTime;
      if (elapsed < 1.5) {
        activeBoss.scale.multiplyScalar(0.97);
        activeBoss.position.y += 0.02;
        activeBoss.children.forEach(c => {
          if (c.material) c.material.opacity = Math.max(0, 1 - elapsed / 1.5);
        });
      } else {
        scene.remove(activeBoss);
        activeBoss = null;
      }
      return;
    }

    const template = ud.template;
    const dist = activeBoss.position.distanceTo(playerPos);

    // Face player
    const dir = new THREE.Vector3().subVectors(playerPos, activeBoss.position);
    dir.y = 0;
    activeBoss.rotation.y = Math.atan2(dir.x, dir.z);

    // Chase
    if (dist > 2 && dist < 25) {
      dir.normalize();
      activeBoss.position.add(dir.multiplyScalar(template.speed * delta));
      const gy = World.getGroundHeight(activeBoss.position.x, activeBoss.position.z);
      activeBoss.position.y = gy + template.size + Math.sin(time * 2) * 0.15;
    }

    // Attack
    if (dist < 3 && ud.attackCooldown <= 0) {
      ud.attackCooldown = 2;
      Player.takeDamage(template.damage);
      Notify.warning(`${template.emoji} ${template.name} 攻击了你！`);
    }
    if (ud.attackCooldown > 0) ud.attackCooldown -= delta;

    // Idle animation
    const body = activeBoss.children[0];
    if (body) {
      body.scale.y = 0.9 + Math.sin(time * 3) * 0.03;
    }
  }

  function getActiveBoss() { return activeBoss; }

  return { init, update, damageBoss, getActiveBoss, BOSS_TYPES };
})();
