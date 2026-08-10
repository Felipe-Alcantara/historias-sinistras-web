/**
 * Vocabulario do jogo. Este arquivo nao importa React, nao le `window` e nao
 * conhece armazenamento: e a definicao pura do que existe no dominio.
 */

/** Quao dificil e reconstruir a historia so com perguntas fechadas. */
export const DIFICULDADES = ['facil', 'media', 'dificil'] as const
export type Dificuldade = (typeof DIFICULDADES)[number]

/** Assunto predominante da historia. Serve para filtrar o baralho. */
export const TEMAS = [
  'crime',
  'acidente',
  'sobrenatural',
  'misterio',
  'humor-negro',
  'historico',
  'tecnologia',
  'cotidiano',
] as const
export type Tema = (typeof TEMAS)[number]

/**
 * As quatro respostas que o mestre pode dar.
 *
 * O jogo original (black stories) usa tres: sim, nao e irrelevante.
 * "quase-la" e uma extensao deste projeto, pedida para encurtar partidas em que
 * o grupo esta no caminho certo mas travado.
 */
export const RESPOSTAS = ['sim', 'nao', 'irrelevante', 'quase-la'] as const
export type Resposta = (typeof RESPOSTAS)[number]

export const ROTULO_RESPOSTA: Record<Resposta, string> = {
  sim: 'Sim',
  nao: 'Nao',
  irrelevante: 'Irrelevante',
  'quase-la': 'Quase la',
}

/** De onde a historia veio. Fica gravado em cada carta para dar rastreabilidade. */
export const TIPOS_ORIGEM = ['autoral', 'ia', 'internet', 'edicao-oficial'] as const
export type TipoOrigem = (typeof TIPOS_ORIGEM)[number]

export interface Origem {
  tipo: TipoOrigem
  /** Edicao, site ou prompt que deu origem a historia. Vazio quando desconhecido. */
  referencia: string
}

/**
 * Um ponto que os jogadores precisam descobrir para a historia ser considerada
 * resolvida. O mestre marca cada um conforme o grupo acerta.
 */
export interface FatoChave {
  id: string
  texto: string
}

/**
 * Uma carta. `situacao` e a frente, lida em voz alta para todos;
 * `solucao` e o verso, que so o mestre le ate a revelacao final.
 */
export interface Historia {
  id: string
  titulo: string
  situacao: string
  solucao: string
  fatosChave: FatoChave[]
  dificuldade: Dificuldade
  temas: Tema[]
  /**
   * Etiquetas de conteudo pesado. Sao informativas: aparecem antes da carta
   * comecar, mas nunca escondem nem removem a historia do sorteio.
   */
  avisosConteudo: string[]
  /** Duracao estimada da rodada, em minutos. */
  duracaoMin: number
  origem: Origem
}

/** Historia criada ou editada dentro do app, guardada no aparelho de quem joga. */
export type HistoriaPersonalizada = Historia

/** Resultado de uma operacao que pode falhar por dado invalido vindo de fora. */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erros: string[] }

export function sucesso<T>(valor: T): Resultado<T> {
  return { ok: true, valor }
}

export function falha<T>(...erros: string[]): Resultado<T> {
  return { ok: false, erros }
}
