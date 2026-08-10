/**
 * A rodada em si.
 *
 * A tela muda conforme o lado da carta: na frente ficam as ferramentas de quem
 * conduz a pergunta; no verso, o segredo do mestre e o checklist do progresso.
 */

import { ArrowLeft, Megaphone, SkipForward, Timer } from 'lucide-react'
import { CartaDeHistoria } from '../componentes/CartaDeHistoria'
import { ListaFatosChave } from '../componentes/ListaFatosChave'
import { PainelRespostas } from '../componentes/PainelRespostas'
import { Botao, Cartao, Selo } from '../componentes/ui/primitivos'
import {
  duracaoEmSegundos,
  formatarDuracao,
  rodadaResolvida,
  totalDePerguntas,
  type AcaoRodada,
  type EstadoRodada,
} from '../dominio/partida'
import { useCronometro } from '../ganchos/useCronometro'
import type { Preferencias } from '../armazenamento/persistencia'

export function TelaRodada({
  rodada,
  preferencias,
  cicloReiniciado,
  aoAgir,
  aoProxima,
  aoSair,
}: {
  rodada: EstadoRodada
  preferencias: Preferencias
  cicloReiniciado: boolean
  aoAgir: (acao: AcaoRodada) => void
  aoProxima: () => void
  aoSair: () => void
}) {
  const agora = useCronometro(!rodada.revelada)
  const segundos = duracaoEmSegundos(rodada, agora)
  const resolvida = rodadaResolvida(rodada)
  const noVerso = rodada.lado === 'verso'

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 pt-2">
        <Botao tamanho="sm" variante="fantasma" onClick={aoSair} aria-label="Voltar ao início">
          <ArrowLeft size={16} /> Início
        </Botao>
        <div className="flex items-center gap-2">
          <Selo>
            <Timer size={12} />
            <span className="tabular-nums">{formatarDuracao(segundos)}</span>
          </Selo>
          <Selo>{totalDePerguntas(rodada)} perguntas</Selo>
        </div>
      </header>

      {cicloReiniciado ? (
        <p className="rounded-2xl border border-brasa-500/30 bg-brasa-500/10 px-4 py-2.5 text-xs text-brasa-300">
          O baralho deste recorte acabou e recomeçou. A partir daqui as histórias repetem — bom momento
          para gerar ou importar novas.
        </p>
      ) : null}

      <CartaDeHistoria
        historia={rodada.historia}
        lado={rodada.lado}
        revelada={rodada.revelada}
        exigirConfirmacao={preferencias.confirmarVirada}
        mostrarAvisos={preferencias.mostrarAvisos}
        aoVirar={() => aoAgir({ tipo: 'virar' })}
      />

      {noVerso ? (
        <Cartao className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold">O que o grupo já descobriu</h2>
            <span className="text-xs tabular-nums text-zinc-500">
              {rodada.fatosMarcados.length}/{rodada.historia.fatosChave.length}
            </span>
          </div>
          <ListaFatosChave
            fatos={rodada.historia.fatosChave}
            marcados={rodada.fatosMarcados}
            aoAlternar={(idFato) => aoAgir({ tipo: 'alternarFato', idFato })}
          />
        </Cartao>
      ) : (
        <Cartao className="p-5">
          <h2 className="mb-3 text-sm font-bold">Resposta do mestre</h2>
          <PainelRespostas
            contagem={rodada.contagem}
            aoResponder={(resposta) => aoAgir({ tipo: 'registrarResposta', resposta })}
          />
          <p className="mt-3 text-xs text-zinc-500">
            O contador é só um registro da partida — quem responde em voz alta é o mestre.
          </p>
        </Cartao>
      )}

      <div className="area-segura space-y-2">
        {!rodada.revelada ? (
          <Botao
            variante={resolvida ? 'primario' : 'contorno'}
            tamanho="bloco"
            onClick={() => aoAgir({ tipo: 'revelar' })}
          >
            <Megaphone size={18} /> Ler a solução em voz alta
          </Botao>
        ) : null}

        <Botao variante={rodada.revelada ? 'primario' : 'fantasma'} tamanho="bloco" onClick={aoProxima}>
          <SkipForward size={18} /> Próxima história
        </Botao>
      </div>
    </div>
  )
}
