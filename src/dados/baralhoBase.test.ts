/**
 * Guarda-corpo do conteúdo.
 *
 * O baralho é editado à mão e por script. Estes testes existem para que uma
 * carta malformada apareça no gate, e não durante uma partida.
 */

import { describe, expect, it } from 'vitest'
import { BARALHO_BASE, PROBLEMAS_DO_BARALHO_BASE, contarPorColecao } from './baralhoBase'
import { COLECOES } from '../dominio/tipos'

describe('baralho base', () => {
  it('carrega sem nenhuma história descartada', () => {
    expect(PROBLEMAS_DO_BARALHO_BASE).toEqual([])
  })

  it('tem histórias em todas as cinco coleções', () => {
    const contagem = contarPorColecao()
    for (const colecao of COLECOES) {
      expect(contagem[colecao], `coleção ${colecao} deve ter 100 histórias`).toBe(100)
    }
    expect(BARALHO_BASE).toHaveLength(500)
  })

  it('não repete identificador entre coleções', () => {
    const ids = BARALHO_BASE.map((historia) => historia.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda carta tem os dois lados preenchidos', () => {
    for (const historia of BARALHO_BASE) {
      expect(historia.situacao.length, `${historia.id} sem situação`).toBeGreaterThan(20)
      // O limite do verso é menor de propósito: existem cartas cuja graça está
      // numa revelação de uma frase só. O teste pega esboço vazio, não concisão.
      expect(historia.solucao.length, `${historia.id} sem solução`).toBeGreaterThan(12)
    }
  })

  it('toda carta tem fatos-chave suficientes para medir progresso', () => {
    for (const historia of BARALHO_BASE) {
      expect(historia.fatosChave.length, `${historia.id} tem poucos fatos-chave`).toBeGreaterThanOrEqual(3)
    }
  })

  it('a solução nunca aparece dentro da situação', () => {
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .replace(/\s+/g, ' ')
        .trim()

    for (const historia of BARALHO_BASE) {
      expect(
        normalizar(historia.situacao).includes(normalizar(historia.solucao)),
        `${historia.id} entrega a solução na frente`,
      ).toBe(false)
    }
  })

  it('não repete título, situação ou solução após normalizar texto', () => {
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .replace(/\s+/g, ' ')
        .trim()

    for (const campo of ['titulo', 'situacao', 'solucao'] as const) {
      const valores = BARALHO_BASE.map((historia) => normalizar(historia[campo]))
      expect(new Set(valores).size, `${campo} repetido`).toBe(valores.length)
    }
  })
})
