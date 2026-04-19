/**
 * character.js — NPCs, dialog trees, quest system
 */
const Characters = (() => {
  let scene;
  const npcs = [];
  const quests = [];

  const NPC_DATA = {
    elder: {
      name: '老塑灵师 · 泥爷爷',
      emoji: '👴',
      color: 0xa0704a,
      position: [0, 0, -6],
      dialog: [
        {
          id: 'greeting',
          text: '欢迎来到泥灵界，年轻的塑灵师。我是泥爷爷，在这里捏了一辈子的黏土了。',
          next: 'intro',
        },
        {
          id: 'intro',
          text: '在这个世界里，万物皆可由黏土和魔法创造。你看到地上那些发光的黏土矿了吗？走过去按 E 键就能采集。',
          next: 'explain_magic',
        },
        {
          id: 'explain_magic',
          text: '采集到足够的黏土后，按 Tab 键打开工坊，选择一种魔法注入，就能创造出属于你的助手！',
          next: 'tips',
        },
        {
          id: 'tips',
          text: '火焰助手能照明和熔炼，水流助手能灌溉和治疗，风暴助手能飞行和搬运，生命助手能培育植物。选哪个都好，祝你好运！',
          next: null,
          action: 'start_quest',
        },
      ],
    },
    merchant: {
      name: '旅行商人 · 阿泥',
      emoji: '🧑‍🌾',
      color: 0x6a8a5a,
      position: [8, 0, 4],
      dialog: [
        {
          id: 'greeting',
          text: '嘿嘿，又一个新来的塑灵师！我是阿泥，走遍了泥灵界的每个角落。',
          next: 'world_lore',
        },
        {
          id: 'world_lore',
          text: '你听说了吗？泥灵界的深处，有一个远古的黏土巨人沉睡在那里。传说只要收集齐四种魔法黏土，就能唤醒它……',
          next: 'advice',
        },
        {
          id: 'advice',
          text: '不过别急着去冒险。先把你的助手造好，有了帮手才能走得更远。记住，不同的魔法黏土在不同的地方能找到。',
          next: null,
        },
      ],
    },
    scholar: {
      name: '黏土学者 · 瓷小姐',
      emoji: '👩‍🔬',
      color: 0x7a8aaa,
      position: [-6, 0, 8],
      dialog: [
        {
          id: 'greeting',
          text: '你好！我是瓷小姐，专门研究黏土的分子结构和魔法传导效率。',
          next: 'research',
        },
        {
          id: 'research',
          text: '你知道吗？不同颜色的黏土蕴含不同的魔力。褐色黏土最普通但最稳定，红色黏土蕴含火元素，蓝色黏土蕴含水元素……',
          next: 'discovery',
        },
        {
          id: 'discovery',
          text: '最近我发现了一种紫色的稀有黏土，它似乎能同时承载多种魔法！如果能找到它，或许能创造出前所未有的助手……',
          next: 'shop_offer',
          action: 'unlock_recipe',
        },
        {
          id: 'shop_offer',
          text: '对了，我这里有些好东西，要不要看看？按 F 打开商店！',
          next: null,
          action: 'open_shop',
        },
      ],
    },
  };

  function init(_scene) {
    scene = _scene;
    createNPCs();
    initQuests();
  }

  function createNPCs() {
    Object.entries(NPC_DATA).forEach(([key, data]) => {
      const group = new THREE.Group();

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: data.color, roughness: 0.7, metalness: 0.05,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.35, 12, 8);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xd4a060, roughness: 0.6,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.85;
      head.castShadow = true;
      group.add(head);

      // Hat / decoration based on type
      if (key === 'elder') {
        // Wizard hat
        const hatGeo = new THREE.ConeGeometry(0.3, 0.6, 6);
        const hatMat = new THREE.MeshStandardMaterial({
          color: 0x3a2a1a, roughness: 0.8,
        });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 2.3;
        group.add(hat);
      } else if (key === 'scholar') {
        // Glasses (two torus)
        const glassGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 12);
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x88aacc, metalness: 0.8, roughness: 0.2,
        });
        const leftLens = new THREE.Mesh(glassGeo, glassMat);
        leftLens.position.set(-0.12, 1.88, 0.3);
        group.add(leftLens);
        const rightLens = new THREE.Mesh(glassGeo, glassMat);
        rightLens.position.set(0.12, 1.88, 0.3);
        group.add(rightLens);
      } else if (key === 'merchant') {
        // Backpack
        const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        const packMat = new THREE.MeshStandardMaterial({
          color: 0x6a5a3a, roughness: 0.9,
        });
        const pack = new THREE.Mesh(packGeo, packMat);
        pack.position.set(0, 1.1, -0.35);
        group.add(pack);
      }

      // Name plate
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(10,10,18,0.7)';
      ctx.roundRect(0, 0, 256, 64, 8);
      ctx.fill();
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#e8c87a';
      ctx.textAlign = 'center';
      ctx.fillText(data.name, 128, 40);
      const tex = new THREE.CanvasTexture(canvas);
      const plateMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const plate = new THREE.Sprite(plateMat);
      plate.position.y = 2.8;
      plate.scale.set(2, 0.5, 1);
      group.add(plate);

      // Position
      const groundY = World.getGroundHeight(data.position[0], data.position[2]);
      group.position.set(data.position[0], groundY, data.position[2]);
      group.userData.type = 'npc';
      group.userData.npcKey = key;
      group.userData.data = data;
      group.userData.interactable = true;

      scene.add(group);
      npcs.push(group);
    });
  }

  function initQuests() {
    quests.push({
      id: 'first_assistant',
      title: '创造第一个助手',
      description: '采集黏土并注入魔法，创造你的第一个助手',
      status: 'active',
      objectives: [
        { text: '采集 10 单位黏土', done: false },
        { text: '打开工坊 (Tab)', done: false },
        { text: '创造一个助手', done: false },
      ],
    });
  }

  function getNPCs() {
    return npcs;
  }

  function getQuests() {
    return quests;
  }

  function update(time) {
    // Idle animation for NPCs
    npcs.forEach((npc, i) => {
      npc.children.forEach(child => {
        if (child.isMesh) {
          child.position.y += Math.sin(time * 1.5 + i) * 0.0003;
        }
      });
      // Slight sway
      npc.rotation.y += Math.sin(time * 0.5 + i * 2) * 0.0005;
    });
  }

  return {
    init, getNPCs, getQuests, update,
    NPC_DATA,
  };
})();
