import * as THREE from 'three';

// Beco noturno em 3D para a seção de localização: cena pequena (fachadas, janelas acesas,
// postes, placa, névoa, lua e alguns morcegos). Carregada só quando a seção se aproxima.
// Em celulares a cena usa menos detalhes e resolução menor; com movimento reduzido, um quadro fixo.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(w, h, draw, color = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function paralelepipedos() {
  const r = rng(5);
  const t = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0d0a09';
    ctx.fillRect(0, 0, w, h);
    const rows = 14;
    const rh = h / rows;
    for (let y = 0; y < rows; y++) {
      let x = (y % 2) * -18;
      while (x < w) {
        const sw = 30 + r() * 26;
        const v = 48 + r() * 30;
        ctx.fillStyle = `rgb(${v + 8},${v},${v - 6})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y * rh + 2, sw - 4, rh - 4, 8);
        ctx.fill();
        x += sw;
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 22);
  t.anisotropy = 8;
  return t;
}

function brilho() {
  return canvasTex(128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,200,130,1)');
    g.addColorStop(0.25, 'rgba(255,140,50,0.55)');
    g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
}

function nevoa() {
  const r = rng(9);
  return canvasTex(512, 256, (ctx, w, h) => {
    for (let i = 0; i < 40; i++) {
      const x = r() * w, y = h * (0.3 + r() * 0.5), rad = 40 + r() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(200,170,150,0.16)');
      g.addColorStop(1, 'rgba(200,170,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

function placa() {
  return canvasTex(1024, 384, (ctx, w, h) => {
    ctx.fillStyle = '#120d0b';
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 28);
    ctx.fill();
    ctx.strokeStyle = '#f07c1e';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#ff9a45';
    ctx.shadowColor = '#ff7a1a';
    ctx.shadowBlur = 36;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 150px "Big Shoulders Display", Impact, sans-serif';
    ctx.fillText('BECO MÁGICO', w / 2, h / 2 + 6);
  });
}

function morcego() {
  return canvasTex(128, 64, (ctx) => {
    ctx.fillStyle = '#050403';
    ctx.beginPath();
    ctx.moveTo(64, 30);
    ctx.bezierCurveTo(54, 14, 30, 10, 4, 20);
    ctx.bezierCurveTo(16, 24, 20, 32, 18, 40);
    ctx.bezierCurveTo(28, 34, 36, 36, 42, 44);
    ctx.bezierCurveTo(48, 38, 56, 38, 64, 46);
    ctx.bezierCurveTo(72, 38, 80, 38, 86, 44);
    ctx.bezierCurveTo(92, 36, 100, 34, 110, 40);
    ctx.bezierCurveTo(108, 32, 112, 24, 124, 20);
    ctx.bezierCurveTo(98, 10, 74, 14, 64, 30);
    ctx.fill();
  });
}

function lua() {
  return canvasTex(256, 256, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, w * 0.2, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,214,160,0.35)');
    g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
    const d = ctx.createRadialGradient(w * 0.44, w * 0.42, 0, w / 2, w / 2, w * 0.22);
    d.addColorStop(0, '#ffe9c8');
    d.addColorStop(1, '#e9a868');
    ctx.fillStyle = d;
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,90,40,0.25)';
    [[0.46, 0.44, 0.04], [0.56, 0.55, 0.03], [0.5, 0.6, 0.02]].forEach(([x, y, rr]) => {
      ctx.beginPath();
      ctx.arc(w * x, w * y, w * rr, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

export function initBeco(section, { reduced, low }) {
  const canvas = section.querySelector('.beco-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: low ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0807');
  scene.fog = new THREE.FogExp2('#24150d', 0.042);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);

  scene.add(new THREE.HemisphereLight('#6a4a5a', '#120a06', 1.1));

  // Chão de paralelepípedos, levemente molhado.
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 70),
    new THREE.MeshStandardMaterial({ map: paralelepipedos(), roughness: 0.42, metalness: 0.25, color: '#8a7564' }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.z = -28;
  scene.add(chao);

  // Fachadas dos dois lados, com telhados pontudos em algumas.
  const r = rng(13);
  const paredeMat = new THREE.MeshStandardMaterial({ color: '#2e2427', roughness: 0.9 });
  const telhadoMat = new THREE.MeshStandardMaterial({ color: '#120e0f', roughness: 0.95 });
  const janelas = [];
  for (const lado of [-1, 1]) {
    let z = -1.5;
    while (z > -58) {
      const d = 4 + r() * 3;
      const h = 6 + r() * 6;
      const w = 4;
      const casa = new THREE.Mesh(new THREE.BoxGeometry(w, h, d - 0.25), paredeMat);
      casa.position.set(lado * (4.5 + w / 2), h / 2, z - d / 2);
      scene.add(casa);
      if (r() > 0.45) {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.2 + r() * 1.5, 4, 1), telhadoMat);
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(w / Math.max(w, d), 1, (d - 0.25) / Math.max(w, d));
        roof.position.set(casa.position.x, h + 1.1, casa.position.z);
        scene.add(roof);
      }
      const andares = Math.floor((h - 2) / 2.1);
      const cols = Math.max(1, Math.floor(d / 1.8));
      for (let a = 0; a < andares; a++) {
        for (let c = 0; c < cols; c++) {
          if (a === 0 && r() > 0.5) continue;
          janelas.push({ x: lado * 4.48, y: 2.4 + a * 2.1, z: z - (c + 0.5) * (d / cols), lado, acesa: r() < (low ? 0.28 : 0.34), tom: r() });
        }
      }
      z -= d;
    }
  }
  const janGeo = new THREE.PlaneGeometry(0.62, 0.95);
  const janMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const jan = new THREE.InstancedMesh(janGeo, janMat, janelas.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  const quente = [new THREE.Color('#ffb150'), new THREE.Color('#ff8a2a'), new THREE.Color('#ffd28a')];
  const apagada = new THREE.Color('#0d0a0a');
  janelas.forEach((j, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -j.lado * Math.PI / 2);
    m.compose(new THREE.Vector3(j.x, j.y, j.z), q, s);
    jan.setMatrixAt(i, m);
    jan.setColorAt(i, j.acesa ? quente[Math.floor(j.tom * 3)].clone().multiplyScalar(0.55 + j.tom * 0.5) : apagada);
  });
  scene.add(jan);

  // Postes com luz âmbar e halo.
  const glowTex = brilho();
  const postes = [[-3.6, -4], [3.6, -15], [-3.6, -22], [3.6, -32]];
  const luzes = [];
  postes.forEach(([x, z], i) => {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4, 8), telhadoMat);
    poste.position.set(x, 2, z);
    scene.add(poste);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffc27a', toneMapped: false }));
    lamp.position.set(x * 0.9, 4.05, z);
    scene.add(lamp);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 }));
    halo.scale.setScalar(2.4);
    halo.position.copy(lamp.position);
    scene.add(halo);
    if (i < (low ? 2 : 4)) {
      const L = new THREE.PointLight('#ff9b45', 9, 11, 1.8);
      L.position.copy(lamp.position);
      scene.add(L);
      luzes.push({ L, base: 9, fase: i * 1.7 });
    }
  });

  // A loja: porta acesa, placa e marcador.
  const portaZ = -11;
  const porta = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ color: '#ff9440', toneMapped: false }));
  porta.position.set(4.47, 1.2, portaZ);
  porta.rotation.y = -Math.PI / 2;
  scene.add(porta);
  const portaLuz = new THREE.PointLight('#ff8a30', 10, 7, 1.6);
  portaLuz.position.set(3.4, 1.6, portaZ);
  scene.add(portaLuz);
  const placaMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: placa(), toneMapped: false, transparent: true }));
  placaMesh.position.set(2.9, 3.6, portaZ + 0.3);
  placaMesh.rotation.y = -0.35;
  scene.add(placaMesh);
  const pinTex = canvasTex(128, 160, (ctx) => {
    ctx.fillStyle = '#f07c1e';
    ctx.shadowColor = '#ff7a1a';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(64, 56, 38, Math.PI, 0);
    ctx.quadraticCurveTo(102, 96, 64, 150);
    ctx.quadraticCurveTo(26, 96, 26, 56);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0d03';
    ctx.beginPath();
    ctx.arc(64, 56, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  const pin = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTex, toneMapped: false, depthTest: false, transparent: true }));
  pin.scale.set(0.55, 0.69, 1);
  pin.position.set(2.9, 5.0, portaZ + 0.3);
  pin.renderOrder = 10;
  scene.add(pin);

  // Lua, morcegos e névoa rasteira.
  const luaS = new THREE.Sprite(new THREE.SpriteMaterial({ map: lua(), fog: false, transparent: true, depthWrite: false }));
  luaS.scale.setScalar(16);
  luaS.position.set(-5, 22, -70);
  scene.add(luaS);
  const batTex = morcego();
  const morcegos = Array.from({ length: low ? 3 : 6 }, (_, i) => {
    const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: batTex, fog: false, transparent: true, depthWrite: false }));
    const base = 0.5 + (i % 3) * 0.18;
    b.scale.set(base, base / 2, 1);
    scene.add(b);
    return { b, base, raio: 3 + i * 1.1, alt: 9 + (i % 3) * 1.6, vel: 0.18 + i * 0.03, fase: i * 1.3 };
  });
  const nevTex = nevoa();
  const nevoas = Array.from({ length: low ? 3 : 6 }, (_, i) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 5),
      new THREE.MeshBasicMaterial({ map: nevTex, transparent: true, depthWrite: false, opacity: 0.55, color: '#ffb487' }),
    );
    p.rotation.x = -Math.PI / 2.4;
    p.position.set(0, 0.35 + i * 0.05, -4 - i * 6);
    scene.add(p);
    return { p, fase: i * 2.1 };
  });

  // Câmera: leve deslocamento conforme a seção passa pela tela e com o ponteiro (desktop).
  const state = { prog: 0, mx: 0, my: 0, sx: 0, sy: 0, visible: false, raf: 0, last: 0 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 62 : 48;
    camera.updateProjectionMatrix();
    draw(performance.now());
  }
  function readScroll() {
    const rect = section.getBoundingClientRect();
    state.prog = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight + rect.height)));
  }
  function draw(now) {
    const t = now / 1000;
    state.sx += (state.mx - state.sx) * 0.05;
    state.sy += (state.my - state.sy) * 0.05;
    const portrait = camera.aspect < 0.8;
    camera.position.set(state.sx * 0.5 + (portrait ? 0.6 : 0), 1.7 + state.sy * -0.2 + Math.sin(t * 0.3) * 0.04, 7.5 - state.prog * 4.5);
    camera.lookAt(portrait ? 1.6 : 0.8, 2.6, -18);
    if (!reduced) {
      luzes.forEach((l) => (l.L.intensity = l.base * (0.92 + 0.08 * Math.sin(t * 7 + l.fase) * Math.sin(t * 2.3 + l.fase))));
      pin.position.y = 5.0 + Math.sin(t * 2) * 0.12;
      morcegos.forEach((m) => {
        const a = t * m.vel + m.fase;
        m.b.position.set(-5 + Math.cos(a) * m.raio, m.alt + Math.sin(a * 2) * 0.6, -40 + Math.sin(a) * m.raio * 0.6);
        m.b.scale.y = (m.base / 2) * (0.35 + 0.65 * Math.abs(Math.sin(t * 9 + m.fase)));
      });
      nevoas.forEach((n) => (n.p.position.x = Math.sin(t * 0.08 + n.fase) * 1.6));
    }
    renderer.render(scene, camera);
  }
  function loop(now) {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    if (now - state.last >= (low ? 1000 / 30 : 1000 / 60)) {
      state.last = now;
      draw(now);
    }
    state.raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!reduced && state.visible && !document.hidden && !state.raf) state.raf = requestAnimationFrame(loop);
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    state.visible = e.isIntersecting;
    kick();
  }).observe(section);
  document.addEventListener('visibilitychange', kick);
  addEventListener('scroll', () => {
    readScroll();
    if (reduced) draw(performance.now());
  }, { passive: true });
  if (!low && !reduced) {
    section.addEventListener('pointermove', (e) => {
      const rect = section.getBoundingClientRect();
      state.mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.my = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }, { passive: true });
  }
  readScroll();
  resize();
  section.classList.add('beco-pronto');
}
