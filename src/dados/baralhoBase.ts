/**
 * Baralho que vem junto com o aplicativo.
 *
 * Uma colecao por arquivo. Separar assim mantem cada arquivo revisavel, deixa o
 * diff de um lote novo legivel e permite que o script gerador escreva em uma
 * colecao sem tocar nas outras.
 *
 * Todo JSON passa pela mesma validacao dos pacotes importados: os arquivos sao
 * escritos por gente e por script, entao merecem a mesma desconfianca — e uma
 * carta quebrada nao pode derrubar o jogo inteiro.
 */

import comicas from './comica.json'
import pesadas from './pesada.json'
import reais from './real.json'
import daInternet from './internet.json'
import creepypastas from './creepypasta.json'

import { semDuplicatas, validarLote } from '../dominio/validacao'
import { COLECOES, type Colecao, type Historia } from '../dominio/tipos'

const ARQUIVOS: Record<Colecao, unknown> = {
  comica: comicas,
  pesada: pesadas,
  real: reais,
  internet: daInternet,
  creepypasta: creepypastas,
}

const historias: Historia[] = []
const problemas: string[] = []

for (const colecao of COLECOES) {
  const resultado = validarLote(ARQUIVOS[colecao], `baralho ${colecao}`)
  if (resultado.ok) {
    // A colecao vem do arquivo em que a carta mora: e impossivel um lote ficar
    // com a etiqueta errada por esquecimento de quem escreveu o JSON.
    historias.push(...resultado.valor.historias.map((historia) => ({ ...historia, colecao })))
    problemas.push(...resultado.valor.descartadas)
  } else {
    problemas.push(...resultado.erros)
  }
}

export const BARALHO_BASE: Historia[] = semDuplicatas(historias)

/** Problemas encontrados no baralho embutido, para o app saber o que ignorou. */
export const PROBLEMAS_DO_BARALHO_BASE: string[] = problemas

export function contarPorColecao(): Record<Colecao, number> {
  return COLECOES.reduce(
    (contagem, colecao) => {
      contagem[colecao] = BARALHO_BASE.filter((historia) => historia.colecao === colecao).length
      return contagem
    },
    {} as Record<Colecao, number>,
  )
}

if (import.meta.env.DEV && PROBLEMAS_DO_BARALHO_BASE.length > 0) {
  console.warn('[baralho base] historias ignoradas:', PROBLEMAS_DO_BARALHO_BASE)
}
