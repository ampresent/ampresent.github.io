/**
 * world.js — Terrain, sky, lighting, environment decorations
 */
const World = (() => {
  let scene;
  let groundMesh;
  const TERRAIN_SIZE = 100;
  const TERRAIN_SEGMENTS = 80;
  const interactables = [];

  function init(_scene) {
    scene = _scene;
    createLighting();
    createTerrain();
    createSkyDome();
    createEnvironment();
    createClayNodes();
  }

  function createLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x4a3a5a, 0.5);
    scene.add(ambient);

    // Hemisphere
    const hemi = new THREE.HemisphereLight(0x8a7acc, 0x4a3a2a, 0.4);
    scene.add(hemi);

    // Directional (sun/moon)
    const sun = new THREE.DirectionalLight(0xffe0b0, 0.8);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    // Magical point lights
    const colors = [0xff6030, 0x30a0ff, 0x60ff80, 0xff80ff];
    const positions = [[-15, 5, -10], [20, 4, 15], [-8, 3, 20], [12, 6, -18]];
    positions.forEach((pos, i) => {
      const light = new THREE.PointLight(colors[i], 0.6, 30);
      light.position.set(...pos);
      scene.add(light);
    });
  }

  function createTerrain() {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    // Procedural heightmap
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getHeight(x, z));
    }
    geo.computeVertexNormals();

    // Vertex colors for terrain variety
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + 3) / 8; // normalize
      // Dark earth -> clay brown -> grassy -> magical glow at peaks
      const r = THREE.MathUtils.lerp(0.15, 0.45, t) + Math.random() * 0.03;
      const g = THREE.MathUtils.lerp(0.1, 0.35, t) + Math.random() * 0.03;
      const b = THREE.MathUtils.lerp(0.12, 0.2, t) + Math.random() * 0.02;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });

    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
  }

  function noise2D(x, z) {
    // Simple hash-based noise
    const dot = x * 12.9898 + z * 78.233;
    const s = Math.sin(dot) * 43758.5453;
    return s - Math.floor(s);
  }

  function smoothNoise(x, z, scale) {
    const sx = x / scale;
    const sz = z / scale;
    const ix = Math.floor(sx);
    const iz = Math.floor(sz);
    const fx = sx - ix;
    const fz = sz - iz;
    const u = fx * fx * (3 - 2 * fx);
    const v = fz * fz * (3 - 2 * fz);
    const a = noise2D(ix, iz);
    const b = noise2D(ix + 1, iz);
    const c = noise2D(ix, iz + 1);
    const d = noise2D(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function getHeight(x, z) {
    let h = 0;
    h += smoothNoise(x, z, 20) * 4;
    h += smoothNoise(x, z, 8) * 1.5;
    h += smoothNoise(x, z, 3) * 0.4;
    // Flatten center area for the workshop
    const dist = Math.sqrt(x * x + z * z);
    if (dist < 12) {
      const blend = dist / 12;
      h = THREE.MathUtils.lerp(0, h, blend * blend);
    }
    return h - 2;
  }

  function getGroundHeight(x, z) {
    return getHeight(x, z);
  }

  function createSkyDome() {
    const geo = new THREE.SphereGeometry(200, 32, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = dir.y * 0.5 + 0.5;
          // Night sky gradient
          vec3 bottom = vec3(0.06, 0.04, 0.1);
          vec3 mid = vec3(0.1, 0.06, 0.18);
          vec3 top = vec3(0.02, 0.02, 0.06);
          vec3 col = mix(bottom, mid, smoothstep(0.0, 0.4, y));
          col = mix(col, top, smoothstep(0.4, 1.0, y));
          // Stars
          float star = fract(sin(dot(floor(dir.xz * 300.0), vec2(12.9898, 78.233))) * 43758.5453);
          star = step(0.997, star) * smoothstep(0.3, 0.8, y);
          col += star * (0.6 + 0.4 * sin(uTime * 2.0 + star * 100.0));
          // Subtle aurora
          float aurora = sin(dir.x * 3.0 + uTime * 0.3) * 0.5 + 0.5;
          aurora *= smoothstep(0.6, 0.9, y) * 0.15;
          col += vec3(0.1, 0.3, 0.2) * aurora;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.name = 'sky';
    scene.add(sky);
  }

  function createEnvironment() {
    // Clay pillars / standing stones
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a, roughness: 0.85, metalness: 0.1, flatShading: true,
    });

    const pillarPositions = [
      [-8, -12], [10, -8], [-15, 5], [18, 10], [-5, 18], [8, -20],
      [-20, -5], [25, -3], [-12, 15], [5, 22],
    ];

    pillarPositions.forEach(([x, z]) => {
      const h = 2 + Math.random() * 4;
      const geo = new THREE.CylinderGeometry(
        0.3 + Math.random() * 0.4,
        0.5 + Math.random() * 0.5,
        h, 6 + Math.floor(Math.random() * 3)
      );
      const pillar = new THREE.Mesh(geo, stoneMat);
      pillar.position.set(x, getHeight(x, z) + h / 2, z);
      pillar.rotation.y = Math.random() * Math.PI;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    });

    // Glowing crystals scattered around
    const crystalColors = [0xff4466, 0x44aaff, 0x44ff88, 0xffaa44, 0xaa44ff];
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      if (Math.sqrt(x * x + z * z) < 8) continue;

      const color = crystalColors[Math.floor(Math.random() * crystalColors.length)];
      const h = 0.5 + Math.random() * 1.5;
      const geo = new THREE.OctahedronGeometry(0.2 + Math.random() * 0.3, 0);
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.5,
        roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.85,
      });
      const crystal = new THREE.Mesh(geo, mat);
      crystal.position.set(x, getHeight(x, z) + h, z);
      crystal.rotation.set(Math.random(), Math.random(), Math.random());
      crystal.scale.y = 1.5 + Math.random();
      crystal.castShadow = true;
      crystal.userData.type = 'crystal';
      crystal.userData.floatOffset = Math.random() * Math.PI * 2;
      scene.add(crystal);
    }

    // Floating islands (small platforms)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 25 + Math.random() * 15;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = 8 + Math.random() * 6;
      const size = 3 + Math.random() * 4;
      const geo = new THREE.CylinderGeometry(size * 0.7, size, 2, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a, roughness: 0.9, flatShading: true,
      });
      const island = new THREE.Mesh(geo, mat);
      island.position.set(x, y, z);
      island.castShadow = true;
      island.receiveShadow = true;
      scene.add(island);

      // Tree on island
      const treeGeo = new THREE.ConeGeometry(1.5, 3, 5);
      const treeMat = new THREE.MeshStandardMaterial({
        color: 0x2a6a3a, roughness: 0.8, flatShading: true,
      });
      const tree = new THREE.Mesh(treeGeo, treeMat);
      tree.position.set(x, y + 2.5, z);
      tree.castShadow = true;
      scene.add(tree);
    }
  }

  function createClayNodes() {
    // Interactive clay deposit nodes the player can harvest
    const positions = [
      [5, 5], [-6, 3], [3, -7], [-4, -5], [8, 2], [-3, 8],
      [12, -4], [-10, -8], [7, 12], [-8, 10],
    ];

    positions.forEach(([x, z], i) => {
      const geo = new THREE.SphereGeometry(0.6, 8, 6);
      const clayColors = [0xc87a4a, 0xb06830, 0xd4a060, 0xa05828];
      const color = clayColors[i % clayColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.7, metalness: 0.05,
      });
      const node = new THREE.Mesh(geo, mat);
      node.position.set(x, getHeight(x, z) + 0.6, z);
      node.castShadow = true;
      node.userData.type = 'clayNode';
      node.userData.amount = 10 + Math.floor(Math.random() * 20);
      node.userData.interactable = true;
      scene.add(node);
      interactables.push(node);

      // Glow ring at base
      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.3,
        transparent: true, opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(node.position);
      ring.position.y -= 0.4;
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });
  }

  function update(time) {
    // Animate sky
    const sky = scene.getObjectByName('sky');
    if (sky && sky.material.uniforms) {
      sky.material.uniforms.uTime.value = time;
    }

    // Animate crystals
    scene.children.forEach(obj => {
      if (obj.userData.type === 'crystal') {
        obj.position.y += Math.sin(time * 2 + obj.userData.floatOffset) * 0.001;
        obj.rotation.y += 0.005;
      }
    });
  }

  function getInteractables() {
    return interactables;
  }

  function removeInteractable(obj) {
    const idx = interactables.indexOf(obj);
    if (idx >= 0) interactables.splice(idx, 1);
  }

  return {
    init, update, getGroundHeight, getInteractables, removeInteractable,
  };
})();
