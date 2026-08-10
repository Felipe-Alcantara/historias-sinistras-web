/**
 * Ponte entre o React e a persistencia.
 *
 * Toda escrita passa por aqui, e cada escrita e imediatamente gravada: como o
 * aparelho e a unica copia das historias da pessoa, adiar a gravacao para
 * ganhar desempenho seria trocar seguranca por nada.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  carregar,
  depositoDoNavegador,
  salvar,
  type Deposito,
  type EstadoSalvo,
  type Preferencias,
} from '../armazenamento/persistencia'
import type { Historia } from '../dominio/tipos'

export interface EstadoSalvoControlado {
  estado: EstadoSalvo
  /** Problema encontrado ao ler os dados na abertura do app. */
  avisoDeLeitura: string | null
  /** Problema na ultima tentativa de gravar. Enquanto existir, nada foi salvo. */
  erroDeGravacao: string | null
  registrarJogada: (idHistoria: string, idsJogados: string[]) => void
  guardarHistoria: (historia: Historia) => void
  apagarHistoria: (id: string) => void
  alternarOculta: (id: string) => void
  atualizarPreferencias: (parcial: Partial<Preferencias>) => void
  substituirEstado: (novo: EstadoSalvo) => void
  limparHistorico: () => void
  descartarAvisoDeLeitura: () => void
}

export function useEstadoSalvo(depositoInjetado?: Deposito): EstadoSalvoControlado {
  // Deposito e leitura inicial sao resolvidos uma unica vez, na montagem:
  // trocar de deposito no meio da sessao faria o app escrever em dois lugares.
  const [deposito] = useState<Deposito>(() => depositoInjetado ?? depositoDoNavegador())
  const [leituraInicial] = useState(() => carregar(deposito))
  const [estado, setEstado] = useState<EstadoSalvo>(leituraInicial.estado)
  const [avisoDeLeitura, setAvisoDeLeitura] = useState<string | null>(leituraInicial.aviso)
  const [erroDeGravacao, setErroDeGravacao] = useState<string | null>(null)

  const aplicar = useCallback(
    (transformar: (anterior: EstadoSalvo) => EstadoSalvo) => {
      setEstado((anterior) => {
        const proximo = transformar(anterior)
        const resultado = salvar(deposito, proximo)
        setErroDeGravacao(resultado.ok ? null : (resultado.erros[0] ?? 'Falha desconhecida ao salvar.'))
        // Mesmo quando a gravacao falha, o estado em memoria avanca: a pessoa
        // continua jogando e o aviso na tela explica o risco.
        return proximo
      })
    },
    [deposito],
  )

  return useMemo<EstadoSalvoControlado>(
    () => ({
      estado,
      avisoDeLeitura,
      erroDeGravacao,
      registrarJogada: (_idHistoria, idsJogados) => aplicar((anterior) => ({ ...anterior, idsJogados })),
      guardarHistoria: (historia) =>
        aplicar((anterior) => {
          const jaExiste = anterior.personalizadas.some((atual) => atual.id === historia.id)
          return {
            ...anterior,
            personalizadas: jaExiste
              ? anterior.personalizadas.map((atual) => (atual.id === historia.id ? historia : atual))
              : [...anterior.personalizadas, historia],
          }
        }),
      apagarHistoria: (id) =>
        aplicar((anterior) => ({
          ...anterior,
          personalizadas: anterior.personalizadas.filter((historia) => historia.id !== id),
          ocultas: anterior.ocultas.filter((oculta) => oculta !== id),
        })),
      alternarOculta: (id) =>
        aplicar((anterior) => ({
          ...anterior,
          ocultas: anterior.ocultas.includes(id)
            ? anterior.ocultas.filter((oculta) => oculta !== id)
            : [...anterior.ocultas, id],
        })),
      atualizarPreferencias: (parcial) =>
        aplicar((anterior) => ({ ...anterior, preferencias: { ...anterior.preferencias, ...parcial } })),
      substituirEstado: (novo) => aplicar(() => novo),
      limparHistorico: () => aplicar((anterior) => ({ ...anterior, idsJogados: [] })),
      descartarAvisoDeLeitura: () => setAvisoDeLeitura(null),
    }),
    [estado, avisoDeLeitura, erroDeGravacao, aplicar],
  )
}
