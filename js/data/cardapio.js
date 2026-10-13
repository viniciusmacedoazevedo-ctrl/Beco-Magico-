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

// Localização. Enquanto `ficticio` for true, o endereço aparece marcado como demonstração
// e nenhum link de mapa ou rota é exibido.
export const local = {
  ficticio: true,
  nome: 'Beco Mágico',
  endereco: 'Beco das Lanternas, 13',
  bairro: 'Vila das Sombras',
  horario: '', // ex.: 'Qua a dom, 18h às 0h'
  mapaUrl: '', // só é usado quando ficticio = false
};

// Avaliações. Enquanto `verificadas` for false, a seção mostra apenas conteúdo demonstrativo,
// identificado como fictício. Para publicar avaliações reais, troque os itens, informe a origem
// (`fonte`, ex.: 'Google') e mude `verificadas` para true.
export const avaliacoes = {
  verificadas: false,
  fonte: '',
  media: 5,
  itens: [
    { autor: 'Cliente exemplo 1', nota: 5, texto: 'Espaço para um comentário verificado. Este texto existe só para mostrar o tamanho e o estilo do card.' },
    { autor: 'Cliente exemplo 2', nota: 5, texto: 'Aqui entra a opinião real de quem visitou o Beco Mágico, com a origem indicada logo abaixo.' },
    { autor: 'Cliente exemplo 3', nota: 4, texto: 'Comentários curtos e longos se ajustam ao card sem quebrar o layout.' },
  ],
};

// Experiência interativa: uma fotografia real do produto e as paradas de luz em cada camada
// (`y` = posição vertical da camada na foto, de 0 a 1).
// Quando houver fotos recortadas de cada camada do MESMO hambúrguer, preencha `camadasFotos`
// (de baixo para cima, PNG/WebP com fundo transparente, todas do mesmo tamanho e ângulo):
// a experiência passa a separar as camadas de verdade.
export const experiencia = {
  produto: 'cheeseburger',
  foto: 'assets/fotos/cheeseburger.webp',
  fotoMobile: 'assets/fotos/cheeseburger-m.webp',
  largura: 1200,
  altura: 895,
  alt: 'Cheeseburger fotografado sobre tábua de madeira escura: pão com gergelim, tomate, cebola roxa, alface, cheddar derretido e carne grelhada.',
  paradas: [
    { rotulo: 'Pão com gergelim', y: 0.21 },
    { rotulo: 'Tomate', y: 0.36 },
    { rotulo: 'Cebola roxa', y: 0.415 },
    { rotulo: 'Alface', y: 0.47 },
    { rotulo: 'Cheddar', y: 0.545 },
    { rotulo: 'Carne grelhada', y: 0.615 },
    { rotulo: 'Pão', y: 0.75 },
  ],
  camadasFotos: [],
};

export const produtos = [
  {
    id: 'cheeseburger',
    nome: 'Cheeseburger',
    categoria: 'Clássico',
    descricao: 'Carne grelhada, cheddar, alface, tomate e cebola roxa.',
    preco: 12,
    foto: 'assets/fotos/cheeseburger.webp',
    alt: 'Cheeseburger com cheddar derretido, alface, tomate e cebola roxa',
  },
  {
    id: 'double-smash',
    nome: 'Double Smash',
    categoria: 'Bovino',
    descricao: 'Dois smash burgers de bordas crocantes, queijo americano e pão brioche.',
    preco: 15,
    foto: 'assets/fotos/double-smash.webp',
    alt: 'Double Smash com duas carnes finas e queijo americano no pão brioche',
  },
  {
    id: 'bbq-bacon',
    nome: 'BBQ Bacon',
    categoria: 'Bovino',
    descricao: 'Bacon defumado, onion rings, cheddar e molho barbecue da casa.',
    preco: 16,
    foto: 'assets/fotos/bbq-bacon.webp',
    alt: 'BBQ Bacon com bacon, onion rings, cheddar e molho barbecue',
  },
  {
    id: 'crispy-chicken',
    nome: 'Crispy Chicken',
    categoria: 'Frango',
    descricao: 'Frango frito no buttermilk, picles, coleslaw e maionese picante.',
    preco: 13,
    foto: 'assets/fotos/crispy-chicken.webp',
    alt: 'Crispy Chicken com frango empanado, picles e coleslaw',
  },
];

export const formatarPreco = (valor) =>
  `${config.moeda} ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
