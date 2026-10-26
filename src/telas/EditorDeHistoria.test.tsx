import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditorDeHistoria } from './EditorDeHistoria'
import type { Historia } from '../dominio/tipos'
import { criarHistoria } from '../testes/fabricas'

function abrirEditor(historiaEmEdicao: Historia | null = null) {
  const aoSalvar = vi.fn()
  render(<EditorDeHistoria aberto historiaEmEdicao={historiaEmEdicao} aoFechar={() => {}} aoSalvar={aoSalvar} />)
  return aoSalvar
}

describe('avisos de conteudo no editor', () => {
  it('salva os avisos escolhidos entre os da lista', () => {
    const aoSalvar = abrirEditor()
    fireEvent.change(screen.getByPlaceholderText('O pacote fechado'), { target: { value: 'Titulo novo' } })
    fireEvent.change(screen.getByPlaceholderText(/Um homem é encontrado/), { target: { value: 'Uma frente.' } })
    fireEvent.change(screen.getByPlaceholderText(/Ele saltou/), { target: { value: 'Um verso.' } })

    fireEvent.click(screen.getByRole('button', { name: 'luto' }))
    fireEvent.click(screen.getByRole('button', { name: 'saúde mental' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(aoSalvar).toHaveBeenCalledOnce()
    expect(aoSalvar.mock.calls[0]?.[0].avisosConteudo).toEqual(['luto', 'saúde mental'])
  })

  it('desmarca um aviso ao clicar de novo', () => {
    abrirEditor()
    const luto = screen.getByRole('button', { name: 'luto' })

    fireEvent.click(luto)
    expect(luto).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(luto)
    expect(luto).toHaveAttribute('aria-pressed', 'false')
  })

  it('abre uma carta existente com os avisos dela marcados', () => {
    abrirEditor(criarHistoria({ avisosConteudo: ['homicídio'] }))

    expect(screen.getByRole('button', { name: 'homicídio' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'luto' })).toHaveAttribute('aria-pressed', 'false')
  })
})
