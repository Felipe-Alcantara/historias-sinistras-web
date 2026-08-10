/**
 * Formulário de criação e edição de histórias.
 *
 * Só monta o objeto e devolve; validar é trabalho do domínio. O formulário
 * apenas impede o envio óbvio (frente ou verso vazios) e mostra o erro perto do
 * campo, sem deixar a pessoa perder o que digitou.
 */

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../componentes/ui/Modal'
import { AreaTexto, Botao, Campo, Rotulo, Selo } from '../componentes/ui/primitivos'
import { gerarId } from '../dominio/identificadores'
import { validarHistoria } from '../dominio/validacao'
import {
  COLECOES,
  DIFICULDADES,
  ROTULO_COLECAO,
  TEMAS,
  type Colecao,
  type Dificuldade,
  type FatoChave,
  type Historia,
  type Tema,
} from '../dominio/tipos'

interface Rascunho {
  titulo: string
  situacao: string
  solucao: string
  fatosChave: FatoChave[]
  colecao: Colecao
  dificuldade: Dificuldade
  temas: Tema[]
  avisos: string
  duracaoMin: string
}

function paraRascunho(historia: Historia | null): Rascunho {
  if (!historia) {
    return {
      titulo: '',
      situacao: '',
      solucao: '',
      fatosChave: [],
      colecao: 'pesada',
      dificuldade: 'media',
      temas: [],
      avisos: '',
      duracaoMin: '20',
    }
  }
  return {
    titulo: historia.titulo,
    situacao: historia.situacao,
    solucao: historia.solucao,
    fatosChave: [...historia.fatosChave],
    colecao: historia.colecao,
    dificuldade: historia.dificuldade,
    temas: [...historia.temas],
    avisos: historia.avisosConteudo.join(', '),
    duracaoMin: String(historia.duracaoMin),
  }
}

export function EditorDeHistoria({
  aberto,
  historiaEmEdicao,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean
  historiaEmEdicao: Historia | null
  aoFechar: () => void
  aoSalvar: (historia: Historia) => void
}) {
  const [rascunho, setRascunho] = useState<Rascunho>(() => paraRascunho(historiaEmEdicao))
  const [erros, setErros] = useState<string[]>([])
  // Recarrega o formulário quando o alvo da edição muda.
  const [alvoAtual, setAlvoAtual] = useState<string | null>(historiaEmEdicao?.id ?? null)
  if ((historiaEmEdicao?.id ?? null) !== alvoAtual) {
    setAlvoAtual(historiaEmEdicao?.id ?? null)
    setRascunho(paraRascunho(historiaEmEdicao))
    setErros([])
  }

  const alterar = <C extends keyof Rascunho>(campo: C, valor: Rascunho[C]) =>
    setRascunho((anterior) => ({ ...anterior, [campo]: valor }))

  const enviar = () => {
    const resultado = validarHistoria({
      id: historiaEmEdicao?.id,
      titulo: rascunho.titulo,
      situacao: rascunho.situacao,
      solucao: rascunho.solucao,
      fatosChave: rascunho.fatosChave.filter((fato) => fato.texto.trim().length > 0),
      colecao: rascunho.colecao,
      dificuldade: rascunho.dificuldade,
      temas: rascunho.temas,
      avisosConteudo: rascunho.avisos.split(',').map((aviso) => aviso.trim()),
      duracaoMin: rascunho.duracaoMin,
      origem: historiaEmEdicao?.origem ?? { tipo: 'autoral', referencia: 'Escrita no aplicativo' },
    })

    if (!resultado.ok) {
      setErros(resultado.erros)
      return
    }
    aoSalvar(resultado.valor)
    aoFechar()
  }

  return (
    <Modal aberto={aberto} titulo={historiaEmEdicao ? 'Editar história' : 'Nova história'} aoFechar={aoFechar}>
      <div className="space-y-4">
        {erros.length > 0 ? (
          <ul className="rounded-2xl border border-sangue-600/40 bg-sangue-600/10 px-4 py-3 text-xs text-sangue-300">
            {erros.map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        ) : null}

        <div>
          <Rotulo>Título</Rotulo>
          <Campo
            value={rascunho.titulo}
            onChange={(evento) => alterar('titulo', evento.target.value)}
            placeholder="O pacote fechado"
          />
        </div>

        <div>
          <Rotulo dica="A frente da carta. É isto que o mestre lê em voz alta.">Situação</Rotulo>
          <AreaTexto
            rows={4}
            value={rascunho.situacao}
            onChange={(evento) => alterar('situacao', evento.target.value)}
            placeholder="Um homem é encontrado morto no meio do deserto..."
          />
        </div>

        <div>
          <Rotulo dica="O verso. Só o mestre vê até a revelação.">Solução</Rotulo>
          <AreaTexto
            rows={5}
            value={rascunho.solucao}
            onChange={(evento) => alterar('solucao', evento.target.value)}
            placeholder="Ele saltou de um avião e o paraquedas não abriu..."
          />
        </div>

        <div>
          <Rotulo dica="O que o grupo precisa descobrir. Vira o checklist do mestre.">Fatos-chave</Rotulo>
          <div className="space-y-2">
            {rascunho.fatosChave.map((fato, indice) => (
              <div key={fato.id} className="flex gap-2">
                <Campo
                  value={fato.texto}
                  onChange={(evento) => {
                    const copia = [...rascunho.fatosChave]
                    copia[indice] = { ...fato, texto: evento.target.value }
                    alterar('fatosChave', copia)
                  }}
                  placeholder={`Fato ${indice + 1}`}
                />
                <Botao
                  variante="fantasma"
                  onClick={() =>
                    alterar(
                      'fatosChave',
                      rascunho.fatosChave.filter((outro) => outro.id !== fato.id),
                    )
                  }
                  aria-label="Remover fato"
                >
                  <Trash2 size={16} />
                </Botao>
              </div>
            ))}
            <Botao
              tamanho="sm"
              onClick={() => alterar('fatosChave', [...rascunho.fatosChave, { id: gerarId(), texto: '' }])}
            >
              <Plus size={14} /> Adicionar fato
            </Botao>
          </div>
        </div>

        <div>
          <Rotulo>Coleção</Rotulo>
          <div className="flex flex-wrap gap-2">
            {COLECOES.map((colecao) => (
              <button key={colecao} type="button" onClick={() => alterar('colecao', colecao)}>
                <Selo tom={rascunho.colecao === colecao ? 'brasa' : 'neutro'}>{ROTULO_COLECAO[colecao]}</Selo>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Rotulo>Dificuldade</Rotulo>
          <div className="flex flex-wrap gap-2">
            {DIFICULDADES.map((dificuldade) => (
              <button key={dificuldade} type="button" onClick={() => alterar('dificuldade', dificuldade)}>
                <Selo tom={rascunho.dificuldade === dificuldade ? 'brasa' : 'neutro'}>{dificuldade}</Selo>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Rotulo>Temas</Rotulo>
          <div className="flex flex-wrap gap-2">
            {TEMAS.map((tema) => {
              const ativo = rascunho.temas.includes(tema)
              return (
                <button
                  key={tema}
                  type="button"
                  onClick={() =>
                    alterar('temas', ativo ? rascunho.temas.filter((t) => t !== tema) : [...rascunho.temas, tema])
                  }
                >
                  <Selo tom={ativo ? 'brasa' : 'neutro'}>{tema}</Selo>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Rotulo dica="Separe por vírgula.">Avisos</Rotulo>
            <Campo
              value={rascunho.avisos}
              onChange={(evento) => alterar('avisos', evento.target.value)}
              placeholder="suicídio, violência"
            />
          </div>
          <div>
            <Rotulo>Duração (min)</Rotulo>
            <Campo
              inputMode="numeric"
              value={rascunho.duracaoMin}
              onChange={(evento) => alterar('duracaoMin', evento.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Botao variante="fantasma" onClick={aoFechar} className="flex-1">
            Cancelar
          </Botao>
          <Botao variante="primario" onClick={enviar} className="flex-1">
            Salvar
          </Botao>
        </div>
      </div>
    </Modal>
  )
}
