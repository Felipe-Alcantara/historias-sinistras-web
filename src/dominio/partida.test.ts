import { describe, expect, it } from 'vitest'
import {
  duracaoEmSegundos,
  formatarDuracao,
  iniciarRodada,
  reduzirRodada,
  rodadaResolvida,
  totalDePerguntas,
} from './partida'
import { criarHistoria } from '../testes/fabricas'

describe('rodada', () => {
  it('comeca sempre pela frente da carta, com o verso escondido', () => {
    const estado = iniciarRodada(criarHistoria())

    expect(estado.lado).toBe('frente')
    expect(estado.revelada).toBe(false)
  })

  it('virar alterna entre os dois lados', () => {
    let estado = iniciarRodada(criarHistoria())

    estado = reduzirRodada(estado, { tipo: 'virar' })
    expect(estado.lado).toBe('verso')

    estado = reduzirRodada(estado, { tipo: 'virar' })
    expect(estado.lado).toBe('frente')
  })

  it('marcar e desmarcar fato-chave', () => {
    let estado = iniciarRodada(criarHistoria())

    estado = reduzirRodada(estado, { tipo: 'alternarFato', idFato: 'f1' })
    expect(estado.fatosMarcados).toEqual(['f1'])

    estado = reduzirRodada(estado, { tipo: 'alternarFato', idFato: 'f1' })
    expect(estado.fatosMarcados).toEqual([])
  })

  it('ignora fato que nao pertence a historia da rodada', () => {
    const estado = reduzirRodada(iniciarRodada(criarHistoria()), {
      tipo: 'alternarFato',
      idFato: 'de-outra-carta',
    })

    expect(estado.fatosMarcados).toEqual([])
  })

  it('conta as respostas dadas e permite desfazer sem ficar negativo', () => {
    let estado = iniciarRodada(criarHistoria())

    estado = reduzirRodada(estado, { tipo: 'registrarResposta', resposta: 'sim' })
    estado = reduzirRodada(estado, { tipo: 'registrarResposta', resposta: 'sim' })
    estado = reduzirRodada(estado, { tipo: 'registrarResposta', resposta: 'quase-la' })
    expect(totalDePerguntas(estado)).toBe(3)

    estado = reduzirRodada(estado, { tipo: 'desfazerResposta', resposta: 'nao' })
    expect(estado.contagem.nao).toBe(0)
    expect(totalDePerguntas(estado)).toBe(3)
  })

  it('so considera resolvida quando todos os fatos-chave sairam', () => {
    let estado = iniciarRodada(criarHistoria())
    expect(rodadaResolvida(estado)).toBe(false)

    estado = reduzirRodada(estado, { tipo: 'alternarFato', idFato: 'f1' })
    expect(rodadaResolvida(estado)).toBe(false)

    estado = reduzirRodada(estado, { tipo: 'alternarFato', idFato: 'f2' })
    expect(rodadaResolvida(estado)).toBe(true)
  })

  it('sem fatos-chave, resolver depende da revelacao do mestre', () => {
    let estado = iniciarRodada(criarHistoria({ fatosChave: [] }))
    expect(rodadaResolvida(estado)).toBe(false)

    estado = reduzirRodada(estado, { tipo: 'revelar' })
    expect(rodadaResolvida(estado)).toBe(true)
    expect(estado.lado).toBe('verso')
  })

  it('cronometro conta do inicio da rodada', () => {
    const estado = iniciarRodada(criarHistoria(), 1_000)

    expect(duracaoEmSegundos(estado, 96_000)).toBe(95)
    expect(formatarDuracao(95)).toBe('01:35')
  })
})
