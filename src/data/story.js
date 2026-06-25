// src/data/story.js — TEXTO COMO DADOS. Dono: narrative-designer.
// Fonte única da escrita do EMBER. O código consome estas chaves; nada de texto hardcoded.
// Tom (ART_IDENTITY): contemplativo, esperançoso, misterioso — Gris/Journey. Versos curtos.
//
// ARCO (GAME_GUIDE §7.3): os fragmentos por Coração são um COLAR CONTÍNUO entre biomas —
// Bosque planta a pergunta, Recife/Dunas aprofundam, o Núcleo entrega a verdade e fecha a jornada.
// Chaves estáveis: title, subtitle, intro[], startPrompt, firstHint, biomes[], ending.
//   biomes[i] = { hearts[3], climax, threshold }  (na ordem de BIOMES em config/biomes.js)
//   o último bioma (Núcleo) usa `ending` no lugar do limiar — é o fim da jornada.

export const STORY = {
  title: 'EMBER',
  subtitle: 'a última centelha',

  intro: [
    'O mundo dormiu no escuro.',
    'Toda a luz se apagou.',
    'Menos você.',
  ],

  startPrompt: 'toque para acender',
  firstHint: 'reúna a luz... e leve-a a um Coração',

  biomes: [
    { // O Bosque — despertar / esperança (planta a pergunta)
      hearts: [
        'Um Coração desperta.\nO escuro recua.',
        'A luz se lembra do caminho.',
        'Algo arrancou a luz daqui.\nMas ela volta.',
      ],
      climax: 'O bosque acorda inteiro.',
      threshold: 'Há mais escuridão além das árvores.',
    },
    { // O Recife — memória / fluidez (aprofunda o mistério)
      hearts: [
        'As águas guardavam um brilho antigo.',
        'Houve um dia em que tudo era luz.',
        'A escuridão veio do fundo —\ne de muito além.',
      ],
      climax: 'O recife respira em cor.',
      threshold: 'A luz te puxa adiante.',
    },
    { // As Dunas — perda / propósito (aponta a origem)
      hearts: [
        'Aqui a luz secou primeiro.',
        'Lembra por que vieste:\nreacender a origem.',
        'O Núcleo te espera, além da areia.',
      ],
      climax: 'As dunas reluzem como ouro vivo.',
      threshold: 'Um último limiar. A origem.',
    },
    { // O Núcleo — origem / reencontro (a verdade, o fim)
      hearts: [
        'O Núcleo dormia.\nTua luz o toca.',
        'Era de ti que toda a luz nascia.',
        'Acende. Lembra.\nVolta a arder.',
      ],
      climax: 'O Núcleo desperta —\ne com ele, todo o mundo.',
    },
  ],

  // fim da jornada (após reacender o Núcleo)
  ending: ['Tu eras a centelha.', 'E a centelha era o mundo.'],
  endingPrompt: 'toque para recomeçar a jornada',
};
