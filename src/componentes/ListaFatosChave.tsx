/**
 * Checklist do mestre: o que o grupo já descobriu.
 *
 * É o critério objetivo de "resolvida" — sem ele, saber quando encerrar a
 * rodada vira discussão. Fica sempre do lado do segredo, nunca visível na
 * frente da carta.
 */

import { Check } from 'lucide-react'
import type { FatoChave } from '../dominio/tipos'

export function ListaFatosChave({
  fatos,
  marcados,
  aoAlternar,
}: {
  fatos: readonly FatoChave[]
  marcados: readonly string[]
  aoAlternar: (idFato: string) => void
}) {
  if (fatos.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        Esta história não tem fatos-chave cadastrados. O mestre decide quando o grupo chegou lá.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {fatos.map((fato) => {
        const marcado = marcados.includes(fato.id)
        return (
          <li key={fato.id}>
            <button
              type="button"
              onClick={() => aoAlternar(fato.id)}
              aria-pressed={marcado}
              className={[
                'flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                marcado
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  marcado ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-white/20',
                ].join(' ')}
              >
                {marcado ? <Check size={13} strokeWidth={3} /> : null}
              </span>
              <span className={`text-sm ${marcado ? 'text-emerald-200' : 'text-zinc-200'}`}>
                {fato.texto}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
