/**
 * Regra critica do projeto: dado salvo nao se perde.
 *
 * Estes testes existem porque o aparelho de quem joga e a UNICA copia das
 * historias escritas no app. Cada caso aqui corresponde a uma forma real de
 * perder conteudo silenciosamente.
 */

import { describe, expect, it } from 'vitest'
import {
  CHAVE_ESTADO,
  CHAVE_RESGATE,
  carregar,
  depositoEmMemoria,
  estadoInicial,
  lerResgate,
  salvar,
  type Deposito,
} from './persistencia'
import { criarHistoria } from '../testes/fabricas'

describe('persistencia', () => {
  it('devolve o estado inicial quando nao ha nada salvo', () => {
    const { estado, aviso } = carregar(depositoEmMemoria())

    expect(aviso).toBeNull()
    expect(estado.personalizadas).toEqual([])
    expect(estado.idsJogados).toEqual([])
  })

  it('salva e le de volta sem alterar as historias da pessoa', () => {
    const deposito = depositoEmMemoria()
    const minhaHistoria = criarHistoria({ id: 'minha', titulo: 'Escrita por mim' })
    const estado = { ...estadoInicial(), personalizadas: [minhaHistoria], idsJogados: ['h9'] }

    expect(salvar(deposito, estado).ok).toBe(true)
    const lido = carregar(deposito)

    expect(lido.aviso).toBeNull()
    expect(lido.estado.personalizadas).toEqual([minhaHistoria])
    expect(lido.estado.idsJogados).toEqual(['h9'])
  })

  it('preserva o conteudo ilegivel em vez de descarta-lo', () => {
    const deposito = depositoEmMemoria({ [CHAVE_ESTADO]: '{isso nao e json' })

    const { estado, aviso } = carregar(deposito)

    expect(estado.personalizadas).toEqual([])
    expect(aviso).toContain(CHAVE_RESGATE)
    // O ponto do teste: o texto original continua recuperavel.
    expect(lerResgate(deposito)).toBe('{isso nao e json')
  })

  it('preserva o estado anterior quando so parte dele pode ser lida', () => {
    const valida = criarHistoria({ id: 'ok' })
    const cru = JSON.stringify({
      versao: 1,
      personalizadas: [valida, { titulo: 'sem situacao nem solucao' }],
      idsJogados: ['ok'],
    })
    const deposito = depositoEmMemoria({ [CHAVE_ESTADO]: cru })

    const { estado, aviso } = carregar(deposito)

    expect(estado.personalizadas).toHaveLength(1)
    expect(estado.personalizadas[0]?.id).toBe('ok')
    expect(aviso).toContain('1 historia(s)')
    expect(lerResgate(deposito)).toBe(cru)
  })

  it('nao lanca excecao quando o navegador bloqueia a leitura', () => {
    const bloqueado: Deposito = {
      getItem: () => {
        throw new Error('acesso negado')
      },
      setItem: () => {},
      removeItem: () => {},
    }

    expect(() => carregar(bloqueado)).not.toThrow()
    expect(carregar(bloqueado).aviso).toContain('Nao foi possivel ler')
  })

  it('avisa em vez de fingir que salvou quando o armazenamento esta cheio', () => {
    const cheio: Deposito = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    }

    const resultado = salvar(cheio, estadoInicial())

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.erros[0]).toContain('Exporte suas historias')
    }
  })

  it('ignora preferencias invalidas sem derrubar o resto do estado', () => {
    const cru = JSON.stringify({
      versao: 1,
      personalizadas: [],
      idsJogados: ['a'],
      preferencias: { dificuldades: ['impossivel'], temas: 'nao e lista', mostrarAvisos: 'talvez' },
    })
    const { estado } = carregar(depositoEmMemoria({ [CHAVE_ESTADO]: cru }))

    expect(estado.idsJogados).toEqual(['a'])
    expect(estado.preferencias.dificuldades).toEqual([])
    expect(estado.preferencias.temas).toEqual([])
    expect(estado.preferencias.mostrarAvisos).toBe(true)
  })
})
