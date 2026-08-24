const GROQ_TPM_LIMIT = 8000
export const DEFAULT_RECLASSIFY_WAIT_MS = 35000

// A Groq reserva tokens contra o limite por minuto (TPM) no momento da chamada.
// Calculamos a pausa com base no valor real reservado (retornado pela API),
// em vez de um tempo fixo, para não estourar o limite nem esperar mais do que precisa.
export function reclassifyWaitMs(tokensUsed: number | undefined) {
  if (!tokensUsed) return DEFAULT_RECLASSIFY_WAIT_MS
  return Math.ceil((tokensUsed / GROQ_TPM_LIMIT) * 60000 * 1.1)
}
