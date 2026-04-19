/**
 * ui.js — HUD, dialogs, notifications, minimap
 */
const UI = (() => {
  let dialogQueue = [];
  let dialogActive = false;
  let craftOpen = false;

  function init() {
    // Tool slots
    document.querySelectorAll('.tool-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        selectTool(slot.dataset.tool);
      });
    });

    // Craft panel
    document.getElementById('craft-btn').addEventListener('click', doCraft);
    document.getElementById('craft-close').addEventListener('click', closeCraft);

    // Craft slots click
    document.getElementById('craft-clay').addEventListener('click', () => {
      if (ClaySystem.canCraft()) {
        document.getElementById('craft-clay').classList.add('filled');
        document.getElementById('craft-clay').innerHTML = '<span style="font-size:2rem">🧱</span>';
        checkCraftReady();
      }
    });

    document.querySelectorAll('#craft-spell').forEach(slot => {
      // These are handled by spell tool selection
    });
  }

  function selectTool(tool) {
    document.querySelectorAll('.tool-slot').forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    SpellSystem.setSpell(tool);

    // Update craft spell slot
    if (tool !== 'sculpt') {
      const spellSlot = document.getElementById('craft-spell');
      const emojis = { fire: '🔥', water: '💧', wind: '🌪️', life: '🌿' };
      spellSlot.classList.add('filled');
      spellSlot.innerHTML = `<span style="font-size:2rem">${emojis[tool]}</span>`;
      spellSlot.dataset.spellType = tool;
      checkCraftReady();
    }
  }

  function checkCraftReady() {
    const clayFilled = document.getElementById('craft-clay').classList.contains('filled');
    const spellFilled = document.getElementById('craft-spell').classList.contains('filled');
    document.getElementById('craft-btn').disabled = !(clayFilled && spellFilled && ClaySystem.canCraft());
  }

  function doCraft() {
    const spellType = document.getElementById('craft-spell').dataset.spellType;
    if (!spellType) return;

    ClaySystem.craftAssistant(spellType);
    closeCraft();
    resetCraftSlots();
  }

  function resetCraftSlots() {
    const claySlot = document.getElementById('craft-clay');
    claySlot.classList.remove('filled');
    claySlot.innerHTML = '<span class="slot-label">黏土</span>';

    const spellSlot = document.getElementById('craft-spell');
    spellSlot.classList.remove('filled');
    spellSlot.innerHTML = '<span class="slot-label">魔法</span>';
    delete spellSlot.dataset.spellType;

    document.getElementById('craft-btn').disabled = true;
  }

  function openCraft() {
    document.getElementById('craft-panel').style.display = 'block';
    craftOpen = true;

    // Auto-fill clay if player has enough
    if (ClaySystem.canCraft()) {
      const claySlot = document.getElementById('craft-clay');
      claySlot.classList.add('filled');
      claySlot.innerHTML = '<span style="font-size:2rem">🧱</span>';
    }
    checkCraftReady();
  }

  function closeCraft() {
    document.getElementById('craft-panel').style.display = 'none';
    craftOpen = false;
    resetCraftSlots();
  }

  function isCraftOpen() {
    return craftOpen;
  }

  // Dialog system
  function showDialog(emoji, name, text) {
    const box = document.getElementById('dialog-box');
    document.getElementById('dialog-portrait').textContent = emoji;
    document.getElementById('dialog-name').textContent = name;
    document.getElementById('dialog-text').textContent = text;
    box.style.display = 'flex';
    dialogActive = true;
  }

  function showNPCDialog(npcData, dialogId) {
    const dialog = npcData.dialog.find(d => d.id === dialogId);
    if (!dialog) {
      closeDialog();
      return;
    }
    showDialog(npcData.emoji, npcData.name, dialog.text);
    dialogQueue = dialog.next ? [{ npcData, dialogId: dialog.next }] : [];
  }

  function advanceDialog() {
    if (!dialogActive) return false;

    if (dialogQueue.length > 0) {
      const next = dialogQueue.shift();
      showNPCDialog(next.npcData, next.dialogId);
      return true;
    }

    closeDialog();
    return false;
  }

  function closeDialog() {
    document.getElementById('dialog-box').style.display = 'none';
    dialogActive = false;
    dialogQueue = [];
  }

  function isDialogActive() {
    return dialogActive;
  }

  // Notifications
  function notify(text) {
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('fadeout');
      setTimeout(() => el.remove(), 500);
    }, 2500);
  }

  // Mana/Clay display
  function updateMana(amount) {
    const maxMana = 100;
    const pct = Math.min(amount / maxMana * 100, 100);
    document.getElementById('mana-fill').style.width = pct + '%';
    document.getElementById('mana-text').textContent = amount;
  }

  // Minimap
  function updateMinimap(playerPos, npcs) {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scale = 3;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(10,10,18,0.8)';
    ctx.fillRect(0, 0, w, h);

    // Player
    ctx.fillStyle = '#e8c87a';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Direction
    const camera = Engine.getCamera();
    const dir = Engine.getCameraForward();
    ctx.strokeStyle = '#e8c87a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + dir.x * 12, h / 2 + dir.z * 12);
    ctx.stroke();

    // NPCs
    if (npcs) {
      npcs.forEach(npc => {
        const dx = (npc.position.x - playerPos.x) * scale;
        const dz = (npc.position.z - playerPos.z) * scale;
        if (Math.abs(dx) < w / 2 && Math.abs(dz) < h / 2) {
          ctx.fillStyle = '#60cc80';
          ctx.beginPath();
          ctx.arc(w / 2 + dx, h / 2 + dz, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }

  // Show/hide HUD
  function showHUD() {
    document.getElementById('hud').style.display = 'block';
  }

  function showLoading(pct) {
    document.querySelector('.loading-fill').style.width = pct + '%';
  }

  function hideLoading() {
    document.getElementById('loading-screen').classList.add('hidden');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 800);
  }

  function hideTitle() {
    document.getElementById('title-screen').classList.add('hidden');
    setTimeout(() => {
      document.getElementById('title-screen').style.display = 'none';
    }, 1000);
  }

  return {
    init, selectTool, openCraft, closeCraft, isCraftOpen,
    showDialog, showNPCDialog, advanceDialog, closeDialog, isDialogActive,
    notify, updateMana, updateMinimap, showHUD, showLoading, hideLoading, hideTitle,
  };
})();
