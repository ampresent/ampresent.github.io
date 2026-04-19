/**
 * model-loader.js — Load glTF/GLB models via dynamic import
 * Exposes ModelLoader globally
 */
const ModelLoader = (() => {
  const cache = {};
  let loader = null;
  let ready = false;
  let initPromise = null;

  async function init() {
    if (ready) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const mod = await import('three/addons/loaders/GLTFLoader.js');
        loader = new mod.GLTFLoader();
        ready = true;
        console.log('[ModelLoader] GLTFLoader ready');
      } catch (e) {
        console.warn('[ModelLoader] Failed to load GLTFLoader:', e);
      }
    })();
    return initPromise;
  }

  async function load(url) {
    if (cache[url]) return cache[url].clone();
    if (!ready) await init();
    if (!ready) return null;

    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        cache[url] = gltf.scene;
        resolve(gltf.scene.clone());
      }, undefined, reject);
    });
  }

  function isReady() { return ready; }

  return { init, load, isReady };
})();
