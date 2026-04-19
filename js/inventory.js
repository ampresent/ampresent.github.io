/**
 * inventory.js — Inventory and resource display system
 */
const Inventory = (() => {
  const items = {
    clay: { name: '黏土', emoji: '🧱', count: 0, color: '#c87a4a' },
    fireClay: { name: '火焰黏土', emoji: '🔴', count: 0, color: '#ff4422', rare: true },
    waterClay: { name: '水流黏土', emoji: '🔵', count: 0, color: '#2288ff', rare: true },
    windClay: { name: '风暴黏土', emoji: '⚪', count: 0, color: '#88ccff', rare: true },
    lifeClay: { name: '生命黏土', emoji: '🟢', count: 0, color: '#44cc66', rare: true },
    crystals: { name: '魔力水晶', emoji: '💎', count: 0, color: '#aa88ff' },
  };

  function add(itemId, amount) {
    if (items[itemId]) {
      items[itemId].count += amount;
      return true;
    }
    return false;
  }

  function get(itemId) {
    return items[itemId] ? items[itemId].count : 0;
  }

  function has(itemId, amount) {
    return get(itemId) >= (amount || 1);
  }

  function consume(itemId, amount) {
    if (has(itemId, amount)) {
      items[itemId].count -= amount;
      return true;
    }
    return false;
  }

  function getAll() {
    return items;
  }

  function render() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(items).forEach(([id, item]) => {
      const div = document.createElement('div');
      div.className = `inv-slot ${item.rare ? 'rare' : ''} ${item.count > 0 ? 'has-items' : ''}`;
      div.innerHTML = `
        <span class="inv-emoji">${item.emoji}</span>
        <span class="inv-count" style="color:${item.color}">${item.count}</span>
        <span class="inv-name">${item.name}</span>
      `;
      div.title = `${item.name}: ${item.count}`;
      container.appendChild(div);
    });
  }

  return { add, get, has, consume, getAll, render };
})();
