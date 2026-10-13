import { config, produtos } from './data/cardapio.js';
import { renderCardapio, aplicarFotos, fotosReais } from './sections/cardapio.js';
import { webglAvailable } from './three/stage.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGL = webglAvailable();
root.classList.toggle('sem-3d', !hasGL);
root.classList.toggle('movimento-reduzido', reduced);
if (!reduced) root.classList.add('anima');

// Cardápio (sempre disponível, mesmo sem 3D).
const lista = document.querySelector('#cardapio-lista');
renderCardapio(lista);
fotosReais().forEach((f) => aplicarFotos(lista, f.id, f));

// Lista acessível das camadas do produto da abertura.
const heroProduto = produtos[0];
document.querySelector('#anatomia-lista').innerHTML = [...heroProduto.receita]
  .reverse()
  .map((c) => `<li>${c.rotulo}</li>`)
  .join('');

// Canal de pedidos: só aparece quando existe.
if (config.pedidosUrl) {
  document.querySelectorAll('[data-pedido]').forEach((el) => {
    el.href = config.pedidosUrl;
    el.hidden = false;
  });
}

// Cabeçalho: ganha fundo quando sai da abertura.
const header = document.querySelector('.topo');
const onScroll = () => header.classList.toggle('topo--solido', scrollY > innerHeight * 0.6);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

document.querySelector('[data-remontar]')?.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
});

document.querySelector('#ano').textContent = new Date().getFullYear();

// Entradas de seção discretas.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('visivel');
      io.unobserve(e.target);
    }
  }
}, { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.revela').forEach((el) => io.observe(el));

if (hasGL) {
  try {
    const { initAnatomia } = await import('./sections/anatomia.js');
    initAnatomia({
      section: document.querySelector('#anatomia'),
      produto: heroProduto,
      reduced,
      onFirstFrame: () => root.classList.add('palco-pronto'),
    });
  } catch (err) {
    console.warn('Cena 3D indisponível:', err);
    root.classList.add('sem-3d');
  }

  // Fotos do cardápio renderizadas em 3D quando o cardápio se aproxima (ou após a abertura assentar).
  const faltando = produtos.filter((p) => !(p.foto && p.fotoAberta));
  if (faltando.length) {
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      obs.disconnect();
      const { renderSnapshots } = await import('./three/snapshots.js');
      renderSnapshots(faltando, (id, shots) => aplicarFotos(lista, id, shots)).catch((err) => {
        console.warn('Fotos 3D indisponíveis:', err);
        root.classList.add('sem-fotos');
      });
    };
    const obs = new IntersectionObserver((en) => en.some((x) => x.isIntersecting) && start(), { rootMargin: '1200px 0px' });
    obs.observe(lista);
    setTimeout(start, 2200);
  }
} else {
  root.classList.add('sem-fotos');
}
