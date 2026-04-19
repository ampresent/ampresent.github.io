/**
 * stats.js — Game statistics tracker
 */
const Stats = (() => {
  const data = {
    playTime: 0,
    clayHarvested: 0,
    spellsCast: 0,
    assistantsCreated: 0,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    secretsFound: 0,
    collectiblesFound: 0,
    distanceTraveled: 0,
    deaths: 0,
    recipesUnlocked: 0,
    questsCompleted: 0,
  };

  let lastPos = null;

  function track(event, value) {
    switch (event) {
      case 'clay': data.clayHarvested += (value || 1); break;
      case 'spell': data.spellsCast++; break;
      case 'craft': data.assistantsCreated++; break;
      case 'kill': data.enemiesDefeated++; break;
      case 'bossKill': data.bossesDefeated++; break;
      case 'secret': data.secretsFound++; break;
      case 'collectible': data.collectiblesFound++; break;
      case 'death': data.deaths++; break;
      case 'quest': data.questsCompleted++; break;
    }
  }

  function update(delta, playerPos) {
    data.playTime += delta;

    if (lastPos) {
      const dx = playerPos.x - lastPos.x;
      const dz = playerPos.z - lastPos.z;
      data.distanceTraveled += Math.sqrt(dx * dx + dz * dz);
    }
    lastPos = { x: playerPos.x, z: playerPos.z };
  }

  function getStat(key) { return data[key]; }

  function getAll() { return { ...data }; }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function render() {
    const container = document.getElementById('stats-content');
    if (!container) return;

    const items = [
      { label: '⏱️ 游戏时间', value: formatTime(data.playTime) },
      { label: '🧱 黏土采集', value: data.clayHarvested },
      { label: '✨ 魔法释放', value: data.spellsCast },
      { label: '🤖 助手创造', value: data.assistantsCreated },
      { label: '⚔️ 敌人击败', value: data.enemiesDefeated },
      { label: '👑 Boss击败', value: data.bossesDefeated },
      { label: '🗺️ 隐藏发现', value: data.secretsFound },
      { label: '💎 收集品', value: data.collectiblesFound },
      { label: '🏃 行走距离', value: Math.floor(data.distanceTraveled) + 'm' },
      { label: '💀 死亡次数', value: data.deaths },
      { label: '📜 完成任务', value: data.questsCompleted },
      { label: '⭐ 玩家等级', value: Player.getLevel() },
    ];

    container.innerHTML = items.map(i =>
      `<div class="stat-row">
        <span class="stat-label">${i.label}</span>
        <span class="stat-value">${i.value}</span>
      </div>`
    ).join('');
  }

  return { track, update, getStat, getAll, render, formatTime };
})();
