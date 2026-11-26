// Estado global de interface: modais acionados de várias telas e um "sinal" para recarregar dados
import { reactive } from 'vue'
import type { Book, Progress } from '@/services/types'

export const ui = reactive({
  /** Modal "Atualizar progresso" (abre do Início, da página do livro e da estante) */
  progress: null as null | { book: Book; progress: Progress },
  /** Modal "Terminei o livro" */
  finish: null as null | { book: Book },
  /** Compositor "Nova discussão" (livro pode vir pré-preenchido) */
  composer: null as null | { book?: Book | null },
  /** Incrementado quando estante/progresso mudam, para as telas recarregarem */
  version: 0,
  unread: 0,
})

export const bump = () => { ui.version++ }
