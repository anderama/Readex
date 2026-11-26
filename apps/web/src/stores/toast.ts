// Fila de avisos (toasts): 4 s visível, 6 s quando tem ação "Desfazer"
import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info'
export interface Toast { id: number; type: ToastType; message: string; action?: { label: string; run: () => void } }

const state = reactive({ items: [] as Toast[] })
let seq = 0

export const toast = {
  state,
  show(message: string, type: ToastType = 'success', action?: Toast['action']) {
    const id = ++seq
    state.items.push({ id, type, message, action })
    if (state.items.length > 3) state.items.shift()
    setTimeout(() => toast.dismiss(id), action ? 6000 : 4000)
  },
  success: (m: string, action?: Toast['action']) => toast.show(m, 'success', action),
  error: (m: string) => toast.show(m, 'error'),
  info: (m: string, action?: Toast['action']) => toast.show(m, 'info', action),
  dismiss(id: number) {
    const i = state.items.findIndex((t) => t.id === id)
    if (i >= 0) state.items.splice(i, 1)
  },
}
