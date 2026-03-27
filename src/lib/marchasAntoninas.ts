export type MarchaClassificacaoItem = {
  pos: string;
  nome: string;
  pontos?: string;
  premios?: string;
};

export type MarchaAnoInfo = {
  tema?: string;
  /** Descrição curta para o card na listagem de anos (única por ano). */
  descricaoCard?: string;
  subtitulo?: string;
  classificacao?: MarchaClassificacaoItem[];
  mensagem?: string;
  outros?: { titulo: string; texto: string }[];
  youtubeUrl?: string;
};

export const MARCHAS_INFO: Record<number, MarchaAnoInfo> = {
  2025: {
    tema: "Camilo Castelo Branco em Vila Nova de Famalicão",
    descricaoCard: "Edição dedicada a Camilo Castelo Branco. Classificação, vídeo e galeria disponíveis.",
    subtitulo: "Classificação",
    classificacao: [
      {
        pos: "1º",
        nome: "Associação Humanitária dos Bombeiros Voluntários Famalicenses",
        pontos: "156 pontos",
      },
      { pos: "2º", nome: "Associação Recreativa e Cultural de Antas", pontos: "149 pontos" },
      { pos: "3º", nome: "Associação Recreativa e Cultural Flor do Monte", pontos: "126 pontos" },
      { pos: "4º", nome: "LACS, Associação Cultural São Salvador da Lagoa", pontos: "123 pontos" },
      { pos: "5º", nome: "Associação Unidos de Avidos", pontos: "117 pontos" },
      { pos: "6º", nome: "Associação Cultural Recreativa São Pedro de Riba d'Ave", pontos: "117 pontos" },
      { pos: "7º", nome: "Associação Coração Vale São Cosme", pontos: "100 pontos" },
      { pos: "8º", nome: "Associação Cultural e Desportiva de S. Martinho de Brufe", pontos: "98 pontos" },
      { pos: "9º", nome: "Associação Sentir a Terra (União de Freguesias G.O.C.)", pontos: "76 pontos" },
    ],
    youtubeUrl: "https://www.youtube.com/live/LJ5zjdh1dyc?si=fOhtyy5m5aGjPyXz&t=6485",
  },

  2017: {
    tema: "Noites de Santo António",
    descricaoCard: "Ano da vitória e dos prémios de Melhor Coreografia, Letra e Música.",
    subtitulo: "14/06/2017 - Classificação",
    classificacao: [
      {
        pos: "1º",
        nome: "Associação Unidos de Avidos",
        pontos: "108 pontos",
        premios: "Melhor Coreografia, Melhor Letra e Melhor Música",
      },
      {
        pos: "2º",
        nome: "ARCA (Associação Recreativa e Cultural de Antas)",
        pontos: "98 pontos",
        premios: "Melhor Marcha Popular, Melhores Arcos e Melhor Guarda Roupa",
      },
      { pos: "3º", nome: "CRAV (Clube Recreativo Amigos de Vilarinho)", pontos: "74 pontos" },
      { pos: "4º", nome: "LACS (Associação Cultural S. Salvador da Lagoa)", pontos: "69 pontos" },
      { pos: "5º", nome: "União de Freguesias Esmeriz-Cabeçudos", pontos: "64 pontos" },
      { pos: "6º", nome: "Associação Cultural Desportiva S. Martinho Brufe", pontos: "58 pontos" },
      { pos: "7º", nome: "Associação de Pais e Encarregados de Educação de Ribeirão", pontos: "54 pontos" },
      { pos: "8º", nome: "Associação Recreativa e Cultural Flor do Monte (Carreira)", pontos: "54 pontos" },
      { pos: "9º", nome: "TUSEFA (Tuna Sénior de Famalicão)", pontos: "50 pontos" },
      { pos: "10º", nome: "Associação Cultural e Recreativa de S. Pedro de Riba D’Ave", pontos: "49 pontos" },
    ],
    mensagem:
      "É com enorme satisfação que vimos aqui enaltecer o esforço, a dedicação e em alguns momentos até o sacrifício de todos os marchantes – coreógrafo, modelista, costureiras, ideólogo dos arcos e outros adereços, elementos da coreografia, coral, autora da letra, autor da música, músicos e restantes colaboradores. Temos consciência do nosso valor e da nossa capacidade. Como postou o nosso coreógrafo: “Determinação, Amor, Alegria, União são as palavras chaves para alcançar o sucesso. Avidos vai encantar.” Sempre UNIDOS DE AVIDOS.",
    youtubeUrl: "https://www.youtube.com/watch?v=RUujYp9sySg",
  },

  2015: {
    tema: "As festas de Santo António",
    descricaoCard: "4.º lugar e prémio de Melhor Música. Sorteio e ordem de desfile registados.",
    subtitulo: "14/06/2015 - Classificação",
    classificacao: [
      { pos: "1º", nome: "Associação de Pais e Enc. de Educação de Vilarinho das Cambas (\"O Brilho dos Deuses\")", pontos: "292 pontos" },
      { pos: "2º", nome: "Clube de Cultura e Desporto de Ribeirão (\"Era uma vez…\")", pontos: "291 pontos" },
      { pos: "3º", nome: "Associação Recreativa e Cultural de Antas (\"Arca dos sonhos\")", pontos: "271 pontos" },
      { pos: "4º", nome: "Associação Unidos de Avidos (\"As festas de Santo António\")", pontos: "266 pontos", premios: "Melhor Música" },
      { pos: "5º", nome: "Associação Unidos por Calendário (\"Santo António deu a mão a Calendário e Famalicão\")", pontos: "264 pontos" },
      { pos: "6º", nome: "Associação Cultural Desportiva S. Martinho Brufe (\"Hino à Cidade de V.N. de Famalicão\")", pontos: "246 pontos" },
      { pos: "7º", nome: "Associação Cultural S. Salvador da Lagoa (\"Santo António, Trovas, Festa e Namorados\")", pontos: "229 pontos" },
      { pos: "8º", nome: "União de Freguesias Esmeriz-Cabeçudos (\"Santo António casou São Marçal e Santa Catarina\")", pontos: "218 pontos" },
      { pos: "9º", nome: "Associação Recreativa e Cultural V.N. Famalicão (\"Made In Famalicão\")", pontos: "211 pontos" },
      { pos: "10º", nome: "Associação Recreativa e Cultural Flor do Monte (\"Os Corações\")", pontos: "207 pontos" },
    ],
    mensagem:
      "Parabéns aos vencedores e a todas as outras marchas. Agradecemos aos nossos marchantes e colaboradores o esforço dispensado. Estivemos à altura do que de melhor se faz nas Marchas Antoninas.",
    outros: [
      {
        titulo: "11/05/2015 - Sorteio e Ordem de Desfile",
        texto:
          "Associação de Pais de Vilarinho das Cambas\nLACS – S. Salvador da Lagoa\nAssociação Cultural e Desportiva de São Martinho Brufe\nTUSEFA (V. N. Famalicão)\nClube de Cultura e Desporto de Ribeirão (CCDR)\nAssociação Unidos por Calendário\nUnião de freguesias de Esmeriz e Cabeçudos\nAssociação Unidos de Avidos\nAssociação Recreativa e Cultural de Antas (ARCA)\nAssociação Recreativa e Cultural Flor do Monte (Carreira)",
      },
    ],
    youtubeUrl: undefined, // não há vídeo
  },

  2014: {
    tema: "As Maravilhas de Avidos",
    descricaoCard: "2.º lugar e Melhor Música. Ordem de desfile e vídeo da atuação.",
    subtitulo: "23/06/2014 - Classificação",
    classificacao: [
      { pos: "1º", nome: "CCDR - Clube Cultura Desporto Ribeirão (\"São tesouros\")", pontos: "332 pontos" },
      { pos: "2º", nome: "Associação Unidos de Avidos (\"As Maravilhas de Avidos\")", pontos: "313 pontos", premios: "Melhor Música" },
      { pos: "3º", nome: "ARCA - Associação Recreativa Cultural Antas (\"Portugal com história\")", pontos: "311 pontos" },
      { pos: "4º", nome: "Associação de Pais Vilarinho das Cambas (\"Famalicão terra de sonhos\")", pontos: "289 pontos" },
      { pos: "5º", nome: "Associação Cultural Desportiva S. Martinho Brufe (\"Festa das vindimas\")", pontos: "263 pontos" },
      { pos: "6º", nome: "Freguesia de Oliveira S. Mateus (\"O nosso Rio Ave\")", pontos: "256 pontos" },
      { pos: "7º", nome: "Associação Unidos por Calendários (\"As viagens de Santo António\")", pontos: "233 pontos" },
      { pos: "8º", nome: "ADC Arnoso Santa Eulália (\"Somos os cravos amorosos nas Marchas de Santo António\")", pontos: "232 pontos" },
      { pos: "9º", nome: "Assoc. Recreativa Cultural Flor Monte (\"Borboletas\")", pontos: "214 pontos" },
      { pos: "10º", nome: "CNE Agrupamento 133 – Mogege (\"Santo António e Santa Isabel juntos nas Antoninas\")", pontos: "208 pontos" },
    ],
    outros: [
      {
        titulo: "22/05/2014 - Sorteio e Ordem de Desfile",
        texto:
          "Agrupamento n.º 133 do CNE – Mogege\nFreguesia de Oliveira São Mateus (ACRA)\nAssociação de Pais de Vilarinho das Cambas\nAssociação Desportiva e Cultural de Arnoso Santa Eulália\nAssociação Recreativa e Cultural Flor do Monte\nAssociação Cultural e Desportiva de São Martinho Brufe\nClube de Cultura e Desporto de Ribeirão (CCDR)\nAssociação Unidos por Calendário\nAssociação Unidos de Avidos\nAssociação Recreativa e Cultural de Antas (ARCA)",
      },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=ercDqEH9eeo&t=44s",
  },

  2013: {
    tema: "O Sol",
    descricaoCard: "Vitória com Melhor Guarda-Roupa, Melhor Música e Marcha Mais Popular (7.º ano consecutivo).",
    subtitulo: "14/06/2013 - Classificação",
    classificacao: [
      {
        pos: "1º",
        nome: "Associação Unidos de Avidos (\"O Sol\")",
        pontos: "311 pontos",
        premios:
          "Melhor Guarda-Roupa, Melhor Música, Marcha Mais Popular (7º ano consecutivo)",
      },
      { pos: "2º", nome: "Clube de Cultura e Desporto de Ribeirão (\"Amores de Perdição\")", pontos: "300 pontos" },
      { pos: "3º", nome: "Associação Cultural S. Salvador da Lagoa (LACS) (\"Santo António, Sol, Terra e Lua\")", pontos: "281 pontos" },
      { pos: "4º", nome: "Corpo Nacional de Escutas - Agr. 257 - Gavião (\"Santo António, doce marcha\")", pontos: "273 pontos" },
      { pos: "5º", nome: "Associação Cultural Desportiva S. Martinho Brufe (\"Arco-Íris\")", pontos: "272 pontos" },
      { pos: "6º", nome: "ARCA - Associação Recreativa Cultural Antas (\"Vencer novos Adamastores\")", pontos: "264 pontos" },
      { pos: "6º", nome: "Freguesia de Oliveira S. Mateus (\"A nossa terra\")", pontos: "264 pontos" },
      { pos: "8º", nome: "Associação de Pais Vilarinho das Cambas (\"Pais carinhosos\")", pontos: "258 pontos" },
      { pos: "9º", nome: "Assoc. Cultural Recreativa S. Pedro Riba D’Ave (\"50 anos das Festas de S. Pedro\")", pontos: "234 pontos" },
      { pos: "10º", nome: "Assoc. Recreativa Cultural Flor Monte - Carreira (\"50 anos da Associação\")", pontos: "210 pontos" },
    ],
    outros: [
      {
        titulo: "24/05/2013 - Sorteio e Ordem de Desfile",
        texto:
          "Desfile a 09/06/2013 (data alternativa: 15/06).\nOrdem: 1. ARCA; 2. Oliveira S. Mateus; 3. S. Pedro de Riba de Ave; 4. Unidos de Avidos; 5. S. Martinho de Brufe; 6. CNE Gavião; 7. Flor do Monte; 8. CCD Ribeirão; 9. LACS; 10. Pais de Vilarinho das Cambas.",
      },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=7JYH0bf8nLs",
  },

  2012: {
    tema: "Nossos corações em festa",
    descricaoCard: "Triunfo com seis distinções e Marcha Mais Popular pelo 6.º ano consecutivo.",
    subtitulo: "18/06/2012 - Classificação",
    classificacao: [
      {
        pos: "1º",
        nome: "Associação Unidos de Avidos (\"Nossos corações em festa\")",
        pontos: "319 pontos",
        premios:
          "Melhores Arcos, Melhor Guarda-Roupa, Melhor Letra, Melhor Música, Melhor Coreografia e Marcha Mais Popular (6º ano consecutivo)",
      },
      { pos: "2º", nome: "Clube de Cultura e Desporto de Ribeirão (\"Acreditamos em Portugal, os portugueses são grandes\")", pontos: "305 pontos" },
      { pos: "3º", nome: "Associação Unidos por Calendário (\"Calendário faz palpitar corações\")", pontos: "256 pontos" },
      { pos: "4º", nome: "Associação Cultural S. Salvador da Lagoa (LACS) (\"Romances de Camilo\")", pontos: "240 pontos" },
      { pos: "5º", nome: "Associação Cultural Desportiva S. Martinho Brufe (\"Brufe nosso orgulho\")", pontos: "239 pontos" },
      { pos: "6º", nome: "Freguesia de Oliveira S. Mateus (\"S. Mateus florido\")", pontos: "237 pontos" },
      { pos: "7º", nome: "ARCA - Associação Recreativa Cultural Antas (\"Minha aldeia\")", pontos: "226 pontos" },
      { pos: "8º", nome: "Assoc. Desportiva e Cultural Arnoso Santa Eulália (\"Santo António foi ao mar…\")", pontos: "222 pontos" },
      { pos: "9º", nome: "Assoc. Cultural Recreativa S. Pedro Riba D’Ave (\"A têxtil segundo Narciso Ferreira\")", pontos: "217 pontos" },
      { pos: "10º", nome: "Corpo Nacional de Escutas - Agr. 257 - Gavião (\"Santo António e Gavião vão ao parque da cidade\")", pontos: "206 pontos" },
      { pos: "11º", nome: "Assoc. Recreativa Cultural Flor Monte - Carreira (\"Tradições\")", pontos: "194 pontos" },
    ],
    outros: [
      {
        titulo: "11/06/2012 - Adiada",
        texto:
          "Marchas adiadas para 16/06 por causa do mau tempo (pavilhão municipal em alternativa).",
      },
      {
        titulo: "05/06/2012 - Ficha Técnica",
        texto:
          "Tema: “Nossos corações em festa”\n\nMúsica/Arranjo: Maestro Álvaro de Sousa\nLetra: Maria José Sampaio Almeida\nModelista: Deolinda Fernandes\nConfecção: Emília Gomes\nCoreografia: Agostinho Gomes\nArcos: António Gomes e Agostinho Gomes",
      },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=B_BRuCTAyLQ",
  },

  2011: {
    tema: "A Primavera",
    descricaoCard: "Vitória com todos os prémios e Marcha Mais Popular (5.º ano consecutivo).",
    subtitulo: "14/06/2011 - Classificação",
    classificacao: [
      {
        pos: "1º",
        nome: "Associação Unidos de Avidos (\"A Primavera\")",
        pontos: "354 pontos",
        premios:
          "Melhores Arcos, Guarda-Roupa, Letra, Música, Coreografia e Marcha Mais Popular (5º ano consecutivo)",
      },
      { pos: "2º", nome: "Associação Unidos por Calendário (\"Santo António no Vale do Ave\")", pontos: "340 pontos" },
      { pos: "3º", nome: "Associação Cultural S. Salvador da Lagoa (\"Usos e costumes de Santo António\")", pontos: "338 pontos" },
      { pos: "4º", nome: "Associação Desportiva e Cultural de S. Martinho de Brufe (\"As romarias\")", pontos: "331 pontos" },
      { pos: "5º", nome: "Associação Cultural Recreativa S. Pedro de Riba d’Ave (\"Pombinhas de Santo António\")", pontos: "323 pontos" },
      { pos: "6º", nome: "Freguesia de S. Mateus (\"Noivas de Santo António\")", pontos: "316 pontos" },
      { pos: "7º", nome: "Grupo Unidos por Sezures (\"Encantos da nossa terra\")", pontos: "300 pontos" },
      { pos: "8º", nome: "ARCA (\"Bodas de Prata\")", pontos: "297 pontos" },
      { pos: "9º", nome: "Associação Desportiva e Cultural Flor do Monte (\"Ó meu rico Santo António\")", pontos: "289 pontos" },
      { pos: "10º", nome: "Assoc. Humanitária Bombeiros Voluntários Riba D’Áve (\"Manjericos de Santo António\")", pontos: "279 pontos" },
      { pos: "11º", nome: "Rancho Folclórico S. Pedro de Bairro (\"Bairro sempre alegre e a cantar\")", pontos: "278 pontos" },
    ],
    outros: [
      {
        titulo: "Destaque",
        texto: "Vitória dedicada a \"Lando\", marchante com problemas de saúde.",
      },
      {
        titulo: "Ficha Técnica e Ordem (Maio/Junho 2011)",
        texto:
          "Música/Arranjo: Álvaro de Sousa | Letra: Maria José Sampaio Almeida | Modelista: Deolinda Fernandes | Confecção: Emília Gomes | Coreografia: Hugo Fernandes | Arcos: António Gomes.\n\nOrdem de desfile (06/06): ARCA, Bombeiros Riba de Ave, Flor do Monte, Oliveira S. Mateus, S. Pedro de Riba de Ave, Unidos de Avidos (6º lugar), Bairro, LACS, Calendário, Sezures, S. Martinho de Brufe.",
      },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=tVMtvbjKIKw&t=683s",
  },

  2010: {
    tema: "As Tradições",
    descricaoCard: "3.º lugar e Marcha mais popular pelo 4.º ano consecutivo.",
    subtitulo: "13/06/2010 - Classificação e Mensagem",
    mensagem:
      "Mensagem de Hugo Silva Fernandes a encorajar os marchantes após sentimento de injustiça.",
    classificacao: [
      { pos: "1º", nome: "Associação Unidos por Calendário (\"A Vindima\")", pontos: "307 pontos" },
      { pos: "2º", nome: "Freguesia de Oliveira S. Mateus (\"Mocidade da Nossa Terra\")", pontos: "301 pontos" },
      { pos: "3º", nome: "Associação Unidos de Avidos (\"As Tradições\")", pontos: "297 pontos", premios: "Marcha mais popular - 4º ano consecutivo" },
      { pos: "4º", nome: "Assoc. Moradores de Lousado, Fradelos e Cal (\"Jardins de Santo António\")", pontos: "290 pontos" },
      { pos: "5º", nome: "Assoc. Cultural e Desportiva de S. Martinho de Brufe (\"Santo António, Água e Vinho\")", pontos: "289 pontos" },
      { pos: "6º", nome: "ARCA - Antas (\"Soldados da Paz\")", pontos: "286 pontos" },
      { pos: "7º", nome: "LACS - Lagoa (\"Famalicão a Nossa Cidade\")", pontos: "270 pontos" },
      { pos: "8º", nome: "S. Pedro de Riba de Ave (\"Santo António, Uma Tradição\")", pontos: "265 pontos" },
      { pos: "9º", nome: "Unidos por Sezures (\"100 anos da República Portuguesa\")", pontos: "260 pontos" },
      { pos: "10º", nome: "Bombeiros de Riba D’Ave (\"As Romarias\")", pontos: "244 pontos" },
      { pos: "11º", nome: "CNE de Delães (\"Arqueologia\")", pontos: "243 pontos" },
      { pos: "12º", nome: "Flor do Monte (\"Centenário da República\")", pontos: "235 pontos" },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=WvK36gKqsp8",
  },

  2009: {
    tema: "Namoricos de Santo António",
    descricaoCard: "Vitória com Marcha mais popular (3.º ano consecutivo). Bancadas cheias.",
    subtitulo: "Classificação e Destaques",
    mensagem:
      "Bancadas cheias, vitória dos \"Unidos de Avidos\" reconhecida quer pelo público quer pelo júri.",
    outros: [
      {
        titulo: "Pontuação Avidos",
        texto:
          "Arcos (59), Guarda Roupa (58), Letra (58), Música (60), Coreografia (62), Popularidade (62). Total: 359 pts (-5 pts penalização tempo) = 354.",
      },
    ],
    classificacao: [
      { pos: "1º", nome: "Associação Unidos de Avidos (\"Namoricos de Santo António\")", pontos: "354 pontos", premios: "Marcha mais popular - 3º ano consecutivo" },
      { pos: "2º", nome: "Associação Unidos por Calendário (\"Nossa terra é um jardim\")", pontos: "352 pontos" },
      { pos: "3º", nome: "Freguesia da Lagoa (\"Lagoa em Festa\")", pontos: "349 pontos" },
      { pos: "4º", nome: "CCD Ribeirão (\"Música, Linguagem Universal\")", pontos: "347 pontos" },
      { pos: "5º", nome: "ADC Arnoso Santa Eulália (\"A Marcha saiu para a rua a noite é toda tua\")", pontos: "341 pontos" },
      { pos: "6º", nome: "ARCA - Antas (\"Serenatas à janela\")", pontos: "334 pontos" },
      { pos: "7º", nome: "Oliveira de S. Mateus (\"Fogueiras de Santo António\")", pontos: "323 pontos" },
      { pos: "8º", nome: "Rancho Folclórico S. Pedro de Bairro (\"Uma Flor para Santo António\")", pontos: "304 pontos" },
      { pos: "9º", nome: "S. Pedro de Riba D’Ave (\"Marcha Famalicão Riba D’Ave nossa paixão\")", pontos: "296 pontos" },
      { pos: "10º", nome: "Bombeiros de Riba D’Ave (\"Canta-me como foi\")", pontos: "292 pontos" },
      { pos: "11º", nome: "CNE de Ruivães (\"Fontanários de Ruivães\")", pontos: "290 pontos" },
      { pos: "12º", nome: "Flor do Monte (\"Primavera\")", pontos: "284 pontos" },
      { pos: "13º", nome: "Urbanizações Municipais de Lousado e Fradelos (\"Santo António nos bairros com a reciclagem\")", pontos: "274 pontos" },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=m70XzR67HOY&t=422s",
  },

  2006: {
    tema: "Avidos Florido",
    descricaoCard: "Marchas canceladas por mau tempo. Sem classificação.",
    subtitulo: "Edição de 2006",
    classificacao: [
      {
        pos: "—",
        nome: "As marchas foram canceladas devido ao mau tempo. Não houve desfile nem classificação oficial.",
      },
    ],
  },

  2005: {
    tema: "As Vindimas",
    descricaoCard: "Tema As Vindimas. 2.º lugar na classificação final.",
    subtitulo: "Classificação",
    classificacao: [
      { pos: "2º", nome: "Associação Unidos de Avidos (\"As Vindimas\")" },
    ],
  },

  2007: {
    tema: "As Pescas",
    descricaoCard: "Tema As Pescas. 2.º lugar na classificação final.",
    subtitulo: "Classificação",
    classificacao: [
      { pos: "2º", nome: "Associação Unidos de Avidos (\"As Pescas\")" },
    ],
  },

  2008: {
    tema: "Santos Populares",
    descricaoCard: "Tema Santos Populares. 2.º lugar na classificação final.",
    subtitulo: "Classificação",
    classificacao: [
      { pos: "2º", nome: "Associação Unidos de Avidos (\"Santos Populares\")" },
    ],
  },

  2024: {
    tema: "Centenário da Capela de Santo António",
    descricaoCard: "9.º lugar. Vídeo da atuação e galeria disponíveis.",
    subtitulo: "Classificação",
    classificacao: [
      {
        pos: "9º",
        nome: "Associação Unidos de Avidos (\"Centenário da Capela de Santo António\")",
      },
    ],
    youtubeUrl: "https://www.youtube.com/live/EEkBb6OW_8M?si=CsnzokO1Ye7MKIn9&t=9017",
  },

  2019: {
    tema: "Júlio Brandão",
    descricaoCard: "Tema Júlio Brandão. 2.º lugar. Vídeo e fotos da edição.",
    subtitulo: "Classificação",
    classificacao: [
      { pos: "2º", nome: "Associação Unidos de Avidos (\"Júlio Brandão\")" },
    ],
    youtubeUrl: "https://www.youtube.com/live/FpchRmGajMc?si=w_isux2UZasxBw-0&t=3794",
  },

  2018: {
    tema: "O Pão de Santo António",
    descricaoCard: "3.º lugar com o tema O Pão de Santo António. Vídeo e galeria.",
    subtitulo: "Classificação",
    classificacao: [
      {
        pos: "3º",
        nome: "Associação Unidos de Avidos (\"O Pão de Santo António\")",
      },
    ],
    youtubeUrl: "https://www.youtube.com/watch?v=x83tqFs-E78",
  },
};

/**
 * Título no catálogo e ficha de aluguer: coincide com Marchas Antoninas quando existe
 * entrada em MARCHAS_INFO; senão usa o tema guardado na roupa (BD).
 */
export function tituloAluguerParaAno(ano: number, temaRoupa: string): string {
  const oficial = MARCHAS_INFO[ano]?.tema?.trim();
  return oficial || temaRoupa;
}
