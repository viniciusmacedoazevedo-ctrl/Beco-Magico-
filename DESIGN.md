# Beco Mágico — Design

## Mundo visual
Um beco do centro antigo, à noite, iluminado por um único poste de luz de sódio.
Duas texturas se alternam: a **noite** (verde-quase-preto, luz âmbar) e o **papel de botica**
(rótulos de farmácia antiga, tinta cor de sangue de boi, carimbos). A placa esmaltada azul de rua
é o selo da marca.

## Tokens
| token | valor | uso |
|---|---|---|
| `--night` | `#0d1311` | fundo das cenas noturnas |
| `--night-2` | `#16201c` | superfícies sobre a noite |
| `--paper` | `#efe6d2` | fundo de papel |
| `--paper-2` | `#e2d4b6` | rótulos, cartões |
| `--ink` | `#1c1a16` | texto sobre papel |
| `--oxblood` | `#7d2124` | tinta de destaque, carimbos |
| `--verdigris` | `#4f9a86` | detalhe frio, links na noite |
| `--lamp` | `#f4b24a` | luz de sódio, CTA principal |
| `--enamel` | `#1d3a70` | placa de rua |

## Tipografia
- Display: **Gloock** (serifa de alto contraste, cara de letreiro pintado).
- Texto: **Newsreader** (serifa de leitura com ótico).
- Etiquetas e números: **Martian Mono** em caixa-alta, espaçada.

## Assinaturas
- Lanterna: na cena de abertura a luz segue o cursor e revela uma frase escondida.
- Placa esmaltada "BECO MÁGICO" como logotipo.
- Rótulos de botica numerados (Nº 01…) para o cardápio.
- Laboratório: o visitante mistura até 3 ingredientes e recebe uma poção com nome e rótulo.

## Movimento
Lento e de luz: brilho, fade e deslocamentos pequenos. Respeita `prefers-reduced-motion`.
