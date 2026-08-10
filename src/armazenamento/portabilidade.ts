/**
 * Exportacao e importacao de pacotes de historias em JSON.
 *
 * E a valvula de escape da regra critica: como o unico lugar onde as historias
 * escritas pela pessoa existem e o navegador dela, exportar precisa ser simples
 * e importar precisa ser seguro.
 *
 * Importar SOMA ao que ja existe; nunca substitui. Uma importacao errada pode
 * ser desfeita apagando o que entrou, mas um estado sobrescrito nao volta.
 */

import { semDuplicatas, validarLote } from '../dominio/validacao'
import { falha, sucesso, type Historia, type Resultado } from '../dominio/tipos'
import { estadoInicial, type EstadoSalvo } from './persistencia'

export const FORMATO_PACOTE = 'historias-sinistras'
export const VERSAO_PACOTE = 1

export interface Pacote {
  formato: typeof FORMATO_PACOTE
  versao: number
  exportadoEm: string
  historias: Historia[]
}

/** Serializa as historias da pessoa em um texto pronto para salvar em arquivo. */
export function exportarPacote(historias: readonly Historia[], agora: Date = new Date()): string {
  const pacote: Pacote = {
    formato: FORMATO_PACOTE,
    versao: VERSAO_PACOTE,
    exportadoEm: agora.toISOString(),
    historias: [...historias],
  }
  return JSON.stringify(pacote, null, 2)
}

export interface ResultadoImportacao {
  estado: EstadoSalvo
  /** Quantas historias novas entraram. */
  adicionadas: number
  /** Quantas ja existiam com o mesmo id e foram mantidas como estavam. */
  repetidas: number
  /** Motivos das historias que o pacote trazia mas nao puderam ser lidas. */
  descartadas: string[]
}

/**
 * Le um pacote e devolve um estado novo, sem tocar no recebido.
 *
 * Aceita dois formatos: o pacote completo exportado pelo app e uma lista solta
 * de historias — que e o que o script gerador e pacotes da comunidade produzem.
 */
export function importarPacote(texto: string, estadoAtual: EstadoSalvo = estadoInicial()): Resultado<ResultadoImportacao> {
  const limpo = texto.trim()
  if (!limpo) return falha('O pacote esta vazio.')

  let analisado: unknown
  try {
    analisado = JSON.parse(limpo)
  } catch {
    return falha('Isso nao e um JSON valido. Confira se o texto foi copiado inteiro.')
  }

  const bruto = extrairHistorias(analisado)
  if (!bruto.ok) return bruto

  const lote = validarLote(bruto.valor, 'pacote')
  if (!lote.ok) return lote

  const idsExistentes = new Set(estadoAtual.personalizadas.map((historia) => historia.id))
  const novas = semDuplicatas(lote.valor.historias).filter((historia) => !idsExistentes.has(historia.id))
  const repetidas = lote.valor.historias.length - novas.length

  if (novas.length === 0 && lote.valor.descartadas.length === 0) {
    return falha('O pacote nao trouxe nenhuma historia nova: todas ja estavam no aparelho.')
  }

  return sucesso({
    estado: {
      ...estadoAtual,
      personalizadas: [...estadoAtual.personalizadas, ...novas],
    },
    adicionadas: novas.length,
    repetidas,
    descartadas: lote.valor.descartadas,
  })
}

function extrairHistorias(analisado: unknown): Resultado<unknown[]> {
  if (Array.isArray(analisado)) return sucesso(analisado)

  if (typeof analisado === 'object' && analisado !== null) {
    const objeto = analisado as Record<string, unknown>
    if (Array.isArray(objeto.historias)) return sucesso(objeto.historias)
  }

  return falha('Formato desconhecido: esperava uma lista de historias ou um pacote com o campo "historias".')
}

/** Nome de arquivo estavel e ordenavel para o download do pacote. */
export function nomeDoArquivo(agora: Date = new Date()): string {
  const data = agora.toISOString().slice(0, 10)
  return `historias-sinistras-${data}.json`
}
