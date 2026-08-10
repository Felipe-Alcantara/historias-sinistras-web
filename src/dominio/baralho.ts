/**
 * Montagem e sorteio do baralho.
 *
 * O problema que originou o projeto e a repeticao de historias, entao o sorteio
 * e sem reposicao: uma carta so pode voltar depois que todas as outras do filtro
 * atual ja sairam.
 */

import type { Dificuldade, Historia, Tema } from './tipos'

/** Funcao de aleatoriedade injetavel: os testes passam uma sequencia previsivel. */
export type Aleatorio = () => number

export interface FiltroBaralho {
  /** Lista vazia significa "todas as dificuldades". */
  dificuldades: readonly Dificuldade[]
  /** Lista vazia significa "todos os temas". */
  temas: readonly Tema[]
  /** Ids que a pessoa escondeu do baralho. */
  ocultas: readonly string[]
}

export const FILTRO_VAZIO: FiltroBaralho = { dificuldades: [], temas: [], ocultas: [] }

export function filtrarBaralho(historias: readonly Historia[], filtro: FiltroBaralho): Historia[] {
  const ocultas = new Set(filtro.ocultas)
  return historias.filter((historia) => {
    if (ocultas.has(historia.id)) return false
    if (filtro.dificuldades.length > 0 && !filtro.dificuldades.includes(historia.dificuldade)) return false
    if (filtro.temas.length > 0 && !historia.temas.some((tema) => filtro.temas.includes(tema))) return false
    return true
  })
}

/** Fisher-Yates. Nao altera a lista recebida. */
export function embaralhar<T>(itens: readonly T[], aleatorio: Aleatorio = Math.random): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    const atual = copia[i] as T
    copia[i] = copia[j] as T
    copia[j] = atual
  }
  return copia
}

export interface Sorteio {
  /** A carta sorteada, ou `null` quando o filtro nao deixou nenhuma historia. */
  historia: Historia | null
  /** Historico atualizado, ja incluindo a carta sorteada. */
  idsJogados: string[]
  /**
   * Verdadeiro quando o baralho acabou e o historico foi zerado para recomecar.
   * A interface usa isso para avisar que a partir daqui as historias repetem.
   */
  cicloReiniciado: boolean
}

/**
 * Sorteia a proxima carta sem repetir enquanto houver carta inedita.
 *
 * Quando todas ja sairam, o historico e reiniciado e o ciclo recomeca — mas a
 * carta recem-jogada e evitada, para nunca cair a mesma duas vezes seguidas.
 */
export function sortearProxima(
  disponiveis: readonly Historia[],
  idsJogados: readonly string[],
  aleatorio: Aleatorio = Math.random,
): Sorteio {
  if (disponiveis.length === 0) {
    return { historia: null, idsJogados: [...idsJogados], cicloReiniciado: false }
  }

  const jogados = new Set(idsJogados)
  const ineditas = disponiveis.filter((historia) => !jogados.has(historia.id))

  if (ineditas.length > 0) {
    const escolhida = sortearUma(ineditas, aleatorio)
    return {
      historia: escolhida,
      idsJogados: [...idsJogados, escolhida.id],
      cicloReiniciado: false,
    }
  }

  // Baralho esgotado: recomeca, evitando emendar a mesma carta duas vezes.
  const ultima = idsJogados[idsJogados.length - 1]
  const candidatas = disponiveis.length > 1 ? disponiveis.filter((h) => h.id !== ultima) : disponiveis
  const escolhida = sortearUma(candidatas, aleatorio)
  return { historia: escolhida, idsJogados: [escolhida.id], cicloReiniciado: true }
}

function sortearUma(historias: readonly Historia[], aleatorio: Aleatorio): Historia {
  const indice = Math.floor(aleatorio() * historias.length)
  const seguro = Math.min(historias.length - 1, Math.max(0, indice))
  return historias[seguro] as Historia
}

export interface ProgressoBaralho {
  total: number
  jogadas: number
  restantes: number
}

/** Quanto do filtro atual ja foi jogado. Alimenta o medidor da tela inicial. */
export function calcularProgresso(
  disponiveis: readonly Historia[],
  idsJogados: readonly string[],
): ProgressoBaralho {
  const jogados = new Set(idsJogados)
  const jogadas = disponiveis.filter((historia) => jogados.has(historia.id)).length
  return { total: disponiveis.length, jogadas, restantes: disponiveis.length - jogadas }
}
