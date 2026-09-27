/**
 * Os scripts Python validam cartas antes de gravar e, para isso, repetem o
 * vocabulário do domínio em scripts/comum.py. Este teste lê aquele arquivo como
 * texto e falha se as listas ou os limites divergirem de tipos.ts e
 * validacao.ts — um script que aceitasse um tema que o app descarta gravaria
 * carta com etiqueta perdida em silêncio.
 */

import { describe, expect, it } from 'vitest'
import fontePython from '../../scripts/comum.py?raw'
import { DIFICULDADES, TEMAS, TIPOS_ORIGEM } from '../dominio/tipos'
import { LIMITES } from '../dominio/validacao'

function tupla(nome: string): string[] {
  const achado = new RegExp(`^${nome} = \\(([^)]*)\\)`, 'm').exec(fontePython)
  if (!achado?.[1]) throw new Error(`${nome} não encontrado em scripts/comum.py`)
  return [...achado[1].matchAll(/"([^"]+)"/g)].map((item) => item[1] ?? '')
}

function limite(chave: string): number {
  const achado = new RegExp(`"${chave}": (\\d+)`).exec(fontePython)
  if (!achado?.[1]) throw new Error(`limite ${chave} não encontrado em scripts/comum.py`)
  return Number(achado[1])
}

describe('vocabulário dos scripts Python', () => {
  it('repete as listas do domínio sem divergir', () => {
    expect(tupla('DIFICULDADES')).toEqual([...DIFICULDADES])
    expect(tupla('TEMAS')).toEqual([...TEMAS])
    expect(tupla('TIPOS_ORIGEM')).toEqual([...TIPOS_ORIGEM])
  })

  it('repete os limites de tamanho usados na validação', () => {
    const chaves = [
      'titulo',
      'situacao',
      'solucao',
      'fatoChave',
      'fatosChavePorHistoria',
      'avisoConteudo',
      'avisosPorHistoria',
      'temasPorHistoria',
      'duracaoMinima',
      'duracaoMaxima',
    ] as const
    for (const chave of chaves) {
      expect(limite(chave), chave).toBe(LIMITES[chave])
    }
  })
})
