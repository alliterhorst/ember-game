// src/data/story.js — TEXTO COMO DADOS. Dono: narrative-designer.
//
// Fonte única de toda a escrita narrativa de EMBER. O código (main.js, Hud, tela
// inicial) CONSOME estas strings — nada de texto narrativo hardcoded nas cenas.
// Se mudar a história, muda AQUI; a engenharia só lê as chaves.
//
// Tom (ART_IDENTITY.md): contemplativo, esperançoso, misterioso — refs Gris e Journey.
// Sem texto pesado: a história se conta pela transformação do mundo (apagado→vivo).
// A história NÃO contradiz a premissa da GAME_BIBLE §7 (o mundo se apagou; você é a
// última centelha; reacender revela, em fragmentos, o que apagou o mundo, até o Núcleo).
//
// Regra de escrita: versos curtos, não parágrafos. A maioria ≤ ~40 caracteres,
// legível numa tela de celular sem rolar. Português do Brasil.
//
// Chaves estáveis (a engenharia depende delas):
//   title       -> tela inicial
//   intro[]     -> versos sob o título (premissa poética)
//   startPrompt -> chamada universal (mouse + toque) pra começar
//   firstHint   -> 1 linha que ensina o objetivo nos primeiros segundos
//   hearts[]    -> 3 falas, uma por Coração reaceso (substitui "um Coração desperta")
//   climax      -> fala do bosque renascendo (substitui "o bosque renasce")
//   closing     -> 1 linha após o clímax, insinua a jornada maior (opcional)

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

  // Progressão emocional: esperança -> mistério -> limiar do clímax.
  hearts: [
    'Um Coração desperta.\nO escuro recua.',   // 1: a esperança nasce — a primeira prova de que dá pra reacender
    'A luz se lembra do caminho.',              // 2: aprofunda o mistério — o mundo conhecia essa luz antes de adormecer
    'Falta um. O bosque prende a respiração.',  // 3: tensão/limiar — conduz direto ao clímax
  ],

  climax: 'O bosque acorda inteiro.',

  closing: 'Há mais escuridão além das árvores.',
};
