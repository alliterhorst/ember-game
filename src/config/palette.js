// src/config/palette.js — cores. Dono: art-director (do ART_IDENTITY.md).
// Conceito: centelha QUENTE/clara contra um BOSQUE adormecido FRIO e dessaturado.
export const PALETTE = {
  // Bosque ADORMECIDO (frio, apagado)
  bg: '#0f1618',
  fog: '#0f1618',
  ground: '#3a4548',
  groundRim: '#6a7a88',
  treeSleep: '#2a3235',
  leafSleep: '#4a5660',
  // a CENTELHA (clara, viva, quente)
  spark: '#ffffff',
  sparkCore: '#ffffff',
  sparkGlow: '#ffaa44',
  // coletáveis / perigo
  mote: '#a8b0ff',
  shadow: '#1a1f22',
  // Bosque REACESO (vibrante) — usado na transformação
  groundLit: '#357a4a', // verde vivo (clareado do antigo #2d5a3d, lia escuro sob a névoa nova)
  groundHalo: '#6fc488', // halo de luz no chão sob a centelha
  mossLit: '#2f6b3e', // tufos/gramíneas reacesas (ancoragem das árvores)
  trunkLit: '#5a4a2a',
  leafLit: '#4dd064',
  flower: '#ffaa44',
  bioglow: '#66ff88',
  ether: '#aaffff',
  // Mundo VIVO: a luz que respira (REACESO é mais claro/aberto/quente que adormecido)
  fogLit: '#bfe6d0', // verde-menta CLARO (antes #16302a era verde-quase-preto = o "void")
  bgLit: '#9fd9c4', // fundo desacoplado da névoa, p/ silhuetas saltarem
  skyLit: '#dfffe9', // luz hemisférica (céu) do mundo vivo
  sunLit: '#fff1d6', // a "lua" fria vira sol quente
};
