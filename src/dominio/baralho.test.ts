import { describe, expect, it } from 'vitest'
import { FILTRO_VAZIO, calcularProgresso, embaralhar, filtrarBaralho, sortearProxima } from './baralho'
import { aleatorioFixo, criarBaralho, criarHistoria } from '../testes/fabricas'

describe('sorteio sem repeticao', () => {
  it('nao repete historia enquanto houver carta inedita', () => {
    const baralho = criarBaralho(10)
    let jogados: string[] = []
    const saidas: string[] = []

    for (let rodada = 0; rodada < 10; rodada++) {
      const sorteio = sortearProxima(baralho, jogados)
      expect(sorteio.historia).not.toBeNull()
      expect(sorteio.cicloReiniciado).toBe(false)
      saidas.push(sorteio.historia?.id ?? '')
      jogados = sorteio.idsJogados
    }

    expect(new Set(saidas).size).toBe(10)
  })

  it('reinicia o ciclo quando o baralho acaba e sinaliza isso', () => {
    const baralho = criarBaralho(3)
    const jogados = ['h1', 'h2', 'h3']

    const sorteio = sortearProxima(baralho, jogados)

    expect(sorteio.cicloReiniciado).toBe(true)
    expect(sorteio.idsJogados).toHaveLength(1)
  })

  it('evita emendar a mesma carta duas vezes na virada do ciclo', () => {
    const baralho = criarBaralho(3)
    // Ultima jogada foi h3; o proximo sorteio nao pode devolver h3 de novo.
    const sorteio = sortearProxima(baralho, ['h1', 'h2', 'h3'], aleatorioFixo(0.99))

    expect(sorteio.historia?.id).not.toBe('h3')
  })

  it('devolve null quando o filtro nao deixou nenhuma historia', () => {
    const sorteio = sortearProxima([], [])

    expect(sorteio.historia).toBeNull()
    expect(sorteio.cicloReiniciado).toBe(false)
  })

  it('funciona com um baralho de uma carta so', () => {
    const baralho = criarBaralho(1)

    const primeira = sortearProxima(baralho, [])
    const segunda = sortearProxima(baralho, primeira.idsJogados)

    expect(primeira.historia?.id).toBe('h1')
    expect(segunda.historia?.id).toBe('h1')
    expect(segunda.cicloReiniciado).toBe(true)
  })
})

describe('filtro do baralho', () => {
  const baralho = [
    criarHistoria({ id: 'a', dificuldade: 'facil', temas: ['crime'] }),
    criarHistoria({ id: 'b', dificuldade: 'dificil', temas: ['sobrenatural'] }),
    criarHistoria({ id: 'c', dificuldade: 'facil', temas: ['crime', 'humor-negro'] }),
  ]

  it('sem criterio, devolve tudo', () => {
    expect(filtrarBaralho(baralho, FILTRO_VAZIO)).toHaveLength(3)
  })

  it('filtra por dificuldade e por tema em conjunto', () => {
    const resultado = filtrarBaralho(baralho, {
      colecoes: [],
      dificuldades: ['facil'],
      temas: ['humor-negro'],
      ocultas: [],
    })

    expect(resultado.map((h) => h.id)).toEqual(['c'])
  })

  it('filtra por colecao, que e o recorte de clima da carta', () => {
    const misto = [
      criarHistoria({ id: 'x', colecao: 'comica' }),
      criarHistoria({ id: 'y', colecao: 'creepypasta' }),
      criarHistoria({ id: 'z', colecao: 'comica' }),
    ]

    const resultado = filtrarBaralho(misto, { ...FILTRO_VAZIO, colecoes: ['comica'] })

    expect(resultado.map((h) => h.id)).toEqual(['x', 'z'])
  })

  it('remove as historias ocultas', () => {
    const resultado = filtrarBaralho(baralho, { ...FILTRO_VAZIO, ocultas: ['a', 'b'] })

    expect(resultado.map((h) => h.id)).toEqual(['c'])
  })
})

describe('apoio ao sorteio', () => {
  it('embaralhar preserva todos os itens e nao altera o original', () => {
    const original = criarBaralho(6)

    const misturado = embaralhar(original, aleatorioFixo(0.1, 0.9, 0.4, 0.7, 0.2))

    expect(misturado).toHaveLength(6)
    expect(new Set(misturado.map((h) => h.id))).toEqual(new Set(original.map((h) => h.id)))
    expect(original.map((h) => h.id)).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
  })

  it('calcula quantas cartas ainda faltam no filtro atual', () => {
    const progresso = calcularProgresso(criarBaralho(5), ['h1', 'h2', 'fora-do-filtro'])

    expect(progresso).toEqual({ total: 5, jogadas: 2, restantes: 3 })
  })
})
