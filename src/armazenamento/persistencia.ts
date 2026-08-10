/**
 * Persistencia local do jogo.
 *
 * REGRA CRITICA DESTE PROJETO: dado salvo nao se perde.
 *
 * O jogo nao tem servidor, entao o `localStorage` do aparelho e a unica copia
 * das historias que a pessoa escreveu. Por isso, tudo aqui e defensivo:
 *
 * - leitura nunca lanca excecao e nunca devolve `undefined`;
 * - conteudo ilegivel e movido para uma chave de resgate antes de ser
 *   substituido, nunca sobrescrito em silencio;
 * - escrita que falha (cota cheia, modo privativo) devolve erro explicito para
 *   a interface avisar, em vez de fingir que salvou.
 */

import { semDuplicatas, validarLote } from '../dominio/validacao'
import {
  DIFICULDADES,
  TEMAS,
  falha,
  sucesso,
  type Dificuldade,
  type Historia,
  type Resultado,
  type Tema,
} from '../dominio/tipos'

export const VERSAO_ESTADO = 1
export const CHAVE_ESTADO = 'historias-sinistras:estado'
/** Onde um estado ilegivel e guardado em vez de ser jogado fora. */
export const CHAVE_RESGATE = 'historias-sinistras:estado-ilegivel'

/**
 * Subconjunto de `Storage` que este modulo usa. Depender da interface, e nao do
 * `window.localStorage`, e o que torna a persistencia testavel sem navegador.
 */
export interface Deposito {
  getItem(chave: string): string | null
  setItem(chave: string, valor: string): void
  removeItem(chave: string): void
}

export interface Preferencias {
  dificuldades: Dificuldade[]
  temas: Tema[]
  /** Mostrar as etiquetas de conteudo antes de comecar a carta. */
  mostrarAvisos: boolean
  /** Pedir um toque de confirmacao antes de virar a carta para o lado do mestre. */
  confirmarVirada: boolean
}

export interface EstadoSalvo {
  versao: number
  /** Historico do sorteio sem reposicao. */
  idsJogados: string[]
  /** Historias escritas pela pessoa. So existem aqui. */
  personalizadas: Historia[]
  /** Ids removidos do sorteio sem serem apagados. */
  ocultas: string[]
  preferencias: Preferencias
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  dificuldades: [],
  temas: [],
  mostrarAvisos: true,
  confirmarVirada: true,
}

export function estadoInicial(): EstadoSalvo {
  return {
    versao: VERSAO_ESTADO,
    idsJogados: [],
    personalizadas: [],
    ocultas: [],
    preferencias: { ...PREFERENCIAS_PADRAO },
  }
}

export interface LeituraDoEstado {
  estado: EstadoSalvo
  /**
   * Preenchido quando algo precisou de conserto. A interface mostra isso para a
   * pessoa saber que houve um problema e onde a copia antiga ficou.
   */
  aviso: string | null
}

function listaDeTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const textos = valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return [...new Set(textos)]
}

function normalizarPreferencias(valor: unknown): Preferencias {
  if (typeof valor !== 'object' || valor === null) return { ...PREFERENCIAS_PADRAO }
  const bruto = valor as Record<string, unknown>
  return {
    dificuldades: listaDeTextos(bruto.dificuldades).filter((item): item is Dificuldade =>
      (DIFICULDADES as readonly string[]).includes(item),
    ),
    temas: listaDeTextos(bruto.temas).filter((item): item is Tema => (TEMAS as readonly string[]).includes(item)),
    mostrarAvisos: typeof bruto.mostrarAvisos === 'boolean' ? bruto.mostrarAvisos : PREFERENCIAS_PADRAO.mostrarAvisos,
    confirmarVirada:
      typeof bruto.confirmarVirada === 'boolean' ? bruto.confirmarVirada : PREFERENCIAS_PADRAO.confirmarVirada,
  }
}

/**
 * Transforma qualquer objeto plausivel em um estado valido, aproveitando o
 * maximo do que estiver la. Nunca descarta o conjunto inteiro por causa de um
 * campo isolado.
 */
function normalizarEstado(bruto: Record<string, unknown>): { estado: EstadoSalvo; observacoes: string[] } {
  const observacoes: string[] = []

  const lote = validarLote(bruto.personalizadas ?? [], 'historias salvas')
  const personalizadas = lote.ok ? semDuplicatas(lote.valor.historias) : []
  if (lote.ok && lote.valor.descartadas.length > 0) {
    observacoes.push(`${lote.valor.descartadas.length} historia(s) salva(s) estavam incompletas e foram ignoradas.`)
  }
  if (!lote.ok) {
    observacoes.push('A lista de historias salvas estava em formato invalido.')
  }

  return {
    estado: {
      versao: VERSAO_ESTADO,
      idsJogados: listaDeTextos(bruto.idsJogados),
      personalizadas,
      ocultas: listaDeTextos(bruto.ocultas),
      preferencias: normalizarPreferencias(bruto.preferencias),
    },
    observacoes,
  }
}

/**
 * Aplica migracoes de versao. Hoje so existe a versao 1; a funcao existe para
 * que uma mudanca futura de formato tenha um lugar obvio e nao quebre estados
 * antigos ja salvos nos aparelhos.
 */
function migrar(bruto: Record<string, unknown>): Record<string, unknown> {
  const versao = typeof bruto.versao === 'number' ? bruto.versao : 0
  if (versao > VERSAO_ESTADO) {
    // Estado gravado por uma versao mais nova do app: preserva o que der.
    return bruto
  }
  return bruto
}

export function carregar(deposito: Deposito): LeituraDoEstado {
  let cru: string | null = null
  try {
    cru = deposito.getItem(CHAVE_ESTADO)
  } catch {
    return { estado: estadoInicial(), aviso: 'Nao foi possivel ler os dados salvos neste navegador.' }
  }

  if (!cru) return { estado: estadoInicial(), aviso: null }

  let analisado: unknown
  try {
    analisado = JSON.parse(cru)
  } catch {
    guardarParaResgate(deposito, cru)
    return {
      estado: estadoInicial(),
      aviso:
        'Os dados salvos estavam ilegiveis. Uma copia intacta foi preservada no navegador ' +
        `(chave "${CHAVE_RESGATE}") para nao perder nada.`,
    }
  }

  if (typeof analisado !== 'object' || analisado === null || Array.isArray(analisado)) {
    guardarParaResgate(deposito, cru)
    return {
      estado: estadoInicial(),
      aviso: `Os dados salvos estavam em formato inesperado. Uma copia foi preservada em "${CHAVE_RESGATE}".`,
    }
  }

  const { estado, observacoes } = normalizarEstado(migrar(analisado as Record<string, unknown>))
  if (observacoes.length > 0) {
    // Houve perda parcial: guarda o original antes de o app sobrescrever.
    guardarParaResgate(deposito, cru)
    return {
      estado,
      aviso: `${observacoes.join(' ')} Uma copia do estado anterior ficou em "${CHAVE_RESGATE}".`,
    }
  }

  return { estado, aviso: null }
}

function guardarParaResgate(deposito: Deposito, cru: string): void {
  try {
    deposito.setItem(CHAVE_RESGATE, cru)
  } catch {
    // Sem espaco para o resgate. Nao ha o que fazer aqui alem de nao piorar:
    // o estado original continua na chave principal ate a proxima escrita.
  }
}

export function salvar(deposito: Deposito, estado: EstadoSalvo): Resultado<EstadoSalvo> {
  const paraGravar: EstadoSalvo = { ...estado, versao: VERSAO_ESTADO }
  try {
    deposito.setItem(CHAVE_ESTADO, JSON.stringify(paraGravar))
    return sucesso(paraGravar)
  } catch {
    return falha(
      'Nao foi possivel salvar neste navegador. O armazenamento pode estar cheio ou bloqueado ' +
        '(janela anonima). Exporte suas historias para nao perder o que escreveu.',
    )
  }
}

/**
 * Devolve o conteudo preservado por um carregamento com problema, para a pessoa
 * poder baixar e inspecionar. Nunca apaga nada por conta propria.
 */
export function lerResgate(deposito: Deposito): string | null {
  try {
    return deposito.getItem(CHAVE_RESGATE)
  } catch {
    return null
  }
}

export function descartarResgate(deposito: Deposito): void {
  try {
    deposito.removeItem(CHAVE_RESGATE)
  } catch {
    // Nada a fazer: descartar o resgate e sempre opcional.
  }
}

/**
 * Deposito em memoria. Usado nos testes e como rede de seguranca quando o
 * navegador bloqueia `localStorage` — melhor jogar sem salvar do que quebrar.
 */
export function depositoEmMemoria(inicial: Record<string, string> = {}): Deposito {
  const mapa = new Map(Object.entries(inicial))
  return {
    getItem: (chave) => mapa.get(chave) ?? null,
    setItem: (chave, valor) => void mapa.set(chave, valor),
    removeItem: (chave) => void mapa.delete(chave),
  }
}

export function depositoDoNavegador(): Deposito {
  try {
    const teste = '__historias-sinistras-teste__'
    window.localStorage.setItem(teste, '1')
    window.localStorage.removeItem(teste)
    return window.localStorage
  } catch {
    return depositoEmMemoria()
  }
}
