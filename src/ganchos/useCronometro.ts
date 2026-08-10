import { useEffect, useState } from 'react'

/**
 * Relogio de parede da rodada. Atualiza uma vez por segundo e para quando a
 * rodada termina, para nao manter um temporizador vivo sem motivo.
 */
export function useCronometro(ativo: boolean): number {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    if (!ativo) return
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(intervalo)
  }, [ativo])

  return agora
}
