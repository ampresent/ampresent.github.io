/**
 * main.js — Game entry point, initialization, main loop
 */
(function () {
  'use strict';

  let gameStarted = false;
  let gameTime = 0;

  // === Boot sequence ===
  async function boot() {
    const canvas = document.getElementById('game-canvas');

    // Loading stories
    const stories = [
      '泥灵界的造物主沉睡千年，留下无数黏土碎片散落四方……',
      '塑灵师们用双手赋予泥土灵魂，用魔法唤醒沉睡的力量……',
      '据说在世界尽头，有一座远古黏土巨人等待着被唤醒……',
      '四色魔法黏土：火焰之红、流水之蓝、风暴之白、生命之绿……',
      '新的塑灵师即将踏入这片神奇的土地……',
    ];

    // Simulate loading
    for (let i = 0; i <= 100; i += 4) {
      UI.showLoading(i);
      const storyEl = document.getElementById('loading-story');
      if (storyEl) {
        const storyIdx = Math.floor((i / 100) * stories.length);
        if (storyIdx < stories.length && storyEl.textContent !== stories[storyIdx]) {
          storyEl.style.opacity = '0';
          setTimeout(() => {
            storyEl.textContent = stories[storyIdx];
            storyEl.style.opacity = '1';
          }, 200);
        }
      }
      await sleep(35);
    }

    // Init engine
    Engine.init(canvas);

    // Init systems
    const scene = Engine.getScene();
    World.init(scene);
    Structures.init(scene);
    Water.init(scene);
    Underwater.init(scene);
    Effects.init(scene);
    Landmarks.init(scene);
    Collectibles.init(scene);
    Secrets.init(scene);
    Dungeons.init(scene);
    ClaySystem.init(scene);
    SpellSystem.init(scene);
    Characters.init(scene);
    Enemies.init(scene);
    Patrol.init();
    Bosses.init(scene);
    Trail.init(scene);
    Pets.init(scene);

    // Zone system with music integration
    Zones.init((zone) => {
      Notify.info(`📍 ${zone.name} — ${zone.desc || ''}`);
      Music.setZone(zone.music || 'overworld');
    });
    QuestSystem.init();
    DayNight.init(scene);
    Weather.init(scene);
    NightEvents.init(scene);
    AudioSystem.init();
    Settings.init();
    Music.init();
    Tooltip.init();
    Minimap.init();
    Compass.init();
    WorldMap.init();
    InteractPrompt.init();
    ScreenFX.init();
    QuestAnim.init(scene);
    UI.init();

    // Hide loading, show title
    UI.hideLoading();

    // Start title background particles
    const titleBgCanvas = document.getElementById('title-bg-canvas');
    if (titleBgCanvas) {
      ParticlesBg.init(titleBgCanvas);
      ParticlesBg.start();
    }

    // Check for save
    if (SaveSystem.hasSave()) {
      const info = SaveSystem.getSaveInfo();
      const loadBtn = document.getElementById('load-btn');
      loadBtn.style.display = 'block';
      loadBtn.textContent = `继续冒险 📂 (${info.date})`;
      loadBtn.addEventListener('click', () => loadGame());
    }

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);

    // Input bindings
    Engine.on('space', () => {
      if (UI.isDialogActive()) {
        UI.advanceDialog();
      }
    });

    Engine.on('interact', () => {
      if (!gameStarted || UI.isDialogActive()) return;
      handleInteraction();
    });

    Engine.on('click', () => {
      if (!gameStarted) return;
      handleCastSpell();
    });

    Engine.on('tool', (tool) => {
      if (!gameStarted) return;
      UI.selectTool(tool);
    });

    Engine.on('craft', () => {
      if (!gameStarted) return;
      if (UI.isCraftOpen()) {
        UI.closeCraft();
      } else {
        UI.openCraft();
      }
    });

    Engine.on('escape', () => {
      if (UI.isCraftOpen()) { UI.closeCraft(); return; }
      if (UI.isDialogActive()) { UI.closeDialog(); return; }
      // Close any open panel
      const panels = ['quest-panel', 'inventory-panel', 'abilities-panel', 'recipes-panel', 'achievements-panel', 'settings-panel', 'shop-panel', 'worldmap-panel', 'stats-panel'];
      let closed = false;
      panels.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none') { el.style.display = 'none'; closed = true; }
      });
      // If nothing was open, show settings
      if (!closed && gameStarted) {
        Settings.render();
        document.getElementById('settings-panel').style.display = 'block';
      }
    });

    // Q key for quest panel, I for inventory, F5 for save
    document.addEventListener('keydown', (e) => {
      if (!gameStarted || UI.isDialogActive()) return;
      if (e.code === 'KeyQ') {
        toggleQuestPanel();
      } else if (e.code === 'KeyI') {
        toggleInventoryPanel();
      } else if (e.code === 'KeyR') {
        toggleAbilitiesPanel();
      } else if (e.code === 'KeyP') {
        toggleRecipesPanel();
      } else if (e.code === 'KeyU') {
        toggleAchievementsPanel();
      } else if (e.code === 'KeyF') {
        if (Shop.isOpen()) Shop.close(); else Shop.open();
      } else if (e.code === 'KeyM') {
        WorldMap.toggle();
      } else if (e.code === 'KeyT') {
        toggleStatsPanel();
      } else if (e.code === 'F5') {
        e.preventDefault();
        doSave();
      }
    });

    // Main loop
    const clock = Engine.getClock();
    function loop() {
      requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.1);
      gameTime += delta;

      if (gameStarted) {
        Engine.update(delta);
        World.update(gameTime);
        Water.update(gameTime);
        Underwater.update(gameTime);
        Effects.update(gameTime);
        Landmarks.update(gameTime);
        Collectibles.update(gameTime);
        Dungeons.update(gameTime);
        Secrets.update(gameTime);
        SpellSystem.update(delta);
        ClaySystem.update(gameTime, delta);
        Characters.update(gameTime);
        Patrol.update(delta, Characters.getNPCs());
        Enemies.update(delta, gameTime, Engine.getCamera().position);
        Bosses.update(gameTime, delta, Engine.getCamera().position);
        Pets.update(gameTime, delta);
        DayNight.update(delta);
        Weather.update(delta, gameTime);
        NightEvents.update(gameTime);

        // Player trail
        const cameraPos = Engine.getCamera().position;

        // Zone detection
        Zones.update(cameraPos);

        // Stats tracking
        Stats.update(delta, cameraPos);
        const isMoving = Engine.isLocked() && (Math.abs(Engine.getCamera().position.x - (window._lastPX || 0)) > 0.01 || Math.abs(Engine.getCamera().position.z - (window._lastPZ || 0)) > 0.01);
        Trail.update(delta, cameraPos, isMoving);
        window._lastPX = cameraPos.x;
        window._lastPZ = cameraPos.z;

        // Achievement tracking
        if (DayNight.isNight()) Achievements.track('night');
        if (Weather.getCurrentWeather() === 'rain') Achievements.track('rain');
        Achievements.track('assistants', ClaySystem.getAssistants().length);

        // Update time display
        const timeStr = DayNight.getTimeString();
        const timeEl = document.getElementById('time-display');
        if (timeEl) {
          const nightIcon = DayNight.isNight() ? '🌙' : '☀️';
          timeEl.textContent = `${nightIcon} ${timeStr}`;
        }

        // Update minimap
        const camera = Engine.getCamera();
        const clayNodes = World.getInteractables().filter(o => o.userData.type === 'clayNode');
        Minimap.render(camera.position, Characters.getNPCs(), ClaySystem.getAssistants(), clayNodes);

        // Update compass
        Compass.render();

        // Update quest tracker
        updateQuestTracker();

        // Update interact prompt
        updateInteractPrompt(camera.position);

        // Update screen effects
        ScreenFX.update();
        QuestAnim.update(delta);
      }

      Engine.getRenderer().render(Engine.getScene(), Engine.getCamera());
    }
    loop();
  }

  function startGame() {
    gameStarted = true;
    ParticlesBg.stop();
    UI.hideTitle();
    UI.showHUD();
    Achievements.complete('first_steps');

    const canvas = document.getElementById('game-canvas');
    Engine.lockPointer(canvas);

    // Start audio
    AudioSystem.resume();
    AudioSystem.startAmbient();
    Music.resume();
    Music.play();

    // Initial dialog
    setTimeout(() => {
      UI.showDialog('🌍', '泥灵界',
        '你踏入了泥灵界。远处有一位老人正在捏着什么……也许该去打个招呼。\n\n提示：按 Q 任务 | Tab 工坊 | F5 存档'
      );
      AudioSystem.playSFX('dialog');
    }, 1500);
  }

  function loadGame() {
    const saveData = SaveSystem.load();
    if (!saveData) {
      UI.notify('存档读取失败');
      return;
    }

    startGame();

    // Restore player position
    if (saveData.player) {
      const camera = Engine.getCamera();
      camera.position.set(
        saveData.player.position.x,
        saveData.player.position.y,
        saveData.player.position.z
      );
    }

    // Restore clay
    if (saveData.clay) {
      // Directly set the amount (addClay adds, so we need to hack it)
      // We'll just add what was saved
      ClaySystem.addClay(saveData.clay);
    }

    UI.notify('📂 存档已读取');
    AudioSystem.playSFX('quest');
  }

  function doSave() {
    const camera = Engine.getCamera();
    const state = {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      rotation: { y: camera.rotation.y, x: camera.rotation.x },
      clayAmount: ClaySystem.getClayAmount(),
      quests: QuestSystem.getAllQuests().map(q => ({
        id: q.id, status: q.status,
        objectives: q.objectives.map(o => ({ id: o.id, done: o.done })),
      })),
      assistants: ClaySystem.getAssistants().map(a => ({
        type: a.userData.assistantType,
        position: { x: a.position.x, y: a.position.y, z: a.position.z },
      })),
    };

    if (SaveSystem.save(state)) {
      UI.notify('💾 游戏已保存');
      AudioSystem.playSFX('click');
    } else {
      UI.notify('❌ 保存失败');
    }
  }

  function handleInteraction() {
    const camera = Engine.getCamera();
    const cameraPos = camera.position;

    // NPCs
    const npcs = Characters.getNPCs();
    for (const npc of npcs) {
      const dist = cameraPos.distanceTo(npc.position);
      if (dist < 4) {
        const data = npc.userData.data;
        UI.showNPCDialog(data, 'greeting');
        AudioSystem.playSFX('dialog');
        Achievements.track('npc', npc.userData.npcKey);

        if (npc.userData.npcKey === 'elder') {
          QuestSystem.completeObjective('first_steps', 'talk_elder');
          AudioSystem.playSFX('quest');
        } else if (npc.userData.npcKey === 'scholar') {
          QuestSystem.completeObjective('meet_scholar', 'talk_scholar');
        }
        return;
      }
    }

    // Ghost NPC (night only)
    const ghost = NightEvents.getGhostNPC();
    if (ghost && ghost.visible) {
      const dist = cameraPos.distanceTo(ghost.position);
      if (dist < 4) {
        UI.showNPCDialog(ghost.userData.data, 'greeting');
        AudioSystem.playSFX('dialog');
        return;
      }
    }

    // Clay nodes & collectibles
    const target = Engine.getRaycastTarget(5);
    if (target) {
      if (target.object.userData.type === 'clayNode') {
        const node = target.object;
        const amount = Math.min(node.userData.amount, 10);
        ClaySystem.addClay(amount);
        Inventory.add('clay', amount);
        node.userData.amount -= amount;
        AudioSystem.playSFX('harvest');
        Achievements.track('harvest');
        SpellSystem.castAt(target.point);

        QuestSystem.completeObjective('first_steps', 'harvest_clay');
        if (ClaySystem.getClayAmount() >= 10) {
          QuestSystem.completeObjective('first_assistant', 'collect_10_clay');
        }

        if (node.userData.amount <= 0) {
          Engine.getScene().remove(node);
          World.removeInteractable(node);
          Notify.warning('这个黏土矿已经采空了');
        }
        return;
      }

      if (target.object.userData.type === 'collectible') {
        Collectibles.collect(target.object);
        return;
      }

      if (target.object.userData.type === 'secret') {
        Secrets.discover(target.object.userData.secretId);
        return;
      }
    }

    // Assistants
    const assistants = ClaySystem.getAssistants();
    for (const a of assistants) {
      const dist = cameraPos.distanceTo(a.position);
      if (dist < 4) {
        const tmpl = a.userData.template;
        const abilities = tmpl.abilities.join('、');
        UI.showDialog(tmpl.emoji, tmpl.name,
          `${tmpl.description}\n\n能力: ${abilities}`
        );
        AudioSystem.playSFX('dialog');
        return;
      }
    }
  }

  function handleCastSpell() {
    const target = Engine.getRaycastTarget(12);
    const spellType = SpellSystem.getCurrentSpell();

    // Check for enemy hit
    const enemies = Enemies.getEnemies();
    const camera = Engine.getCamera();
    const camPos = camera.position;
    const forward = Engine.getCameraForward();

    // Check for boss hit first
    const boss = Bosses.getActiveBoss();
    if (boss && boss.userData.alive) {
      const toBoss = new THREE.Vector3().subVectors(boss.position, camPos);
      const bossDist = toBoss.length();
      if (bossDist < 15) {
        const bossDir = toBoss.normalize();
        if (forward.dot(bossDir) > 0.85) {
          const damage = Player.getAttack() + (spellType === 'fire' ? 8 : 5);
          Bosses.damageBoss(damage);
          SpellSystem.castAt(boss.position);
          AudioSystem.playSFX('spell');
          ScreenFX.flash('rgba(255,200,0,0.1)', 100);
          Achievements.track('spell', spellType);
          return;
        }
      }
    }

    for (const enemy of enemies) {
      if (!enemy.userData.alive) continue;
      const toEnemy = new THREE.Vector3().subVectors(enemy.position, camPos);
      const dist = toEnemy.length();
      if (dist > 12) continue;

      // Dot product check (rough cone)
      const dir = toEnemy.normalize();
      const dot = forward.dot(dir);
      if (dot > 0.9 && dist < 8) {
        const baseDamage = Player.getAttack();
        const spellBonus = spellType === 'fire' ? 5 : spellType === 'water' ? 3 : spellType === 'wind' ? 2 : spellType === 'life' ? 0 : 1;
        const totalDamage = baseDamage + spellBonus;
        Enemies.damageEnemy(enemy, totalDamage);
        if (enemy.userData.hp <= 0) { Player.addXP(enemy.userData.template.xp); Stats.track('kill'); }
        SpellSystem.castAt(enemy.position);
        AudioSystem.playSFX('spell');
        ScreenFX.magicGlow(SpellSystem.SPELL_COLORS[spellType]);
        Achievements.track('spell', spellType);
        QuestSystem.completeObjective('first_steps', 'cast_spell');
        return;
      }
    }

    // No enemy hit, cast at point
    if (target) {
      SpellSystem.castAt(target.point);
    } else {
      const pos = camPos.clone().add(forward.multiplyScalar(8));
      SpellSystem.castAt(pos);
    }

    AudioSystem.playSFX('spell');
    ScreenFX.magicGlow(SpellSystem.SPELL_COLORS[spellType]);
    Achievements.track('spell', spellType);
    Stats.track('spell');
    QuestSystem.completeObjective('first_steps', 'cast_spell');
  }

  function toggleQuestPanel() {
    const panel = document.getElementById('quest-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      renderQuestPanel();
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  function toggleInventoryPanel() {
    const panel = document.getElementById('inventory-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      Inventory.render();
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  function toggleAbilitiesPanel() {
    const panel = document.getElementById('abilities-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      Abilities.render();
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  function toggleRecipesPanel() {
    const panel = document.getElementById('recipes-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      Recipes.render();
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  function toggleAchievementsPanel() {
    const panel = document.getElementById('achievements-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      Achievements.render();
      document.getElementById('ach-count').textContent = `(${Achievements.getCount()}/${Achievements.getAll().length})`;
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  function toggleStatsPanel() {
    const panel = document.getElementById('stats-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      Stats.render();
      panel.style.display = 'block';
      AudioSystem.playSFX('click');
    } else {
      panel.style.display = 'none';
    }
  }

  let trackerUpdateTimer = 0;

  function updateQuestTracker() {
    trackerUpdateTimer++;
    if (trackerUpdateTimer % 30 !== 0) return; // Update every ~30 frames

    const container = document.getElementById('tracker-content');
    if (!container) return;

    const activeQuests = QuestSystem.getActiveQuests();
    if (activeQuests.length === 0) {
      container.innerHTML = '<div style="color:#4a3a2a;font-size:0.68rem;">暂无进行中的任务</div>';
      return;
    }

    container.innerHTML = activeQuests.slice(0, 2).map(q => {
      const objs = q.objectives.filter(o => !o.done).slice(0, 3).map(o =>
        `<div class="tracker-obj">○ ${o.text}</div>`
      ).join('');
      return `<div class="tracker-item">
        <div class="tracker-title">${q.title}</div>
        ${objs}
      </div>`;
    }).join('');
  }

  function updateInteractPrompt(cameraPos) {
    // Check NPCs
    const npcs = Characters.getNPCs();
    for (const npc of npcs) {
      const dist = cameraPos.distanceTo(npc.position);
      if (dist < 4) {
        InteractPrompt.show('E', `与 ${npc.userData.data.name} 交谈`);
        return;
      }
    }

    // Check clay nodes and collectibles via raycast
    const target = Engine.getRaycastTarget(5);
    if (target) {
      if (target.object.userData.type === 'clayNode') {
        InteractPrompt.show('E', '采集黏土');
        return;
      }
      if (target.object.userData.type === 'collectible') {
        InteractPrompt.show('E', `拾取 ${target.object.userData.itemType.name}`);
        return;
      }
    }

    // Check assistants
    const assistants = ClaySystem.getAssistants();
    for (const a of assistants) {
      const dist = cameraPos.distanceTo(a.position);
      if (dist < 4) {
        InteractPrompt.show('E', `查看 ${a.userData.template.name}`);
        return;
      }
    }

    InteractPrompt.hide();
  }

  function renderQuestPanel() {
    const list = document.getElementById('quest-list');
    const allQuests = QuestSystem.getAllQuests();
    list.innerHTML = '';

    allQuests.forEach(quest => {
      const div = document.createElement('div');
      div.className = `quest-item ${quest.status}`;

      let objHtml = quest.objectives.map(o =>
        `<div class="quest-obj ${o.done ? 'done' : ''}">${o.done ? '✓' : '○'} ${o.text}</div>`
      ).join('');

      div.innerHTML = `
        <div class="quest-title">${quest.title} ${quest.status === 'locked' ? '🔒' : quest.status === 'completed' ? '✅' : ''}</div>
        <div class="quest-desc">${quest.description}</div>
        ${objHtml}
        <div class="quest-reward">🎁 ${quest.reward}</div>
      `;
      list.appendChild(div);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Canvas roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }

  // Go
  window.addEventListener('DOMContentLoaded', boot);
})();
