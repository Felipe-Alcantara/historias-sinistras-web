/**
 * Validacao de historias vindas de fora do codigo: arquivo JSON do baralho,
 * pacote importado pela pessoa, saida do script gerador.
 *
 * Regra: nada aqui lanca excecao. Toda funcao devolve `Resultado`, com a lista
 * completa de erros, para que a interface consiga dizer exatamente o que esta
 * errado em vez de falhar em silencio.
 */

import { gerarId } from './identificadores'
import {
  AVISOS_DE_CONTEUDO,
  COLECOES,
  DIFICULDADES,
  TEMAS,
  TIPOS_ORIGEM,
  falha,
  sucesso,
  type AvisoDeConteudo,
  type Colecao,
  type Dificuldade,
  type FatoChave,
  type Historia,
  type Origem,
  type Resultado,
  type Tema,
  type TipoOrigem,
} from './tipos'

/** Limites de tamanho. Existem para impedir que um import gigante trave a interface. */
export const LIMITES = {
  titulo: 120,
  situacao: 1200,
  solucao: 4000,
  fatoChave: 300,
  fatosChavePorHistoria: 12,
  avisosPorHistoria: 8,
  temasPorHistoria: 4,
  duracaoMinima: 1,
  duracaoMaxima: 180,
  historiasPorPacote: 5000,
} as const

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function textoLimpo(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function listaDeTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.map(textoLimpo).filter((texto) => texto.length > 0)
}

function dentroDe<T extends string>(valor: string, permitidos: readonly T[]): valor is T {
  return (permitidos as readonly string[]).includes(valor)
}

/**
 * Rotulos que existiam antes da lista fechada de avisos, e o aviso que passou a
 * cobri-los. Sem esta tabela, uma carta salva ou exportada antes da lista
 * perderia o aviso ao ser carregada. Como e um `Record` sobre todos os avisos,
 * o compilador cobra uma entrada (mesmo vazia) para cada aviso novo.
 */
const SINONIMOS_DE_AVISO: Record<AvisoDeConteudo, readonly string[]> = {
  morte: ['mortes', 'corpo', 'afogamento', 'hipotermia', 'inanição', 'explosão', 'envenenamento'],
  homicídio: ['tentativa de homicídio', 'enforcamento'],
  suicídio: ['ideação suicida'],
  violência: ['agressão', 'mutilação', 'arma de fogo'],
  'violência doméstica': [],
  abuso: ['abuso contra idoso'],
  'maus-tratos infantis': [],
  'morte de criança': ['mortes de crianças'],
  'morte de animal': [],
  sequestro: [],
  desaparecimento: [],
  'perseguição e ameaça': ['perseguição', 'ameaça', 'ameaça a crianças', 'assédio', 'invasão de privacidade'],
  luto: [],
  'doença grave': ['doenças', 'doença ocupacional', 'epidemia', 'malformações', 'radiação'],
  'saúde mental': ['internação psiquiátrica', 'acumulação'],
  'acidente grave': [
    'acidente',
    'acidentes',
    'acidente aéreo',
    'naufrágio',
    'incêndio',
    'fogo',
    'ferimento grave',
    'ferimentos graves',
  ],
  'desastre com mortes em massa': ['mortes em massa', 'bombardeio'],
  guerra: [],
  canibalismo: [],
  discriminação: ['capacitismo'],
  'crime patrimonial': ['assalto', 'fraude', 'incêndio criminoso'],
  'procedimento médico': ['ambiente hospitalar'],
}

function semAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

const AVISO_POR_TEXTO = new Map<string, AvisoDeConteudo>(
  AVISOS_DE_CONTEUDO.flatMap((aviso) =>
    [aviso, ...SINONIMOS_DE_AVISO[aviso]].map((texto): [string, AvisoDeConteudo] => [semAcentos(texto), aviso]),
  ),
)

/**
 * Aceita so avisos da lista fechada (ou sinonimos dela) e descarta o resto sem
 * recusar a carta: uma etiqueta fora da lista nao justifica perder a historia.
 */
function normalizarAvisos(valor: unknown): AvisoDeConteudo[] {
  const avisos = listaDeTextos(valor)
    .map((texto) => AVISO_POR_TEXTO.get(semAcentos(texto)))
    .filter((aviso): aviso is AvisoDeConteudo => aviso !== undefined)
  return [...new Set(avisos)].slice(0, LIMITES.avisosPorHistoria)
}

function normalizarFatosChave(valor: unknown, erros: string[], onde: string): FatoChave[] {
  if (valor === undefined || valor === null) return []
  if (!Array.isArray(valor)) {
    erros.push(`${onde}: "fatosChave" deveria ser uma lista.`)
    return []
  }

  const fatos: FatoChave[] = []
  for (const item of valor.slice(0, LIMITES.fatosChavePorHistoria)) {
    // Aceita tanto ["texto"] quanto [{ id, texto }] — o script gerador produz o
    // formato curto e o app produz o completo.
    const texto = typeof item === 'string' ? textoLimpo(item) : textoLimpo((item as Record<string, unknown>)?.texto)
    if (!texto) continue
    const idExistente = ehObjeto(item) ? textoLimpo(item.id) : ''
    fatos.push({ id: idExistente || gerarId(), texto: texto.slice(0, LIMITES.fatoChave) })
  }
  return fatos
}

function normalizarOrigem(valor: unknown): Origem {
  if (!ehObjeto(valor)) {
    return { tipo: 'autoral', referencia: '' }
  }
  const tipoBruto = textoLimpo(valor.tipo)
  const tipo: TipoOrigem = dentroDe(tipoBruto, TIPOS_ORIGEM) ? tipoBruto : 'autoral'
  return { tipo, referencia: textoLimpo(valor.referencia).slice(0, LIMITES.titulo) }
}

function normalizarDuracao(valor: unknown): number {
  const numero = typeof valor === 'number' ? valor : Number.parseInt(textoLimpo(valor), 10)
  if (!Number.isFinite(numero)) return 20
  return Math.min(LIMITES.duracaoMaxima, Math.max(LIMITES.duracaoMinima, Math.round(numero)))
}

/**
 * Converte um valor desconhecido em `Historia`.
 *
 * Campos obrigatorios (titulo, situacao, solucao) fazem a validacao falhar.
 * Campos opcionais mal preenchidos sao corrigidos para um padrao seguro, porque
 * descartar uma historia inteira por causa de uma etiqueta errada seria pior.
 */
export function validarHistoria(valor: unknown, onde = 'historia'): Resultado<Historia> {
  const erros: string[] = []

  if (!ehObjeto(valor)) {
    return falha(`${onde}: esperava um objeto.`)
  }

  const titulo = textoLimpo(valor.titulo)
  const situacao = textoLimpo(valor.situacao)
  const solucao = textoLimpo(valor.solucao)

  if (!titulo) erros.push(`${onde}: "titulo" e obrigatorio.`)
  if (!situacao) erros.push(`${onde}: "situacao" e obrigatoria (e a frente da carta).`)
  if (!solucao) erros.push(`${onde}: "solucao" e obrigatoria (e o verso da carta).`)

  if (erros.length > 0) return { ok: false, erros }

  const dificuldadeBruta = textoLimpo(valor.dificuldade)
  const dificuldade: Dificuldade = dentroDe(dificuldadeBruta, DIFICULDADES) ? dificuldadeBruta : 'media'

  // Sem colecao declarada, a carta cai em "internet": e o balde mais neutro e
  // evita que um pacote de terceiro entre marcado como caso real sem ser.
  const colecaoBruta = textoLimpo(valor.colecao).toLowerCase()
  const colecao: Colecao = dentroDe(colecaoBruta, COLECOES) ? colecaoBruta : 'internet'

  const temas = listaDeTextos(valor.temas)
    .map((tema) => tema.toLowerCase())
    .filter((tema): tema is Tema => dentroDe(tema, TEMAS))
    .slice(0, LIMITES.temasPorHistoria)

  return sucesso({
    id: textoLimpo(valor.id) || gerarId(),
    titulo: titulo.slice(0, LIMITES.titulo),
    situacao: situacao.slice(0, LIMITES.situacao),
    solucao: solucao.slice(0, LIMITES.solucao),
    fatosChave: normalizarFatosChave(valor.fatosChave, erros, onde),
    colecao,
    dificuldade,
    temas: temas.length > 0 ? temas : ['misterio'],
    avisosConteudo: normalizarAvisos(valor.avisosConteudo),
    duracaoMin: normalizarDuracao(valor.duracaoMin),
    origem: normalizarOrigem(valor.origem),
  })
}

export interface ResultadoLote {
  historias: Historia[]
  /**
   * Um item por historia descartada, com todos os motivos daquela carta juntos.
   * E uma linha por carta, e nao por erro, para que contar o tamanho da lista
   * responda "quantas historias se perderam" sem exagerar o numero.
   */
  descartadas: string[]
}

/**
 * Valida uma lista inteira. Historias invalidas sao descartadas com o motivo
 * registrado, e as validas seguem: um pacote de 200 cartas nao pode ser perdido
 * porque a carta 57 veio sem solucao.
 */
export function validarLote(valor: unknown, onde = 'pacote'): Resultado<ResultadoLote> {
  if (!Array.isArray(valor)) {
    return falha(`${onde}: esperava uma lista de historias.`)
  }
  if (valor.length > LIMITES.historiasPorPacote) {
    return falha(`${onde}: pacote com ${valor.length} historias excede o limite de ${LIMITES.historiasPorPacote}.`)
  }

  const historias: Historia[] = []
  const descartadas: string[] = []

  valor.forEach((item, indice) => {
    const resultado = validarHistoria(item, `${onde}[${indice}]`)
    if (resultado.ok) {
      historias.push(resultado.valor)
    } else {
      descartadas.push(resultado.erros.join(' '))
    }
  })

  return sucesso({ historias, descartadas })
}

/** Remove historias com o mesmo id, mantendo a primeira ocorrencia. */
export function semDuplicatas(historias: readonly Historia[]): Historia[] {
  const vistos = new Set<string>()
  const unicas: Historia[] = []
  for (const historia of historias) {
    if (vistos.has(historia.id)) continue
    vistos.add(historia.id)
    unicas.push(historia)
  }
  return unicas
}
