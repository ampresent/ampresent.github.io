/**
 * minimap.js — Enhanced minimap with terrain and POI rendering
 */
const Minimap = (() => {
  let canvas, ctx;
  const SIZE = 150;
  const SCALE = 2.5;

  function init() {
    canvas = document.getElementById('minimap-canvas');
    ctx = canvas.getContext('2d');
  }

  function render(playerPos, npcs, assistants, clayNodes) {
    const w = SIZE;
    const h = SIZE;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Clip circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    bgGrad.addColorStop(0, 'rgba(20, 16, 30, 0.9)');
    bgGrad.addColorStop(1, 'rgba(10, 8, 18, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(200,122,74,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Terrain dots (simplified)
    ctx.fillStyle = 'rgba(80, 60, 40, 0.3)';
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const dist = 10 + (i * 37 % 50);
      const tx = cx + Math.cos(angle) * dist * 0.6;
      const ty = cy + Math.sin(angle) * dist * 0.6;
      ctx.beginPath();
      ctx.arc(tx, ty, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clay nodes
    if (clayNodes) {
      clayNodes.forEach(node => {
        const dx = (node.position.x - playerPos.x) * SCALE;
        const dz = (node.position.z - playerPos.z) * SCALE;
        if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
          ctx.fillStyle = 'rgba(200, 122, 74, 0.7)';
          ctx.shadowColor = '#c87a4a';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dz, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }

    // NPCs
    if (npcs) {
      npcs.forEach(npc => {
        const dx = (npc.position.x - playerPos.x) * SCALE;
        const dz = (npc.position.z - playerPos.z) * SCALE;
        if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
          // Green dot with ring
          ctx.strokeStyle = 'rgba(100, 200, 130, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dz, 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#60cc80';
          ctx.shadowColor = '#44aa66';
          ctx.shadowBlur = 3;
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dz, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }

    // Assistants
    if (assistants) {
      assistants.forEach(a => {
        const dx = (a.position.x - playerPos.x) * SCALE;
        const dz = (a.position.z - playerPos.z) * SCALE;
        if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
          const type = a.userData.assistantType;
          const colors = { fire: '#ff6644', water: '#4488ff', wind: '#88ccff', life: '#44cc66' };
          ctx.fillStyle = colors[type] || '#e8c87a';
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dz, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Player (center)
    // Direction arrow
    const camera = Engine.getCamera();
    const dir = Engine.getCameraForward();
    const arrowLen = 10;

    ctx.strokeStyle = '#e8c87a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dir.x * arrowLen, cy + dir.z * arrowLen);
    ctx.stroke();

    // Player dot
    ctx.fillStyle = '#e8c87a';
    ctx.shadowColor = '#e8c87a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player ring
    ctx.strokeStyle = 'rgba(232,200,122,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Border glow
    ctx.strokeStyle = 'rgba(200,122,74,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  return { init, render };
})();
