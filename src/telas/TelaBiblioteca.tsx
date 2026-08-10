/**
 * Biblioteca: ver todo o baralho, escrever histórias próprias e mover pacotes
 * para dentro e para fora do aparelho.
 *
 * Exportar é a única defesa real contra perder o que foi escrito, então o botão
 * fica no topo, não escondido em um menu.
 */

import { ArrowLeft, Download, EyeOff, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AreaTexto, Aviso, Botao, Cartao, Campo, Selo, Vazio } from '../componentes/ui/primitivos'
import { Modal } from '../componentes/ui/Modal'
import { EditorDeHistoria } from './EditorDeHistoria'
import { ROTULO_COLECAO, type Historia } from '../dominio/tipos'
import { exportarPacote, importarPacote, nomeDoArquivo } from '../armazenamento/portabilidade'
import type { EstadoSalvo } from '../armazenamento/persistencia'

export function TelaBiblioteca({
  baralhoBase,
  estado,
  aoVoltar,
  aoGuardar,
  aoApagar,
  aoAlternarOculta,
  aoSubstituirEstado,
}: {
  baralhoBase: readonly Historia[]
  estado: EstadoSalvo
  aoVoltar: () => void
  aoGuardar: (historia: Historia) => void
  aoApagar: (id: string) => void
  aoAlternarOculta: (id: string) => void
  aoSubstituirEstado: (novo: EstadoSalvo) => void
}) {
  const [busca, setBusca] = useState('')
  const [editorAberto, setEditorAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Historia | null>(null)
  const [importAberto, setImportAberto] = useState(false)
  const [textoImport, setTextoImport] = useState('')
  const [mensagemImport, setMensagemImport] = useState<{ tom: 'brasa' | 'sangue'; texto: string } | null>(null)

  const idsPersonalizadas = useMemo(
    () => new Set(estado.personalizadas.map((historia) => historia.id)),
    [estado.personalizadas],
  )

  const lista = useMemo(() => {
    const todas = [...estado.personalizadas, ...baralhoBase]
    const termo = busca.trim().toLowerCase()
    if (!termo) return todas
    return todas.filter(
      (historia) =>
        historia.titulo.toLowerCase().includes(termo) || historia.situacao.toLowerCase().includes(termo),
    )
  }, [baralhoBase, estado.personalizadas, busca])

  const baixarPacote = () => {
    const conteudo = exportarPacote(estado.personalizadas)
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = nomeDoArquivo()
    link.click()
    URL.revokeObjectURL(url)
  }

  const confirmarImport = () => {
    const resultado = importarPacote(textoImport, estado)
    if (!resultado.ok) {
      setMensagemImport({ tom: 'sangue', texto: resultado.erros.join(' ') })
      return
    }
    aoSubstituirEstado(resultado.valor.estado)
    const partes = [`${resultado.valor.adicionadas} história(s) adicionada(s).`]
    if (resultado.valor.repetidas > 0) partes.push(`${resultado.valor.repetidas} já existiam.`)
    if (resultado.valor.descartadas.length > 0)
      partes.push(`${resultado.valor.descartadas.length} incompleta(s) foram ignoradas.`)
    setMensagemImport({ tom: 'brasa', texto: partes.join(' ') })
    setTextoImport('')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 pt-2">
        <Botao tamanho="sm" variante="fantasma" onClick={aoVoltar}>
          <ArrowLeft size={16} /> Início
        </Botao>
        <span className="text-xs text-zinc-500">
          {baralhoBase.length + estado.personalizadas.length} histórias
        </span>
      </header>

      <h1 className="text-2xl font-bold">Biblioteca</h1>

      <div className="grid grid-cols-3 gap-2">
        <Botao
          variante="primario"
          onClick={() => {
            setEmEdicao(null)
            setEditorAberto(true)
          }}
        >
          <Plus size={16} /> Nova
        </Botao>
        <Botao onClick={() => setImportAberto(true)}>
          <Upload size={16} /> Importar
        </Botao>
        <Botao onClick={baixarPacote} disabled={estado.personalizadas.length === 0}>
          <Download size={16} /> Exportar
        </Botao>
      </div>

      <Campo
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar por título ou situação"
      />

      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma história encontrada">Tente outro termo de busca.</Vazio>
      ) : (
        <ul className="space-y-2">
          {lista.map((historia) => {
            const minha = idsPersonalizadas.has(historia.id)
            const oculta = estado.ocultas.includes(historia.id)
            return (
              <li key={historia.id}>
                <Cartao className={`p-4 ${oculta ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{historia.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{historia.situacao}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Selo tom="brasa">{ROTULO_COLECAO[historia.colecao]}</Selo>
                        <Selo>{historia.dificuldade}</Selo>
                        {minha ? <Selo tom="sangue">minha</Selo> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Botao
                        tamanho="sm"
                        variante="fantasma"
                        onClick={() => aoAlternarOculta(historia.id)}
                        aria-label={oculta ? 'Reativar no sorteio' : 'Tirar do sorteio'}
                      >
                        <EyeOff size={14} />
                      </Botao>
                      {minha ? (
                        <>
                          <Botao
                            tamanho="sm"
                            variante="fantasma"
                            onClick={() => {
                              setEmEdicao(historia)
                              setEditorAberto(true)
                            }}
                            aria-label="Editar"
                          >
                            <Pencil size={14} />
                          </Botao>
                          <Botao
                            tamanho="sm"
                            variante="fantasma"
                            onClick={() => aoApagar(historia.id)}
                            aria-label="Apagar"
                          >
                            <Trash2 size={14} />
                          </Botao>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Cartao>
              </li>
            )
          })}
        </ul>
      )}

      <EditorDeHistoria
        aberto={editorAberto}
        historiaEmEdicao={emEdicao}
        aoFechar={() => setEditorAberto(false)}
        aoSalvar={aoGuardar}
      />

      <Modal aberto={importAberto} titulo="Importar pacote" aoFechar={() => setImportAberto(false)}>
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Cole o conteúdo de um arquivo JSON. Importar soma ao que já existe — nada é substituído.
          </p>
          <AreaTexto
            rows={8}
            value={textoImport}
            onChange={(evento) => setTextoImport(evento.target.value)}
            placeholder='[{ "titulo": "...", "situacao": "...", "solucao": "..." }]'
          />
          {mensagemImport ? <Aviso tom={mensagemImport.tom}>{mensagemImport.texto}</Aviso> : null}
          <Botao variante="primario" tamanho="bloco" onClick={confirmarImport}>
            Importar
          </Botao>
        </div>
      </Modal>
    </div>
  )
}
