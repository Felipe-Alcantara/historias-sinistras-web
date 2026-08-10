/**
 * A carta de dois lados, que é o coração do jogo.
 *
 * Frente (brasa): a situação, lida em voz alta para todo mundo.
 * Verso (sangue): a solução, que pertence ao mestre até a revelação final.
 *
 * A cor separa as duas coisas de longe: se a tela está vermelha, o que está
 * escrito ali é spoiler.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, RotateCcw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import type { Historia } from '../dominio/tipos'
import type { LadoCarta } from '../dominio/partida'
import { Botao, Selo } from './ui/primitivos'

export function CartaDeHistoria({
  historia,
  lado,
  revelada,
  exigirConfirmacao,
  mostrarAvisos,
  aoVirar,
}: {
  historia: Historia
  lado: LadoCarta
  revelada: boolean
  exigirConfirmacao: boolean
  mostrarAvisos: boolean
  aoVirar: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)

  const pedirVirada = () => {
    // Confirmar só faz sentido ao ir para o segredo; voltar para a frente é livre.
    if (lado === 'frente' && exigirConfirmacao && !revelada) {
      setConfirmando(true)
      return
    }
    aoVirar()
  }

  const confirmar = () => {
    setConfirmando(false)
    aoVirar()
  }

  const noVerso = lado === 'verso'

  return (
    <div className="relative">
      <motion.article
        layout
        className={[
          'superficie relative overflow-hidden rounded-3xl border p-5 sm:p-6',
          noVerso ? 'border-sangue-600/40' : 'border-brasa-500/30',
        ].join(' ')}
      >
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 blur-2xl',
            noVerso ? 'bg-sangue-700/30' : 'bg-brasa-500/20',
          ].join(' ')}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={lado}
            initial={{ opacity: 0, rotateY: noVerso ? -12 : 12, y: 8 }}
            animate={{ opacity: 1, rotateY: 0, y: 0 }}
            exit={{ opacity: 0, rotateY: noVerso ? 12 : -12, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Selo tom={noVerso ? 'sangue' : 'brasa'}>
                {noVerso ? <ShieldAlert size={12} /> : <Eye size={12} />}
                {noVerso ? (revelada ? 'Solução revelada' : 'Só o mestre') : 'Para todos'}
              </Selo>
              <Selo>{historia.dificuldade}</Selo>
              {historia.temas.map((tema) => (
                <Selo key={tema}>{tema}</Selo>
              ))}
            </div>

            <h1 className="text-xl leading-tight font-bold sm:text-2xl">{historia.titulo}</h1>

            {!noVerso && mostrarAvisos && historia.avisosConteudo.length > 0 ? (
              <p className="mt-3 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Conteúdo: </span>
                {historia.avisosConteudo.join(' · ')}
              </p>
            ) : null}

            <p
              className={[
                'preserva-quebras mt-4 leading-relaxed',
                noVerso ? 'text-sangue-300' : 'text-zinc-200',
              ].join(' ')}
            >
              {noVerso ? historia.solucao : historia.situacao}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.article>

      <div className="mt-3">
        <Botao
          variante={noVerso ? 'contorno' : 'perigo'}
          tamanho="bloco"
          onClick={pedirVirada}
          aria-label={noVerso ? 'Voltar para a situação' : 'Ver a solução (lado do mestre)'}
        >
          {noVerso ? (
            <>
              <RotateCcw size={18} /> Voltar para a situação
            </>
          ) : (
            <>
              <EyeOff size={18} /> Ver a solução
            </>
          )}
        </Botao>
      </div>

      <AnimatePresence>
        {confirmando ? (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/85 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <ShieldAlert className="mx-auto mb-3 text-sangue-500" size={28} />
              <p className="text-sm font-medium">O outro lado tem a solução.</p>
              <p className="mt-1 text-xs text-zinc-400">Confirme que o aparelho está com o mestre.</p>
              <div className="mt-5 flex gap-2">
                <Botao variante="fantasma" onClick={() => setConfirmando(false)} className="flex-1">
                  Cancelar
                </Botao>
                <Botao variante="perigo" onClick={confirmar} className="flex-1">
                  Sou o mestre
                </Botao>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
