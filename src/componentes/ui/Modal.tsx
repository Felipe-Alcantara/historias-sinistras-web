import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

/**
 * Painel que sobe de baixo — o formato que funciona bem com o polegar, já que o
 * aparelho circula na mão durante a partida.
 */
export function Modal({
  aberto,
  titulo,
  aoFechar,
  children,
}: {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    // Impede o fundo de rolar enquanto o painel está aberto.
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, aoFechar])

  return (
    <AnimatePresence>
      {aberto ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="superficie flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-white/10 sm:max-w-lg sm:rounded-3xl"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
              <h2 className="text-base font-bold">{titulo}</h2>
              <button
                type="button"
                onClick={aoFechar}
                aria-label="Fechar"
                className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                <X size={18} />
              </button>
            </header>
            <div className="area-segura overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
