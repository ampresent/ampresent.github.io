/**
 * save.js — Local save/load system
 */
const SaveSystem = (() => {
  const SAVE_KEY = 'clay_spell_craft_save';

  function save(gameState) {
    try {
      const data = {
        version: 1,
        timestamp: Date.now(),
        player: {
          position: gameState.position,
          rotation: gameState.rotation,
        },
        clay: gameState.clayAmount,
        quests: gameState.quests,
        assistants: gameState.assistants,
        harvestedNodes: gameState.harvestedNodes,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  function getSaveInfo() {
    const data = load();
    if (!data) return null;
    return {
      timestamp: data.timestamp,
      clay: data.clay,
      date: new Date(data.timestamp).toLocaleString('zh-CN'),
    };
  }

  return {
    save, load, hasSave, deleteSave, getSaveInfo,
  };
})();
