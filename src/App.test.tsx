/**
 * Teste de fumaça do caminho principal.
 *
 * Não valida regra (isso é feito no domínio): valida que as camadas estão
 * ligadas — baralho carrega, sorteio acontece, a carta vira e o segredo só
 * aparece depois da confirmação.
 */

import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { BARALHO_BASE } from './dados/baralhoBase'

function comecarPartida() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Começar/i }))
}

/*
 * Nada é limpo entre os casos de propósito. Neste ambiente de teste o
 * `localStorage` global é um objeto incompleto, sem `removeItem` nem `clear` —
 * exatamente o tipo de navegador hostil que a persistência precisa tolerar.
 * `depositoDoNavegador()` detecta isso e cai para um depósito em memória novo a
 * cada montagem, o que já isola os casos. Se algum dia estes testes começarem a
 * vazar estado entre si, é sinal de que o ambiente passou a ter armazenamento
 * real e um `beforeEach` de limpeza será necessário.
 */
describe('fluxo principal', () => {
  it('abre na tela inicial mostrando o tamanho do baralho', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Histórias/i)
    expect(screen.getByText(new RegExp(`de ${BARALHO_BASE.length} inéditas`))).toBeInTheDocument()
  })

  it('sorteia uma carta e mostra a frente, nunca o verso', () => {
    comecarPartida()

    expect(screen.getByText('Para todos')).toBeInTheDocument()
    expect(screen.queryByText('Só o mestre')).not.toBeInTheDocument()
    // O painel de respostas do mestre só existe na frente da carta.
    expect(screen.getByRole('button', { name: /^Irrelevante/ })).toBeInTheDocument()
  })

  it('exige confirmação antes de revelar o verso', () => {
    comecarPartida()

    fireEvent.click(screen.getByRole('button', { name: /Ver a solução/i }))
    expect(screen.getByText(/O outro lado tem a solução/i)).toBeInTheDocument()
    expect(screen.queryByText('Só o mestre')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Sou o mestre/i }))
    expect(screen.getByText('Só o mestre')).toBeInTheDocument()
    expect(screen.getByText(/O que o grupo já descobriu/i)).toBeInTheDocument()
  })

  it('conta as respostas dadas pelo mestre', () => {
    comecarPartida()

    const botaoSim = screen.getByRole('button', { name: /^Sim/ })
    fireEvent.click(botaoSim)
    fireEvent.click(botaoSim)

    expect(screen.getByText('2 perguntas')).toBeInTheDocument()
  })

  it('guarda o histórico do sorteio entre partidas', () => {
    comecarPartida()
    fireEvent.click(screen.getByRole('button', { name: /Início/i }))

    expect(screen.getByText(new RegExp(`de ${BARALHO_BASE.length} inéditas`))).toBeInTheDocument()
    const restantes = screen.getByText(String(BARALHO_BASE.length - 1))
    expect(restantes).toBeInTheDocument()
  })

  it('abre a biblioteca com o baralho inteiro', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Biblioteca/i }))

    const cabecalho = screen.getByText(`${BARALHO_BASE.length} histórias`)
    expect(cabecalho).toBeInTheDocument()
    expect(within(screen.getByRole('heading', { level: 1 })).getByText('Biblioteca')).toBeInTheDocument()
  })
})
