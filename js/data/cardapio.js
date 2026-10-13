// Fonte única do conteúdo do site.
// Produtos, descrições e valores vêm dos prints de referência enviados pelo cliente.
// Confirme preços e moeda antes de publicar.

export const config = {
  marca: 'Beco Mágico',
  segmento: 'Hamburgueria',
  moeda: 'R$',
  // Link real de pedidos (WhatsApp, iFood, site próprio…). Vazio = nenhum botão de pedido aparece.
  pedidosUrl: '',
  pedidosRotulo: 'Pedir agora',
};

// `receita` lista as camadas de baixo para cima, usando os ingredientes de js/three/ingredients.js.
// `foto` / `fotoAberta`: caminho para fotografia real. Se vazio, a imagem é renderizada em 3D.
export const produtos = [
  {
    id: 'cheeseburger',
    nome: 'Cheeseburger',
    categoria: 'Clássico',
    descricao: 'Carne grelhada, cheddar, alface, tomate e cebola roxa.',
    preco: 12,
    receita: [
      { tipo: 'paoBase', rotulo: 'Pão' },
      { tipo: 'carne', rotulo: 'Carne grelhada' },
      { tipo: 'cheddar', rotulo: 'Cheddar' },
      { tipo: 'cebolaRoxa', rotulo: 'Cebola roxa' },
      { tipo: 'tomate', rotulo: 'Tomate' },
      { tipo: 'alface', rotulo: 'Alface' },
      { tipo: 'paoTopo', rotulo: 'Pão' },
    ],
    foto: '',
    fotoAberta: '',
  },
  {
    id: 'double-smash',
    nome: 'Double Smash',
    categoria: 'Bovino',
    descricao: 'Dois smash burgers de bordas crocantes, queijo americano e pão brioche.',
    preco: 15,
    receita: [
      { tipo: 'paoBase', rotulo: 'Pão brioche', opcoes: { brioche: true } },
      { tipo: 'smash', rotulo: 'Smash burger' },
      { tipo: 'queijoAmericano', rotulo: 'Queijo americano' },
      { tipo: 'smash', rotulo: 'Smash burger' },
      { tipo: 'queijoAmericano', rotulo: 'Queijo americano' },
      { tipo: 'paoTopo', rotulo: 'Pão brioche', opcoes: { brioche: true } },
    ],
    foto: '',
    fotoAberta: '',
  },
  {
    id: 'bbq-bacon',
    nome: 'BBQ Bacon',
    categoria: 'Bovino',
    descricao: 'Bacon defumado, onion rings, cheddar e molho barbecue da casa.',
    preco: 16,
    receita: [
      { tipo: 'paoBase', rotulo: 'Pão' },
      { tipo: 'carne', rotulo: 'Carne' },
      { tipo: 'cheddar', rotulo: 'Cheddar' },
      { tipo: 'molhoBarbecue', rotulo: 'Molho barbecue' },
      { tipo: 'bacon', rotulo: 'Bacon defumado' },
      { tipo: 'onionRings', rotulo: 'Onion rings' },
      { tipo: 'paoTopo', rotulo: 'Pão' },
    ],
    foto: '',
    fotoAberta: '',
  },
  {
    id: 'crispy-chicken',
    nome: 'Crispy Chicken',
    categoria: 'Frango',
    descricao: 'Frango frito no buttermilk, picles, coleslaw e maionese picante.',
    preco: 13,
    receita: [
      { tipo: 'paoBase', rotulo: 'Pão' },
      { tipo: 'coleslaw', rotulo: 'Coleslaw' },
      { tipo: 'frango', rotulo: 'Frango frito' },
      { tipo: 'picles', rotulo: 'Picles' },
      { tipo: 'maionesePicante', rotulo: 'Maionese picante' },
      { tipo: 'paoTopo', rotulo: 'Pão' },
    ],
    foto: '',
    fotoAberta: '',
  },
];

export const formatarPreco = (valor) =>
  `${config.moeda} ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
