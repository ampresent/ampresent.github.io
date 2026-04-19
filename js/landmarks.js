/**
 * landmarks.js — Points of interest and world landmarks
 */
const Landmarks = (() => {
  let scene;
  const landmarks = [];
  const markers = [];

  function init(_scene) {
    scene = _scene;
    createPOIs();
  }

  function createPOIs() {
    const pois = [
      { id: 'workshop', name: '黏土工坊', emoji: '🧱', pos: [0, 0, 0], color: '#c87a4a' },
      { id: 'pond', name: '魔力池塘', emoji: '💧', pos: [-12, 0, -5], color: '#4488ff' },
      { id: 'altar', name: '远古祭坛', emoji: '🗿', pos: [0, 0, 0], color: '#8888aa' },
      { id: 'waterfall', name: '月光瀑布', emoji: '🌊', pos: [20, 0, -15], color: '#88ccff' },
      { id: 'grove', name: '萤光森林', emoji: '🌿', pos: [-15, 0, 12], color: '#44cc66' },
      { id: 'crystalCave', name: '水晶洞穴', emoji: '💎', pos: [18, 0, 15], color: '#aa88ff' },
    ];

    pois.forEach(poi => {
      const y = World.getGroundHeight(poi.pos[0], poi.pos[2]);

      // Floating marker above
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(10,10,18,0.6)';
      ctx.beginPath();
      ctx.roundRect(0, 8, 128, 36, 8);
      ctx.fill();

      ctx.font = '12px sans-serif';
      ctx.fillStyle = poi.color;
      ctx.textAlign = 'center';
      ctx.fillText(`${poi.emoji} ${poi.name}`, 64, 32);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8 });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(poi.pos[0], y + 5, poi.pos[2]);
      sprite.scale.set(3, 1.1, 1);
      sprite.userData.type = 'landmark';
      sprite.userData.poi = poi;
      scene.add(sprite);

      // Vertical beam
      const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 4, 4);
      const beamMat = new THREE.MeshStandardMaterial({
        color: poi.color,
        emissive: poi.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.15,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(poi.pos[0], y + 2, poi.pos[2]);
      scene.add(beam);

      landmarks.push({ ...poi, sprite, beam, y });
    });
  }

  function update(time) {
    landmarks.forEach((lm, i) => {
      // Float animation
      lm.sprite.position.y = lm.y + 5 + Math.sin(time * 0.8 + i) * 0.3;
      // Beam pulse
      if (lm.beam.material) {
        lm.beam.material.opacity = 0.1 + Math.sin(time * 1.5 + i * 2) * 0.05;
      }
    });
  }

  function getLandmarks() { return landmarks; }

  return { init, update, getLandmarks };
})();
