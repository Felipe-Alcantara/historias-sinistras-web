/**
 * Primitivos visuais do projeto.
 *
 * Existem para que as telas nao repitam classe de estilo: quando o visual muda,
 * muda aqui. Sao propositalmente simples — nenhum deles conhece regra de jogo.
 */

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export type VarianteBotao = 'primario' | 'perigo' | 'contorno' | 'fantasma'
export type TamanhoBotao = 'md' | 'sm' | 'bloco'

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'bg-brasa-500 text-black border-brasa-400 hover:bg-brasa-400 active:bg-brasa-600',
  perigo: 'bg-sangue-700 text-white border-sangue-600 hover:bg-sangue-600 active:bg-sangue-700',
  contorno: 'bg-transparent text-zinc-100 border-white/20 hover:bg-white/5 active:bg-white/10',
  fantasma: 'bg-transparent text-zinc-300 border-transparent hover:bg-white/5 active:bg-white/10',
}

const TAMANHOS: Record<TamanhoBotao, string> = {
  md: 'h-12 px-5 text-sm',
  sm: 'h-9 px-3 text-xs',
  bloco: 'h-14 w-full px-5 text-base',
}

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
}

export function Botao({ variante = 'contorno', tamanho = 'md', className = '', ...props }: PropsBotao) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl border font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa-400',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      ].join(' ')}
    />
  )
}

export function Cartao({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`superficie rounded-3xl border border-white/10 ${className}`}>{children}</div>
  )
}

export type TomSelo = 'neutro' | 'brasa' | 'sangue'

const TONS_SELO: Record<TomSelo, string> = {
  neutro: 'bg-white/5 text-zinc-300 border-white/10',
  brasa: 'bg-brasa-500/10 text-brasa-300 border-brasa-500/25',
  sangue: 'bg-sangue-600/10 text-sangue-300 border-sangue-600/30',
}

export function Selo({
  tom = 'neutro',
  children,
  className = '',
}: {
  tom?: TomSelo
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${TONS_SELO[tom]} ${className}`}
    >
      {children}
    </span>
  )
}

const CAMPO_BASE =
  'w-full rounded-xl border border-white/10 bg-cena-800/70 px-3 py-2.5 text-sm text-zinc-100 ' +
  'placeholder:text-zinc-500 outline-none focus:border-brasa-500/60 focus:ring-2 focus:ring-brasa-500/20'

export function Campo({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CAMPO_BASE} ${className}`} />
}

export function AreaTexto({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CAMPO_BASE} resize-y leading-relaxed ${className}`} />
}

export function Rotulo({ children, dica }: { children: ReactNode; dica?: string }) {
  return (
    <label className="mb-1.5 block">
      <span className="text-xs font-medium tracking-wide text-zinc-300 uppercase">{children}</span>
      {dica ? <span className="mt-0.5 block text-xs text-zinc-500 normal-case">{dica}</span> : null}
    </label>
  )
}

/** Interruptor acessível: é um botão de verdade, com estado anunciado por aria. */
export function Alternador({
  ativo,
  aoAlternar,
  rotulo,
  descricao,
}: {
  ativo: boolean
  aoAlternar: (novo: boolean) => void
  rotulo: string
  descricao?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => aoAlternar(!ativo)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/5"
    >
      <span>
        <span className="block text-sm text-zinc-100">{rotulo}</span>
        {descricao ? <span className="mt-0.5 block text-xs text-zinc-500">{descricao}</span> : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${ativo ? 'bg-brasa-500' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${ativo ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}

export function Aviso({ tom = 'brasa', children }: { tom?: 'brasa' | 'sangue'; children: ReactNode }) {
  const cores =
    tom === 'sangue'
      ? 'border-sangue-600/40 bg-sangue-600/10 text-sangue-300'
      : 'border-brasa-500/30 bg-brasa-500/10 text-brasa-300'
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${cores}`}>{children}</div>
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-300">{titulo}</p>
      {children ? <div className="mt-2 text-xs text-zinc-500">{children}</div> : null}
    </div>
  )
}
