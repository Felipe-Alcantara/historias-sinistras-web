/**
 * Geracao de identificadores.
 *
 * Fica isolado porque o resto do dominio precisa ser puro e testavel: quem
 * chama pode injetar um gerador previsivel nos testes.
 */

export type GeradorDeId = () => string

/**
 * Usa `crypto.randomUUID` quando disponivel e cai para um identificador
 * aleatorio simples em navegadores antigos ou contextos sem HTTPS.
 */
export const gerarId: GeradorDeId = () => {
  const cripto = globalThis.crypto
  if (cripto && typeof cripto.randomUUID === 'function') {
    return cripto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Cria um gerador sequencial, usado em teste para tornar a saida previsivel. */
export function geradorSequencial(prefixo = 'teste'): GeradorDeId {
  let contador = 0
  return () => `${prefixo}-${++contador}`
}
