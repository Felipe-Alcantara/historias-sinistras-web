/**
 * Maquina de estado de uma rodada.
 *
 * Modelo do jogo fisico: a carta tem dois lados. A frente (situacao) e lida em
 * voz alta para todos; o verso (solucao) e do mestre, e so vira publico na
 * revelacao final. Aqui esta so a regra — quem desenha isso e a camada de telas.
 */

import { RESPOSTAS, type Historia, type Resposta } from './tipos'

export type LadoCarta = 'frente' | 'verso'

export interface EstadoRodada {
  historia: Historia
  /** Lado atualmente na tela. Comeca sempre na frente. */
  lado: LadoCarta
  /** Ids dos fatos-chave que o grupo ja descobriu. */
  fatosMarcados: readonly string[]
  /** Quantas vezes cada resposta foi dada. Vira o placar da rodada. */
  contagem: Readonly<Record<Resposta, number>>
  /** Verdadeiro depois que o mestre leu o verso em voz alta para todos. */
  revelada: boolean
  /** Instante de inicio, para o cronometro. */
  iniciadaEm: number
}

export type AcaoRodada =
  | { tipo: 'virar' }
  | { tipo: 'mostrarLado'; lado: LadoCarta }
  | { tipo: 'alternarFato'; idFato: string }
  | { tipo: 'registrarResposta'; resposta: Resposta }
  | { tipo: 'desfazerResposta'; resposta: Resposta }
  | { tipo: 'revelar' }

function contagemZerada(): Record<Resposta, number> {
  return RESPOSTAS.reduce(
    (acumulado, resposta) => {
      acumulado[resposta] = 0
      return acumulado
    },
    {} as Record<Resposta, number>,
  )
}

export function iniciarRodada(historia: Historia, agora: number = Date.now()): EstadoRodada {
  return {
    historia,
    lado: 'frente',
    fatosMarcados: [],
    contagem: contagemZerada(),
    revelada: false,
    iniciadaEm: agora,
  }
}

export function reduzirRodada(estado: EstadoRodada, acao: AcaoRodada): EstadoRodada {
  switch (acao.tipo) {
    case 'virar':
      return { ...estado, lado: estado.lado === 'frente' ? 'verso' : 'frente' }

    case 'mostrarLado':
      return { ...estado, lado: acao.lado }

    case 'alternarFato': {
      const jaMarcado = estado.fatosMarcados.includes(acao.idFato)
      // Ignora ids que nao pertencem a esta historia: evita sujar o progresso.
      if (!jaMarcado && !estado.historia.fatosChave.some((fato) => fato.id === acao.idFato)) {
        return estado
      }
      return {
        ...estado,
        fatosMarcados: jaMarcado
          ? estado.fatosMarcados.filter((id) => id !== acao.idFato)
          : [...estado.fatosMarcados, acao.idFato],
      }
    }

    case 'registrarResposta':
      return {
        ...estado,
        contagem: { ...estado.contagem, [acao.resposta]: estado.contagem[acao.resposta] + 1 },
      }

    case 'desfazerResposta':
      return {
        ...estado,
        contagem: {
          ...estado.contagem,
          [acao.resposta]: Math.max(0, estado.contagem[acao.resposta] - 1),
        },
      }

    case 'revelar':
      return { ...estado, revelada: true, lado: 'verso' }

    default:
      return estado
  }
}

/** A historia so conta como resolvida quando todos os fatos-chave sairam. */
export function rodadaResolvida(estado: EstadoRodada): boolean {
  const total = estado.historia.fatosChave.length
  if (total === 0) return estado.revelada
  return estado.fatosMarcados.length >= total
}

export function totalDePerguntas(estado: EstadoRodada): number {
  return RESPOSTAS.reduce((soma, resposta) => soma + estado.contagem[resposta], 0)
}

/** Duracao decorrida em segundos, para o cronometro da tela. */
export function duracaoEmSegundos(estado: EstadoRodada, agora: number = Date.now()): number {
  return Math.max(0, Math.floor((agora - estado.iniciadaEm) / 1000))
}

export function formatarDuracao(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
}
