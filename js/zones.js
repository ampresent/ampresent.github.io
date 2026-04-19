/**
 * zones.js — World zone detection and area effects
 */
const Zones = (() => {
  const zones = [
    { id: 'workshop', name: '工坊区', center: [0, 0], radius: 12, music: 'overworld', desc: '安全的工坊区域' },
    { id: 'forest', name: '萤光森林', center: [-15, 12], radius: 10, music: 'night', desc: '发光蘑菇与萤火虫的森林' },
    { id: 'lake', name: '魔力湖畔', center: [-12, -5], radius: 8, music: 'overworld', desc: '平静的魔法池塘' },
    { id: 'ruins', name: '远古遗迹', center: [-25, -20], radius: 8, music: 'dungeon', desc: '危险的远古遗迹入口' },
    { id: 'crystal', name: '水晶谷', center: [20, 15], radius: 10, music: 'dungeon', desc: '闪耀的水晶矿脉' },
    { id: 'highland', name: '风暴高地', center: [15, -15], radius: 12, music: 'overworld', desc: '浮空岛屿下的高地' },
    { id: 'swamp', name: '暗影沼泽', center: [-8, -25], radius: 9, music: 'night', desc: '弥漫暗影气息的沼泽' },
  ];

  let currentZone = null;
  let zoneChangeCallback = null;

  function init(callback) {
    zoneChangeCallback = callback;
  }

  function update(playerPos) {
    let newZone = null;

    for (const zone of zones) {
      const dx = playerPos.x - zone.center[0];
      const dz = playerPos.z - zone.center[1];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < zone.radius) {
        newZone = zone;
        break;
      }
    }

    if (!newZone) {
      newZone = { id: 'wilderness', name: '荒野', music: 'overworld', desc: '泥灵界的荒野地带' };
    }

    if (!currentZone || currentZone.id !== newZone.id) {
      currentZone = newZone;
      if (zoneChangeCallback) zoneChangeCallback(newZone);
    }
  }

  function getCurrentZone() { return currentZone; }

  function getZones() { return zones; }

  return { init, update, getCurrentZone, getZones };
})();
