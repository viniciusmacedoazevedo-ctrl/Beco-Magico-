import { config, local } from './data/cardapio.js';
import { renderCardapio } from './sections/cardapio.js';
import { renderAvaliacoes } from './sections/avaliacoes.js';
import { initExperiencia } from './sections/experiencia.js';
import { criarFumaca } from './fx/fumaca.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const low = coarse || innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
root.classList.toggle('movimento-reduzido', reduced);
if (!reduced) root.classList.add('anima');

// Conteúdo vindo da fonte única.
renderCardapio(document.querySelector('#cardapio-lista'));
renderAvaliacoes(document.querySelector('#avaliacoes'));

// Localização: endereço fictício sempre identificado; link de mapa só para endereço real.
const loc = document.querySelector('#localizacao');
loc.querySelector('[data-local="endereco"]').textContent = local.endereco;
loc.querySelector('[data-local="bairro"]').textContent = local.bairro;
loc.querySelector('[data-local="horario"]').textContent = local.horario || 'A confirmar';
loc.querySelector('.selo-demo').hidden = !local.ficticio;
loc.querySelector('[data-local="aviso"]').hidden = !local.ficticio;
if (!local.ficticio && local.mapaUrl) {
  const a = loc.querySelector('[data-local="mapa"]');
  a.href = local.mapaUrl;
  a.hidden = false;
}

// Canal de pedidos: só aparece quando existe.
if (config.pedidosUrl) {
  document.querySelectorAll('[data-pedido]').forEach((el) => {
    el.href = config.pedidosUrl;
    el.hidden = false;
  });
}

// Cabeçalho: compacto, ganha fundo ao rolar; menu recolhível no celular.
const header = document.querySelector('.topo');
const onScroll = () => header.classList.toggle('topo--solido', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
const menuBtn = header.querySelector('.topo-menu-btn');
const fecharMenu = () => {
  header.classList.remove('menu-aberto');
  menuBtn.setAttribute('aria-expanded', 'false');
};
menuBtn.addEventListener('click', () => {
  const aberto = header.classList.toggle('menu-aberto');
  menuBtn.setAttribute('aria-expanded', String(aberto));
});
header.querySelectorAll('.topo-nav a').forEach((a) => a.addEventListener('click', fecharMenu));
addEventListener('keydown', (e) => e.key === 'Escape' && fecharMenu());

// Link ativo no cabeçalho conforme a seção visível.
const links = new Map([...header.querySelectorAll('.topo-nav a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
const secObs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const a = links.get(e.target.id);
    if (a && e.isIntersecting) {
      links.forEach((l) => l.removeAttribute('aria-current'));
      a.setAttribute('aria-current', 'true');
    }
  }
}, { rootMargin: '-45% 0px -50% 0px' });
links.forEach((_, id) => {
  const el = document.getElementById(id);
  if (el) secObs.observe(el);
});

document.querySelector('#ano').textContent = new Date().getFullYear();

// Entradas discretas.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('visivel');
      io.unobserve(e.target);
    }
  }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.revela').forEach((el) => io.observe(el));

// Hero: fumaça atrás do hambúrguer, névoa na base, leve parallax.
const hero = document.querySelector('.hero');
const scale = low ? 0.34 : 0.5;
const fps = low ? 24 : 30;
const heroFumaca = criarFumaca(hero.querySelector('.hero-fumaca'), { focus: [0, -0.02], column: 0.85, fog: 0.1, intensity: 1, scale, fps, reduced });
criarFumaca(hero.querySelector('.hero-nevoa'), { focus: [0, -0.6], column: 0, fog: 0.75, intensity: low ? 0.32 : 0.42, scale: scale * 0.8, fps, reduced });
if (heroFumaca) {
  const ajustarFoco = () => heroFumaca.set({ focus: innerWidth / innerHeight < 0.9 ? [0, -0.06] : [0, -0.02] });
  addEventListener('resize', ajustarFoco);
  ajustarFoco();
}
if (!reduced) {
  const prato = hero.querySelector('.hero-prato');
  let raf = 0, mx = 0, my = 0;
  const update = () => {
    raf = 0;
    const y = Math.min(scrollY, innerHeight);
    prato.style.transform = `translate3d(${mx * 10}px, ${y * 0.12 + my * 8}px, 0)`;
  };
  const req = () => (raf ||= requestAnimationFrame(update));
  addEventListener('scroll', () => scrollY < innerHeight * 1.2 && req(), { passive: true });
  if (!coarse) {
    hero.addEventListener('pointermove', (e) => {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
      req();
    }, { passive: true });
  }
}

// Experiência do hambúrguer (local à seção).
const exp = document.querySelector('#experiencia');
initExperiencia(exp, { reduced });
criarFumaca(exp.querySelector('.exp-fumaca'), { focus: [0, -0.1], column: 0.7, fog: 0.5, intensity: 0.7, scale: scale * 0.9, fps, reduced });

// Beco 3D: carregado só quando a seção se aproxima.
const becoObs = new IntersectionObserver(async ([e]) => {
  if (!e.isIntersecting) return;
  becoObs.disconnect();
  try {
    await document.fonts.ready;
    const { initBeco } = await import('./sections/localizacao.js');
    initBeco(loc, { reduced, low });
  } catch (err) {
    console.warn('Cena do beco indisponível:', err);
    loc.classList.add('beco-sem-3d');
  }
}, { rootMargin: '600px 0px' });
becoObs.observe(loc);
