import * as THREE from 'three';
import { Burger } from './burger.js';
import { buildStudio, makeRenderer, makeCamera, frameCamera } from './stage.js';

// Renderiza as fotos do cardápio com o mesmo motor, luz e câmera da cena principal.
// Cada produto gera duas imagens: montado e com as camadas abertas.
const W = 800, H = 1000;
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 16));
const nextIdle = () => new Promise((res) => idle(res));
const toUrl = (canvas) =>
  new Promise((res) => canvas.toBlob((b) => res(b ? URL.createObjectURL(b) : canvas.toDataURL('image/png')), 'image/webp', 0.9));

export async function renderSnapshots(produtos, onReady) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const renderer = makeRenderer(canvas, { dpr: 1, preserve: true });
  renderer.setSize(W, H, false);
  const scene = new THREE.Scene();
  const { shadow, envTex } = buildStudio(renderer, scene);
  const camera = makeCamera(W / H);

  try {
    for (const p of produtos) {
      await nextIdle();
      const burger = new Burger(p.receita, { spread: 3.7, seed: p.id.length * 7 });
      scene.add(burger.group);
      burger.group.rotation.y = -0.45;
      const shots = {};
      for (const [nome, e] of [['fechado', 0], ['aberto', 1]]) {
        burger.setExplode(e);
        shadow.position.y = burger.bottomY() - 0.01;
        shadow.material.opacity = e ? 0.45 : 0.85;
        const ext = burger.extent();
        frameCamera(camera, { h: ext.top - ext.bottom + 0.4, targetY: (ext.top + ext.bottom) / 2, w: 2.9, fill: e ? 0.9 : 0.86, elevation: e ? 11 : 16 });
        renderer.render(scene, camera);
        shots[nome] = await toUrl(canvas);
      }
      scene.remove(burger.group);
      burger.dispose();
      onReady(p.id, shots);
    }
  } finally {
    envTex.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
