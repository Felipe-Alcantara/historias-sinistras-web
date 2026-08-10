/**
 * Orquestrador das telas.
 *
 * Guarda só o que é de sessão (tela atual e rodada em andamento). Tudo que
 * precisa sobreviver ao fechar o navegador vive no gancho de persistência, e
 * toda regra de jogo vive no domínio.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BARALHO_BASE } from './dados/baralhoBase'
import { filtrarBaralho, calcularProgresso, sortearProxima } from './dominio/baralho'
import { iniciarRodada, reduzirRodada, type AcaoRodada, type EstadoRodada } from './dominio/partida'
import type { Colecao, Dificuldade, Tema } from './dominio/tipos'
import { useEstadoSalvo } from './ganchos/useEstadoSalvo'
import { TelaInicio } from './telas/TelaInicio'
import { TelaRodada } from './telas/TelaRodada'
import { TelaBiblioteca } from './telas/TelaBiblioteca'
import { Aviso } from './componentes/ui/primitivos'

type Tela = 'inicio' | 'rodada' | 'biblioteca'

/** Liga ou desliga um item de uma lista de filtro. */
function alternar<T>(lista: readonly T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((atual) => atual !== item) : [...lista, item]
}

export default function App() {
  const salvo = useEstadoSalvo()
  const [tela, setTela] = useState<Tela>('inicio')
  const [rodada, setRodada] = useState<EstadoRodada | null>(null)
  const [cicloReiniciado, setCicloReiniciado] = useState(false)

  const { preferencias, personalizadas, ocultas, idsJogados } = salvo.estado

  // Personalizadas primeiro: se alguém editou uma carta base copiando o id, a
  // versão da pessoa é a que vale.
  const baralhoCompleto = useMemo(() => {
    const idsProprios = new Set(personalizadas.map((historia) => historia.id))
    return [...personalizadas, ...BARALHO_BASE.filter((historia) => !idsProprios.has(historia.id))]
  }, [personalizadas])

  const disponiveis = useMemo(
    () =>
      filtrarBaralho(baralhoCompleto, {
        colecoes: preferencias.colecoes,
        dificuldades: preferencias.dificuldades,
        temas: preferencias.temas,
        ocultas,
      }),
    [baralhoCompleto, preferencias.colecoes, preferencias.dificuldades, preferencias.temas, ocultas],
  )

  const progresso = useMemo(() => calcularProgresso(disponiveis, idsJogados), [disponiveis, idsJogados])

  const sortear = () => {
    const sorteio = sortearProxima(disponiveis, idsJogados)
    if (!sorteio.historia) return
    salvo.registrarJogada(sorteio.historia.id, sorteio.idsJogados)
    setRodada(iniciarRodada(sorteio.historia))
    setCicloReiniciado(sorteio.cicloReiniciado)
    setTela('rodada')
  }

  const agir = (acao: AcaoRodada) => setRodada((atual) => (atual ? reduzirRodada(atual, acao) : atual))

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-10">
      {salvo.avisoDeLeitura ? (
        <div className="pt-4">
          <Aviso tom="sangue">
            {salvo.avisoDeLeitura}{' '}
            <button type="button" onClick={salvo.descartarAvisoDeLeitura} className="underline">
              Entendi
            </button>
          </Aviso>
        </div>
      ) : null}

      {salvo.erroDeGravacao ? (
        <div className="pt-4">
          <Aviso tom="sangue">{salvo.erroDeGravacao}</Aviso>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.main
          key={tela}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {tela === 'inicio' ? (
            <TelaInicio
              progresso={progresso}
              preferencias={preferencias}
              totalPersonalizadas={personalizadas.length}
              aoJogar={sortear}
              aoAbrirBiblioteca={() => setTela('biblioteca')}
              aoAlternarColecao={(colecao: Colecao) =>
                salvo.atualizarPreferencias({ colecoes: alternar(preferencias.colecoes, colecao) })
              }
              aoAlternarDificuldade={(dificuldade: Dificuldade) =>
                salvo.atualizarPreferencias({ dificuldades: alternar(preferencias.dificuldades, dificuldade) })
              }
              aoAlternarTema={(tema: Tema) =>
                salvo.atualizarPreferencias({ temas: alternar(preferencias.temas, tema) })
              }
              aoMudarPreferencia={salvo.atualizarPreferencias}
              aoLimparHistorico={salvo.limparHistorico}
            />
          ) : null}

          {tela === 'rodada' && rodada ? (
            <TelaRodada
              rodada={rodada}
              preferencias={preferencias}
              cicloReiniciado={cicloReiniciado}
              aoAgir={agir}
              aoProxima={sortear}
              aoSair={() => setTela('inicio')}
            />
          ) : null}

          {tela === 'biblioteca' ? (
            <TelaBiblioteca
              baralhoBase={BARALHO_BASE}
              estado={salvo.estado}
              aoVoltar={() => setTela('inicio')}
              aoGuardar={salvo.guardarHistoria}
              aoApagar={salvo.apagarHistoria}
              aoAlternarOculta={salvo.alternarOculta}
              aoSubstituirEstado={salvo.substituirEstado}
            />
          ) : null}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
