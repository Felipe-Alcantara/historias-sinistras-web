/**
 * Porta de entrada do jogo: escolher o recorte do baralho e começar.
 *
 * Mostra explicitamente quantas cartas ainda são inéditas, porque foi a
 * repetição de histórias que motivou o projeto.
 */

import { BookOpen, Library, Play, RotateCcw } from 'lucide-react'
import {
  COLECOES,
  DESCRICAO_COLECAO,
  DIFICULDADES,
  ROTULO_COLECAO,
  TEMAS,
  type Colecao,
  type Dificuldade,
  type Tema,
} from '../dominio/tipos'
import type { ProgressoBaralho } from '../dominio/baralho'
import { Alternador, Aviso, Botao, Cartao, Selo } from '../componentes/ui/primitivos'
import type { Preferencias } from '../armazenamento/persistencia'

export function TelaInicio({
  progresso,
  preferencias,
  totalPersonalizadas,
  aoJogar,
  aoAbrirBiblioteca,
  aoAlternarColecao,
  aoAlternarDificuldade,
  aoAlternarTema,
  aoMudarPreferencia,
  aoLimparHistorico,
}: {
  progresso: ProgressoBaralho
  preferencias: Preferencias
  totalPersonalizadas: number
  aoJogar: () => void
  aoAbrirBiblioteca: () => void
  aoAlternarColecao: (colecao: Colecao) => void
  aoAlternarDificuldade: (dificuldade: Dificuldade) => void
  aoAlternarTema: (tema: Tema) => void
  aoMudarPreferencia: (parcial: Partial<Preferencias>) => void
  aoLimparHistorico: () => void
}) {
  const semCartas = progresso.total === 0
  const percentual = progresso.total === 0 ? 0 : Math.round((progresso.jogadas / progresso.total) * 100)

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <h1 className="text-3xl leading-tight font-bold">
          Histórias <span className="text-brasa-400">Sinistras</span>
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Um mestre lê a solução em segredo. Os outros reconstroem a história perguntando só o que se
          responde com sim ou não.
        </p>
      </header>

      <Cartao className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs tracking-wide text-zinc-400 uppercase">Neste recorte</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {progresso.restantes}
              <span className="ml-1.5 text-sm font-normal text-zinc-500">
                de {progresso.total} inéditas
              </span>
            </p>
          </div>
          {progresso.jogadas > 0 ? (
            <Botao tamanho="sm" variante="fantasma" onClick={aoLimparHistorico}>
              <RotateCcw size={14} /> Zerar
            </Botao>
          ) : null}
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brasa-500 transition-all"
            style={{ width: `${percentual}%` }}
          />
        </div>

        <div className="mt-5">
          <Botao variante="primario" tamanho="bloco" onClick={aoJogar} disabled={semCartas}>
            <Play size={18} /> {progresso.jogadas > 0 ? 'Próxima história' : 'Começar'}
          </Botao>
        </div>

        {semCartas ? (
          <p className="mt-3 text-center text-xs text-sangue-300">
            Nenhuma carta neste recorte. Solte um filtro ou reative histórias na biblioteca.
          </p>
        ) : null}
      </Cartao>

      <section>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">Coleções</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {COLECOES.map((colecao) => {
            const ativa = preferencias.colecoes.includes(colecao)
            return (
              <button
                key={colecao}
                type="button"
                aria-pressed={ativa}
                onClick={() => aoAlternarColecao(colecao)}
                className={[
                  'rounded-2xl border px-4 py-3 text-left transition-colors',
                  ativa
                    ? 'border-brasa-500/40 bg-brasa-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5',
                ].join(' ')}
              >
                <span className={`block text-sm font-medium ${ativa ? 'text-brasa-300' : 'text-zinc-100'}`}>
                  {ROTULO_COLECAO[colecao]}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">{DESCRICAO_COLECAO[colecao]}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Sem nada marcado, o sorteio mistura todas as coleções.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">Dificuldade</h2>
        <div className="flex flex-wrap gap-2">
          {DIFICULDADES.map((dificuldade) => {
            const ativa = preferencias.dificuldades.includes(dificuldade)
            return (
              <button key={dificuldade} type="button" onClick={() => aoAlternarDificuldade(dificuldade)}>
                <Selo tom={ativa ? 'brasa' : 'neutro'}>{dificuldade}</Selo>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">Tema</h2>
        <div className="flex flex-wrap gap-2">
          {TEMAS.map((tema) => {
            const ativo = preferencias.temas.includes(tema)
            return (
              <button key={tema} type="button" onClick={() => aoAlternarTema(tema)}>
                <Selo tom={ativo ? 'brasa' : 'neutro'}>{tema}</Selo>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">Sem nada marcado, o baralho inteiro entra no sorteio.</p>
      </section>

      <section className="space-y-2">
        <Alternador
          ativo={preferencias.confirmarVirada}
          aoAlternar={(novo) => aoMudarPreferencia({ confirmarVirada: novo })}
          rotulo="Confirmar antes de ver a solução"
          descricao="Um toque a mais para ninguém abrir o verso sem querer."
        />
        <Alternador
          ativo={preferencias.mostrarAvisos}
          aoAlternar={(novo) => aoMudarPreferencia({ mostrarAvisos: novo })}
          rotulo="Mostrar avisos de conteúdo"
          descricao="Informa o tema pesado antes da carta. Não remove nenhuma história do sorteio."
        />
      </section>

      <Botao tamanho="bloco" onClick={aoAbrirBiblioteca}>
        <Library size={18} /> Biblioteca
        <span className="text-xs text-zinc-500">
          {totalPersonalizadas > 0 ? `${totalPersonalizadas} suas` : 'criar e importar'}
        </span>
      </Botao>

      <Aviso>
        <span className="flex items-start gap-2">
          <BookOpen size={16} className="mt-0.5 shrink-0" />
          <span>
            Tudo fica salvo só neste navegador. Exporte suas histórias na biblioteca para não depender
            de um aparelho só.
          </span>
        </span>
      </Aviso>
    </div>
  )
}
