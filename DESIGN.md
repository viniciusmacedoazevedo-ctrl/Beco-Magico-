# Beco Mágico — Design

## Mundo visual
Campanha gastronômica de edição de Halloween. Fundo preto quente, luz âmbar vinda de trás do
produto, fumaça lenta, névoa rasteira, lua cheia e poucos morcegos — sempre em segundo plano.
A comida é sempre fotografia real; efeitos nunca cobrem ingredientes.

## Tokens (`css/styles.css`, `:root`)
| token | valor | uso |
|---|---|---|
| `--bg` | `#0b0907` | fundo base (preto quente) |
| `--bg-raise` | `#14110f` | faixas |
| `--surface` | `#1a1716` | cards, superfícies secundárias (cinza escuro) |
| `--line` | `rgb(255 236 214 / .1)` | divisores |
| `--text` | `#f6ede1` | texto (creme) |
| `--muted` | `#b2a293` | texto secundário |
| `--ember` | `#f07c1e` | laranja: ações, destaques, estrelas |
| `--amber` | `#ffb24d` | luz, foco, reflexos |
| `--mustard` | `#f4b43c` | preços, selos de demonstração |

## Tipografia
Big Shoulders Display (títulos, caixa-alta) · Geist (texto) · Geist Mono (rótulos). Só essas três.

## Componentes e efeitos
- **Fumaça** (`js/fx/fumaca.js`): shader WebGL procedural, resolução reduzida, 24–30 fps,
  pausa fora da tela. Coluna atrás do produto + névoa na base.
- **Experiência** (`js/sections/experiencia.js`): fotografia real; a luz percorre as camadas
  (slider, botões, ou o scroll local enquanto o visitante não toca nos controles). Com fotos
  recortadas de cada camada (`experiencia.camadasFotos`), passa a separar as camadas de verdade.
- **Beco 3D** (`js/sections/localizacao.js`): cena Three.js pequena (fachadas, janelas,
  postes, placa, marcador, lua, morcegos, névoa). Carregada sob demanda; versão leve no celular.
- **Selo de demonstração**: pílula tracejada mostarda para todo conteúdo fictício.

## Movimento
Entrada do hero ~1,3 s (foto revelada pela luz, fumaça surgindo), sem bloquear navegação.
`prefers-reduced-motion`: sem animações; fumaça e beco viram quadros estáticos.
