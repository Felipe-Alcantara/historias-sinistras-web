/**
 * As respostas que o mestre pode dar.
 *
 * "Sim", "Não" e "Irrelevante" vêm do jogo original; "Quase lá" é uma adição
 * deste projeto, para encurtar partidas em que o grupo está no caminho certo.
 * O painel só conta — quem fala em voz alta é o mestre.
 */

import { motion } from 'framer-motion'
import { RESPOSTAS, ROTULO_RESPOSTA, type Resposta } from '../dominio/tipos'

const ESTILO: Record<Resposta, string> = {
  sim: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 active:bg-emerald-500/20',
  nao: 'border-sangue-600/30 bg-sangue-600/10 text-sangue-300 active:bg-sangue-600/20',
  irrelevante: 'border-white/10 bg-white/5 text-zinc-300 active:bg-white/10',
  'quase-la': 'border-brasa-500/30 bg-brasa-500/10 text-brasa-300 active:bg-brasa-500/20',
}

export function PainelRespostas({
  contagem,
  aoResponder,
}: {
  contagem: Readonly<Record<Resposta, number>>
  aoResponder: (resposta: Resposta) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {RESPOSTAS.map((resposta) => (
        <motion.button
          key={resposta}
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => aoResponder(resposta)}
          className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border font-medium transition-colors ${ESTILO[resposta]}`}
        >
          <span className="text-sm">{ROTULO_RESPOSTA[resposta]}</span>
          <span className="text-[11px] tabular-nums opacity-70">{contagem[resposta]}</span>
        </motion.button>
      ))}
    </div>
  )
}
