import { avaliacoes } from '../data/cardapio.js';

// Avaliações. Sem dados verificados, tudo aparece marcado como demonstrativo.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const estrelas = (nota) =>
  `<span class="estrelas" aria-hidden="true">${Array.from({ length: 5 }, (_, i) =>
    `<svg viewBox="0 0 20 20" class="${i < Math.round(nota) ? 'cheia' : ''}"><path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z"/></svg>`).join('')}</span>`;

export function renderAvaliacoes(section) {
  const demo = !avaliacoes.verificadas;
  section.querySelector('.aval-resumo').innerHTML = `
    ${demo ? '<p class="selo-demo">Demonstração · conteúdo fictício</p>' : ''}
    <p class="aval-media"><span class="aval-nota">${avaliacoes.media.toFixed(1).replace('.', ',')}</span>${estrelas(avaliacoes.media)}</p>
    <p class="aval-legenda">${demo
      ? 'Nota de exemplo. Ainda não há avaliações verificadas; quando houver, elas aparecem aqui com a origem indicada.'
      : `Média das avaliações${avaliacoes.fonte ? ` no ${esc(avaliacoes.fonte)}` : ''}.`}</p>`;

  section.querySelector('.aval-lista').innerHTML = avaliacoes.itens
    .map((a) => `
      <li class="aval-card revela">
        ${demo ? '<p class="aval-aviso">Comentário demonstrativo — conteúdo fictício para visualização do layout.</p>' : ''}
        <p class="aval-estrelas"><span class="sr-only">Nota ${a.nota} de 5${demo ? ' (exemplo)' : ''}</span>${estrelas(a.nota)}</p>
        <blockquote>${esc(a.texto)}</blockquote>
        <p class="aval-autor">${esc(a.autor)}${!demo && avaliacoes.fonte ? ` <span>· via ${esc(avaliacoes.fonte)}</span>` : ''}</p>
      </li>`)
    .join('');
}
