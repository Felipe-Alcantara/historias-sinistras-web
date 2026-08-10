import { describe, expect, it } from 'vitest'
import { exportarPacote, importarPacote } from './portabilidade'
import { estadoInicial } from './persistencia'
import { criarHistoria } from '../testes/fabricas'

describe('portabilidade', () => {
  it('exporta e importa de volta sem perder historia', () => {
    const historias = [criarHistoria({ id: 'a' }), criarHistoria({ id: 'b' })]

    const resultado = importarPacote(exportarPacote(historias))

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.valor.adicionadas).toBe(2)
      expect(resultado.valor.estado.personalizadas.map((h) => h.id)).toEqual(['a', 'b'])
    }
  })

  it('soma ao que ja existe em vez de substituir', () => {
    const jaExistente = criarHistoria({ id: 'antiga', titulo: 'Ja estava aqui' })
    const estado = { ...estadoInicial(), personalizadas: [jaExistente] }

    const resultado = importarPacote(exportarPacote([criarHistoria({ id: 'nova' })]), estado)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      // O ponto do teste: importar nunca apaga o que a pessoa ja tinha.
      expect(resultado.valor.estado.personalizadas.map((h) => h.id)).toEqual(['antiga', 'nova'])
    }
  })

  it('nao duplica historia que ja esta no aparelho', () => {
    const historia = criarHistoria({ id: 'repetida' })
    const estado = { ...estadoInicial(), personalizadas: [historia] }

    const resultado = importarPacote(exportarPacote([historia, criarHistoria({ id: 'inedita' })]), estado)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.valor.adicionadas).toBe(1)
      expect(resultado.valor.repetidas).toBe(1)
      expect(resultado.valor.estado.personalizadas).toHaveLength(2)
    }
  })

  it('aceita uma lista solta de historias, que e o que o script gerador produz', () => {
    const cru = JSON.stringify([
      { titulo: 'Gerada', situacao: 'Frente da carta.', solucao: 'Verso da carta.' },
    ])

    const resultado = importarPacote(cru)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.valor.adicionadas).toBe(1)
      // Campos ausentes ganham um padrao seguro em vez de derrubar a importacao.
      expect(resultado.valor.estado.personalizadas[0]?.dificuldade).toBe('media')
      expect(resultado.valor.estado.personalizadas[0]?.id).toBeTruthy()
    }
  })

  it('recusa texto que nao e JSON com mensagem compreensivel', () => {
    const resultado = importarPacote('cole aqui o pacote')

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.erros[0]).toContain('JSON valido')
  })

  it('relata as historias incompletas sem descartar as boas', () => {
    const cru = JSON.stringify([
      { titulo: 'Boa', situacao: 'Frente.', solucao: 'Verso.' },
      { titulo: 'Faltando o verso', situacao: 'Frente.' },
    ])

    const resultado = importarPacote(cru)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.valor.adicionadas).toBe(1)
      expect(resultado.valor.descartadas).toHaveLength(1)
      expect(resultado.valor.descartadas[0]).toContain('solucao')
    }
  })
})
