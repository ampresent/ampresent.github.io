/**
 * weather.js — Weather system: rain, fog, clear
 */
const Weather = (() => {
  let scene;
  let currentWeather = 'clear';
  const rainDrops = [];
  let rainGroup;
  let weatherTimer = 0;
  const WEATHER_DURATION = 60; // seconds between weather changes

  const WEATHERS = ['clear', 'foggy', 'rain', 'magical'];

  function init(_scene) {
    scene = _scene;
    createRainSystem();
  }

  function createRainSystem() {
    rainGroup = new THREE.Group();
    rainGroup.visible = false;
    scene.add(rainGroup);

    for (let i = 0; i < 300; i++) {
      const geo = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8899bb,
        transparent: true,
        opacity: 0.3,
      });
      const drop = new THREE.Mesh(geo, mat);
      resetDrop(drop);
      rainGroup.add(drop);
      rainDrops.push(drop);
    }
  }

  function resetDrop(drop) {
    const camera = Engine.getCamera();
    const cx = camera ? camera.position.x : 0;
    const cz = camera ? camera.position.z : 0;
    drop.position.set(
      cx + (Math.random() - 0.5) * 30,
      10 + Math.random() * 10,
      cz + (Math.random() - 0.5) * 30
    );
  }

  function setWeather(type) {
    if (currentWeather === type) return;
    currentWeather = type;

    const scene_bg = Engine.getScene();
    const fog = scene_bg.fog;

    switch (type) {
      case 'clear':
        fog.density = 0.015;
        rainGroup.visible = false;
        break;
      case 'foggy':
        fog.density = 0.04;
        rainGroup.visible = false;
        break;
      case 'rain':
        fog.density = 0.025;
        rainGroup.visible = true;
        break;
      case 'magical':
        fog.density = 0.02;
        rainGroup.visible = false;
        // Add sparkle effect
        break;
    }

    UI.notify(`天气变化: ${getWeatherName(type)}`);
  }

  function getWeatherName(type) {
    const names = {
      clear: '☀️ 晴朗',
      foggy: '🌫️ 薄雾',
      rain: '🌧️ 细雨',
      magical: '✨ 魔力涌动',
    };
    return names[type] || type;
  }

  function update(delta, time) {
    // Auto weather change
    weatherTimer += delta;
    if (weatherTimer >= WEATHER_DURATION) {
      weatherTimer = 0;
      const next = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      setWeather(next);
    }

    // Rain animation
    if (currentWeather === 'rain' && rainGroup.visible) {
      const camera = Engine.getCamera();
      rainDrops.forEach(drop => {
        drop.position.y -= 15 * delta;
        if (drop.position.y < 0) {
          resetDrop(drop);
        }
      });
    }

    // Magical weather sparkles
    if (currentWeather === 'magical') {
      scene.children.forEach(obj => {
        if (obj.userData.type === 'crystal') {
          obj.material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.5;
        }
      });
    }
  }

  function getCurrentWeather() {
    return currentWeather;
  }

  return {
    init, update, setWeather, getCurrentWeather, getWeatherName,
  };
})();
