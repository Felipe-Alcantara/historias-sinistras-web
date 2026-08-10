/** Fabricas de dados para teste. Mantem os casos legiveis e sem repeticao. */

import type { Historia } from '../dominio/tipos'

export function criarHistoria(parcial: Partial<Historia> = {}): Historia {
  return {
    id: 'h1',
    titulo: 'O ultimo trem',
    situacao: 'Um homem desce do trem e sabe imediatamente que a esposa morreu.',
    solucao: 'Ele e cego e conta as paradas; nesse dia ninguem anunciou a estacao.',
    fatosChave: [
      { id: 'f1', texto: 'O homem e cego.' },
      { id: 'f2', texto: 'Ele contava as paradas anunciadas.' },
    ],
    dificuldade: 'media',
    temas: ['misterio'],
    avisosConteudo: [],
    duracaoMin: 20,
    origem: { tipo: 'autoral', referencia: '' },
    ...parcial,
  }
}

/** Cria um baralho com ids previsiveis: h1, h2, h3... */
export function criarBaralho(quantidade: number): Historia[] {
  return Array.from({ length: quantidade }, (_, indice) =>
    criarHistoria({ id: `h${indice + 1}`, titulo: `Historia ${indice + 1}` }),
  )
}

/**
 * Aleatoriedade previsivel: devolve os valores na ordem dada e repete o ultimo
 * quando acaba. Torna o sorteio deterministico no teste.
 */
export function aleatorioFixo(...valores: number[]): () => number {
  let indice = 0
  return () => {
    const valor = valores[Math.min(indice, valores.length - 1)] ?? 0
    indice += 1
    return valor
  }
}
