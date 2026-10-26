import { describe, expect, it } from 'vitest'
import { AVISOS_DE_CONTEUDO } from './tipos'
import { LIMITES, validarHistoria } from './validacao'

function avisosValidados(avisosConteudo: unknown): string[] {
  const resultado = validarHistoria({ titulo: 'Titulo', situacao: 'Frente', solucao: 'Verso', avisosConteudo })
  if (!resultado.ok) throw new Error(resultado.erros.join(' '))
  return resultado.valor.avisosConteudo
}

describe('avisos de conteudo na validacao', () => {
  it('mantem os avisos da lista fechada', () => {
    expect(avisosValidados(['luto', 'saúde mental'])).toEqual(['luto', 'saúde mental'])
  })

  it('ignora caixa, acento e espacos nas pontas', () => {
    expect(avisosValidados(['  VIOLENCIA domestica '])).toEqual(['violência doméstica'])
  })

  it('converte um rotulo antigo no aviso que passou a cobri-lo', () => {
    expect(avisosValidados(['tentativa de homicídio', 'mortes em massa', 'Capacitismo'])).toEqual([
      'homicídio',
      'desastre com mortes em massa',
      'discriminação',
    ])
  })

  it('descarta o que nao e da lista sem recusar a carta', () => {
    expect(avisosValidados(['sangue', 'luto', 42])).toEqual(['luto'])
  })

  it('nao repete aviso quando dois rotulos caem no mesmo', () => {
    expect(avisosValidados(['morte', 'mortes', 'afogamento'])).toEqual(['morte'])
  })

  it('respeita o limite de avisos por carta', () => {
    expect(avisosValidados([...AVISOS_DE_CONTEUDO])).toHaveLength(LIMITES.avisosPorHistoria)
  })
})
