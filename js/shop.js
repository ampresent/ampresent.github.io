/**
 * shop.js — NPC shop / trading system
 */
const Shop = (() => {
  const shopItems = [
    { id: 'hp_potion', name: '治疗药水', emoji: '❤️', price: 15, currency: 'crystals', desc: '恢复30HP', effect: () => Player.heal(30) },
    { id: 'clay_pack', name: '黏土礼包', emoji: '📦', price: 10, currency: 'crystals', desc: '获得20单位黏土', effect: () => Inventory.add('clay', 20) },
    { id: 'rare_clay', name: '稀有黏土箱', emoji: '💎', price: 30, currency: 'crystals', desc: '随机获得5个稀有黏土', effect: () => {
      const types = ['fireClay', 'waterClay', 'windClay', 'lifeClay'];
      const t = types[Math.floor(Math.random() * types.length)];
      Inventory.add(t, 5);
      const names = { fireClay: '火', waterClay: '水', windClay: '风', lifeClay: '生' };
      Notify.info(`获得 5个${names[t]}黏土！`);
    }},
    { id: 'xp_tome', name: '经验之书', emoji: '📖', price: 25, currency: 'crystals', desc: '获得30经验', effect: () => Player.addXP(30) },
    { id: 'magic_lantern', name: '魔力灯笼', emoji: '🏮', price: 20, currency: 'crystals', desc: '永久照亮周围', effect: () => {
      const camera = Engine.getCamera();
      const light = new THREE.PointLight(0xffeecc, 0.5, 15);
      camera.add(light);
      light.position.set(0, 0, -1);
      Notify.success('灯笼已装备！');
    }},
  ];

  let shopOpen = false;

  function open() {
    shopOpen = true;
    render();
    document.getElementById('shop-panel').style.display = 'block';
  }

  function close() {
    shopOpen = false;
    document.getElementById('shop-panel').style.display = 'none';
  }

  function isOpen() { return shopOpen; }

  function buy(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    const balance = Inventory.get(item.currency);
    if (balance < item.price) {
      Notify.warning(`水晶不足！需要 ${item.price}，当前 ${balance}`);
      return;
    }

    Inventory.consume(item.currency, item.price);
    item.effect();
    AudioSystem.playSFX('craft');
    Notify.success(`购买了 ${item.emoji} ${item.name}！`);
    render();
  }

  function render() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    container.innerHTML = '';

    const balance = Inventory.get('crystals');
    document.getElementById('shop-balance').textContent = `💎 ${balance}`;

    shopItems.forEach(item => {
      const canAfford = balance >= item.price;
      const div = document.createElement('div');
      div.className = `shop-item ${canAfford ? '' : 'cant-afford'}`;
      div.innerHTML = `
        <span class="shop-emoji">${item.emoji}</span>
        <div class="shop-info">
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">${item.desc}</div>
        </div>
        <div class="shop-price">${item.price} 💎</div>
      `;
      if (canAfford) {
        div.addEventListener('click', () => buy(item.id));
      }
      container.appendChild(div);
    });
  }

  return { open, close, isOpen, render, shopItems };
})();
