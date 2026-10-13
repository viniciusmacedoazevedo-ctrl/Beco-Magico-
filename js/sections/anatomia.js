import * as THREE from 'three';
import { Burger } from '../three/burger.js';
import { buildStudio, makeRenderer, makeCamera, frameCamera } from '../three/stage.js';

// Hero + anatomia: uma seção alta com palco sticky. O progresso do scroll dentro dela
// abre o hambúrguer, mostra os rótulos de cada camada e termina na frase de fechamento.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function initAnatomia({ section, produto, reduced, onFirstFrame }) {
  const stage = section.querySelector('.palco');
  const canvas = section.querySelector('.palco-canvas');
  const heroCopy = section.querySelector('.hero-copy');
  const finalCopy = section.querySelector('.final-copy');
  const cue = section.querySelector('.scroll-cue');
  const rail = section.querySelector('.trilho-fill');
  const labelsEl = section.querySelector('.rotulos');

  const coarse = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  const renderer = makeRenderer(canvas, { dpr });
  const scene = new THREE.Scene();
  const { shadow } = buildStudio(renderer, scene);
  const camera = makeCamera();
  const burger = new Burger(produto.receita, { spread: 5.0 });
  scene.add(burger.group);

  // Rótulos: um por camada, alternando lados. Ordem de entrada de cima para baixo.
  const n = burger.layers.length;
  const labels = burger.layers.map((l, i) => {
    const el = document.createElement('div');
    el.className = 'rotulo';
    el.dataset.lado = i % 2 ? 'dir' : 'esq';
    el.innerHTML = `<span class="rotulo-num">${String(n - i).padStart(2, '0')}</span><span class="rotulo-nome">${l.rotulo}</span>`;
    labelsEl.appendChild(el);
    return { el, layer: l, order: n - 1 - i };
  });

  const state = {
    target: 0, p: 0, w: 0, h: 0,
    intro: reduced ? 1 : 0, introStart: performance.now(),
    mx: 0, my: 0, sx: 0, sy: 0,
    running: false, raf: 0, last: performance.now(), first: true,
  };

  function measure() {
    const r = stage.getBoundingClientRect();
    state.w = r.width;
    state.h = r.height;
    renderer.setSize(state.w, state.h, false);
    for (const lab of labels) lab.width = lab.el.offsetWidth;
    camera.aspect = state.w / state.h;
    camera.updateProjectionMatrix();
    readScroll();
    render(true);
  }

  function readScroll() {
    if (reduced) return;
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    state.target = clamp01(-r.top / Math.max(1, total));
  }

  const v = new THREE.Vector3(), right = new THREE.Vector3();
  function project(world) {
    v.copy(world).project(camera);
    return { x: (v.x * 0.5 + 0.5) * state.w, y: (-v.y * 0.5 + 0.5) * state.h };
  }

  function render(force = false) {
    const p = state.p;
    const portrait = state.w / state.h < 0.9;
    const e = reduced ? 0 : range(0.1, 0.66, p);

    // Entrada: as camadas chegam levemente abertas e assentam; a luz sobe junto.
    const it = state.intro;
    const introEase = 1 - Math.pow(1 - it, 3);
    burger.setExplode(Math.max(e, (1 - introEase) * 0.16));
    renderer.toneMappingExposure = lerp(0.15, 1.05, introEase) * lerp(1, 0.7, range(0.9, 1, p));

    // Rotação: começa em três quartos, gira ao abrir; o mouse inclina de leve.
    state.sx += (state.mx - state.sx) * 0.06;
    state.sy += (state.my - state.sy) * 0.06;
    burger.group.rotation.y = -0.5 + e * 0.85 + state.sx * 0.12 + (1 - introEase) * -0.6;
    burger.group.rotation.x = state.sy * 0.04;
    burger.group.position.y = (1 - introEase) * 0.9;

    shadow.position.y = burger.bottomY() + burger.group.position.y - 0.02;
    shadow.material.opacity = lerp(0.85, 0.35, e) * introEase;
    shadow.scale.setScalar(lerp(1, 1.25, e));

    // Enquadramento: no desktop o produto começa à direita do título e centraliza ao abrir;
    // no fim ele cede espaço para a frase de fechamento. No retrato começa abaixo do título.
    const move = range(0.04, 0.4, p);
    const outro = range(0.8, 0.9, p);
    const ext = burger.extent();
    frameCamera(camera, {
      h: ext.top - ext.bottom + lerp(0.3, 0.5, e),
      w: lerp(2.8, 3.1, e),
      targetY: (ext.top + ext.bottom) / 2,
      fill: (portrait ? lerp(0.84, 0.58, e) : lerp(0.58, 0.8, e)) * lerp(1, portrait ? 0.8 : 0.92, outro),
      elevation: lerp(17, 9, e),
      panX: portrait ? 0 : lerp(0.19, 0, move) + outro * 0.2,
      panY: portrait ? lerp(-0.17, 0, move) * (1 - e) + outro * 0.14 : 0,
    });

    renderer.render(scene, camera);

    // Textos sincronizados com o progresso.
    const heroOut = range(0.02, 0.1, p);
    heroCopy.style.opacity = String(1 - heroOut);
    heroCopy.style.transform = `translate3d(0, ${-heroOut * 40}px, 0)`;
    heroCopy.style.visibility = heroOut > 0.99 ? 'hidden' : 'visible';
    cue.style.opacity = String((1 - range(0.0, 0.05, p)) * introEase);
    const fin = range(0.83, 0.91, p);
    finalCopy.style.opacity = String(fin);
    finalCopy.style.transform = `translate3d(0, ${(1 - fin) * 30}px, 0)`;
    finalCopy.style.visibility = fin < 0.01 ? 'hidden' : 'visible';
    if (rail) rail.style.transform = `scaleY(${p})`;

    // O halo de luz do fundo acompanha o produto.
    const center = project(burger.group.getWorldPosition(new THREE.Vector3()));
    stage.style.setProperty('--gx', `${((center.x / state.w) * 100).toFixed(1)}%`);
    stage.style.setProperty('--gy', `${((center.y / state.h) * 100).toFixed(1)}%`);

    // Rótulos presos à borda de cada camada.
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const fade = 1 - range(0.78, 0.85, p);
    for (const lab of labels) {
      const a = range(0.5 + lab.order * 0.022, 0.6 + lab.order * 0.022, p) * fade;
      if (a <= 0.001) {
        if (lab.el.style.opacity !== '0') lab.el.style.opacity = '0';
        continue;
      }
      const world = lab.layer.object.getWorldPosition(new THREE.Vector3());
      const c = project(world);
      const edge = project(world.clone().addScaledVector(right, 1.18));
      const radius = Math.abs(edge.x - c.x);
      const side = lab.el.dataset.lado === 'dir' ? 1 : -1;
      let x = c.x + side * (radius + (portrait ? 6 : 18));
      // Nunca sai da tela: encosta na borda se faltar espaço.
      if (side > 0) x = Math.min(x, state.w - 10 - lab.width);
      else x = Math.max(x, 10 + lab.width);
      lab.el.style.opacity = String(a);
      lab.el.style.transform = `translate3d(${x}px, ${c.y}px, 0) translate(${side > 0 ? 0 : -100}%, -50%)`;
    }

    if (state.first) {
      state.first = false;
      onFirstFrame?.();
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    if (state.intro < 1) state.intro = clamp01((now - state.introStart) / 1100);
    const k = 1 - Math.exp(-dt * 9);
    const before = state.p;
    state.p += (state.target - state.p) * k;
    if (Math.abs(state.target - state.p) < 0.0004) state.p = state.target;
    const moving = state.p !== before || state.intro < 1 || Math.abs(state.mx - state.sx) > 0.001 || Math.abs(state.my - state.sy) > 0.001;
    if (moving) render();
    state.raf = moving ? requestAnimationFrame(tick) : 0;
  }

  function wake() {
    if (!state.raf && state.running) {
      state.last = performance.now();
      state.raf = requestAnimationFrame(tick);
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    state.running = entry.isIntersecting;
    if (state.running) wake();
  });
  io.observe(section);

  addEventListener('scroll', () => {
    readScroll();
    wake();
  }, { passive: true });

  if (!coarse && !reduced) {
    addEventListener('pointermove', (ev) => {
      state.mx = (ev.clientX / innerWidth) * 2 - 1;
      state.my = (ev.clientY / innerHeight) * 2 - 1;
      wake();
    }, { passive: true });
  }

  const ro = new ResizeObserver(() => measure());
  ro.observe(stage);
  measure();
  state.running = true;
  wake();

  return { burger };
}
