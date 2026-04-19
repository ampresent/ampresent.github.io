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

    // Simulate loading
    for (let i = 0; i <= 100; i += 5) {
      UI.showLoading(i);
      await sleep(30);
    }

    // Init engine
    Engine.init(canvas);

    // Init systems
    const scene = Engine.getScene();
    World.init(scene);
    Structures.init(scene);
    Water.init(scene);
    Effects.init(scene);
    ClaySystem.init(scene);
    SpellSystem.init(scene);
    Characters.init(scene);
    QuestSystem.init();
    DayNight.init(scene);
    Weather.init(scene);
    AudioSystem.init();
    UI.init();

    // Hide loading, show title
    UI.hideLoading();

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
      if (UI.isCraftOpen()) UI.closeCraft();
      if (UI.isDialogActive()) UI.closeDialog();
      const qp = document.getElementById('quest-panel');
      if (qp.style.display !== 'none') qp.style.display = 'none';
    });

    // Q key for quest panel, F5 for save
    document.addEventListener('keydown', (e) => {
      if (!gameStarted || UI.isDialogActive()) return;
      if (e.code === 'KeyQ') {
        toggleQuestPanel();
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
        Effects.update(gameTime);
        SpellSystem.update(delta);
        ClaySystem.update(gameTime, delta);
        Characters.update(gameTime);
        DayNight.update(delta);
        Weather.update(delta, gameTime);

        // Update time display
        const timeStr = DayNight.getTimeString();
        const timeEl = document.getElementById('time-display');
        if (timeEl) {
          const nightIcon = DayNight.isNight() ? '🌙' : '☀️';
          timeEl.textContent = `${nightIcon} ${timeStr}`;
        }

        // Update minimap
        const camera = Engine.getCamera();
        UI.updateMinimap(camera.position, Characters.getNPCs());
      }

      Engine.getRenderer().render(Engine.getScene(), Engine.getCamera());
    }
    loop();
  }

  function startGame() {
    gameStarted = true;
    UI.hideTitle();
    UI.showHUD();

    const canvas = document.getElementById('game-canvas');
    Engine.lockPointer(canvas);

    // Start audio
    AudioSystem.resume();
    AudioSystem.startAmbient();

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

        if (npc.userData.npcKey === 'elder') {
          QuestSystem.completeObjective('first_steps', 'talk_elder');
          AudioSystem.playSFX('quest');
        } else if (npc.userData.npcKey === 'scholar') {
          QuestSystem.completeObjective('meet_scholar', 'talk_scholar');
        }
        return;
      }
    }

    // Clay nodes
    const target = Engine.getRaycastTarget(5);
    if (target && target.object.userData.type === 'clayNode') {
      const node = target.object;
      const amount = Math.min(node.userData.amount, 10);
      ClaySystem.addClay(amount);
      node.userData.amount -= amount;
      AudioSystem.playSFX('harvest');
      SpellSystem.castAt(target.point);

      QuestSystem.completeObjective('first_steps', 'harvest_clay');
      if (ClaySystem.getClayAmount() >= 10) {
        QuestSystem.completeObjective('first_assistant', 'collect_10_clay');
      }

      if (node.userData.amount <= 0) {
        Engine.getScene().remove(node);
        World.removeInteractable(node);
        UI.notify('这个黏土矿已经采空了');
      }
      return;
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
    if (target) {
      SpellSystem.castAt(target.point);
    } else {
      const camera = Engine.getCamera();
      const pos = camera.position.clone().add(Engine.getCameraForward().multiplyScalar(8));
      SpellSystem.castAt(pos);
    }

    AudioSystem.playSFX('spell');
    QuestSystem.completeObjective('first_steps', 'cast_spell');
  }

  function toggleQuestPanel() {
    const panel = document.getElementById('quest-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      renderQuestPanel();
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
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
