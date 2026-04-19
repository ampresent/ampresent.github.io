/**
 * water.js — Water bodies: pond, streams, waterfall
 */
const Water = (() => {
  let scene;

  function init(_scene) {
    scene = _scene;
    createPond();
    createStreams();
    createWaterfall();
  }

  function createPond() {
    // Main pond near the workshop
    const pondGeo = new THREE.CircleGeometry(5, 32);
    const pondMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x2266aa) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float wave = sin(dist * 20.0 - uTime * 2.0) * 0.5 + 0.5;
          float ripple = sin(dist * 40.0 - uTime * 3.0) * 0.3;
          vec3 col = uColor + wave * 0.1 + ripple * 0.05;
          float alpha = smoothstep(0.5, 0.3, dist) * 0.7;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-12, 0.05, -5);
    pond.userData.type = 'water';
    pond.userData.shaderMat = pondMat;
    scene.add(pond);

    // Pond edge stones
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 4.5 + Math.random() * 0.8;
      const x = Math.cos(angle) * r - 12;
      const z = Math.sin(angle) * r - 5;
      const y = World.getGroundHeight(x, z);
      const geo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a, roughness: 0.9, flatShading: true,
      });
      const stone = new THREE.Mesh(geo, mat);
      stone.position.set(x, y + 0.1, z);
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      stone.castShadow = true;
      scene.add(stone);
    }
  }

  function createStreams() {
    // Winding stream from pond toward south
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x3388cc,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.3,
    });

    const points = [
      [-12, -10], [-14, -14], [-12, -18], [-9, -22], [-6, -25],
    ];

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i];
      const [x2, z2] = points[i + 1];
      const mx = (x1 + x2) / 2;
      const mz = (z1 + z2) / 2;
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);

      const y = World.getGroundHeight(mx, mz);
      const geo = new THREE.PlaneGeometry(1.5, len, 1, 4);
      const stream = new THREE.Mesh(geo, streamMat);
      stream.rotation.x = -Math.PI / 2;
      stream.rotation.z = -angle;
      stream.position.set(mx, y + 0.08, mz);
      scene.add(stream);
    }
  }

  function createWaterfall() {
    // Small waterfall on a cliff face
    const wfGeo = new THREE.PlaneGeometry(1.5, 4, 1, 8);
    const wfMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.x += sin(pos.y * 5.0 + uTime * 3.0) * 0.05;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float flow = fract(vUv.y * 3.0 - uTime * 1.5);
          float alpha = smoothstep(0.0, 0.3, flow) * smoothstep(1.0, 0.7, flow);
          vec3 col = mix(vec3(0.2, 0.5, 0.9), vec3(0.6, 0.8, 1.0), flow);
          gl_FragColor = vec4(col, alpha * 0.6);
        }
      `,
    });

    const waterfall = new THREE.Mesh(wfGeo, wfMat);
    waterfall.position.set(20, 4, -15);
    waterfall.userData.type = 'waterfall';
    waterfall.userData.shaderMat = wfMat;
    scene.add(waterfall);

    // Splash at bottom
    const splashGeo = new THREE.CircleGeometry(1.5, 16);
    const splashMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.3,
    });
    const splash = new THREE.Mesh(splashGeo, splashMat);
    splash.rotation.x = -Math.PI / 2;
    splash.position.set(20, 0.1, -13);
    scene.add(splash);

    // Mist particles
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xaaccee, transparent: true, opacity: 0.15,
      });
      const mist = new THREE.Mesh(geo, mat);
      mist.position.set(
        20 + (Math.random() - 0.5) * 3,
        0.5 + Math.random() * 2,
        -13 + (Math.random() - 0.5) * 2
      );
      mist.userData.type = 'mist';
      mist.userData.floatOffset = Math.random() * Math.PI * 2;
      scene.add(mist);
    }
  }

  function update(time) {
    // Animate water shaders
    scene.children.forEach(obj => {
      if (obj.userData.shaderMat) {
        obj.userData.shaderMat.uniforms.uTime.value = time;
      }
      if (obj.userData.type === 'mist') {
        obj.position.y += Math.sin(time + obj.userData.floatOffset) * 0.002;
        obj.material.opacity = 0.1 + Math.sin(time * 0.5 + obj.userData.floatOffset) * 0.05;
      }
    });
  }

  return { init, update };
})();
