import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { shadowTexture } from './textures.js';

const FOV = 28;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

// Luz de estúdio: principal âmbar do alto à esquerda, contraluz laranja atrás à direita,
// preenchimento baixo. Compartilhada entre a cena principal e as fotos do cardápio.
export function buildStudio(renderer, scene, { shadows = true } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.32;

  const key = new THREE.DirectionalLight('#ffd9b0', 3.4);
  key.position.set(-4.5, 6.5, 5);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -3.6;
    key.shadow.camera.right = key.shadow.camera.top = 3.6;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 4;
  }
  const rim = new THREE.DirectionalLight('#ff8b3d', 5.2);
  rim.position.set(4.5, 2.6, -5.5);
  const rim2 = new THREE.DirectionalLight('#ffb27a', 2.2);
  rim2.position.set(-5, 1.5, -4);
  const kick = new THREE.DirectionalLight('#fff0dc', 0.9);
  kick.position.set(5, 0.5, 4);
  const fill = new THREE.HemisphereLight('#ffe7cc', '#1a0e06', 0.4);
  scene.add(key, key.target, rim, rim2, kick, fill);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  scene.add(shadow);
  return { key, shadow, envTex };
}

export function makeRenderer(canvas, { alpha = true, dpr = 1, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha, powerPreference: 'high-performance', preserveDrawingBuffer: preserve,
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

// Enquadra um objeto de altura h e largura w, com elevação de câmera em graus
// e deslocamento de tela (pan) em frações da área visível.
export function frameCamera(camera, { h, w, fill = 0.8, elevation = 14, panX = 0, panY = 0, targetY = 0 }) {
  const distH = h / 2 / TAN / fill;
  const distW = w / 2 / (TAN * camera.aspect) / fill;
  const dist = Math.max(distH, distW);
  const el = THREE.MathUtils.degToRad(elevation);
  const visH = 2 * dist * TAN;
  const visW = visH * camera.aspect;
  const ox = -panX * visW;
  const oy = -panY * visH;
  camera.position.set(ox, targetY + oy + Math.sin(el) * dist, Math.cos(el) * dist);
  camera.lookAt(ox, targetY + oy, 0);
  camera.updateMatrixWorld();
  return dist;
}

export function makeCamera(aspect = 1) {
  return new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100);
}
