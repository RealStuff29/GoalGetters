// src/composables/useNotify.js
import { useToast } from 'primevue/usetoast'

export function useNotify(group = 'app') {
  const toast = useToast()

  // Core push with default life, but overridable
  const push = (opts = {}, life) =>
    toast.add({ group, life: life ?? 2500, ...opts })

  // Optional convenience clears
  const clear = () => toast.removeAll()
  const clearGroup = () => toast.removeGroup(group)

  // Normalize error objects → string
  const fromError = (err, fallback = 'Something went wrong') => {
    if (!err) return fallback
    if (typeof err === 'string') return err
    if (err?.message) return err.message
    try { return JSON.stringify(err) } catch { return fallback }
  }

  return {
    // Common cases (with optional custom life)
    success: (title = 'Success', detail = '', life) =>
      push({ severity: 'success', summary: title, detail }, life),
    info: (title = 'Info', detail = '', life) =>
      push({ severity: 'info', summary: title, detail }, life),
    warn: (title = 'Heads up', detail = '', life) =>
      push({ severity: 'warn', summary: title, detail }, life),
    error: (title = 'Something went wrong', detail = '', life = 5000) =>
      push({ severity: 'error', summary: title, detail }, life),

    // Power users: pass any Toast props (closable, icon, etc.)
    raw: push,

    // Helpers
    fromError,
    clear,
    clearGroup,
  }
}
