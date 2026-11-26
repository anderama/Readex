// Ações de estante reaproveitadas por várias telas (com aviso e "Desfazer")
import { api, ApiError } from '@/services/http'
import type { Book, ShelfItem, ShelfStatus } from '@/services/types'
import { toast } from '@/stores/toast'
import { bump } from '@/stores/ui'

const labels: Record<ShelfStatus, string> = { QUERO_LER: 'Quero ler', LENDO: 'Lendo agora', CONCLUIDO: 'Concluído' }

export function useShelf() {
  async function setStatus(book: Pick<Book, 'id' | 'title'>, status: ShelfStatus, previous?: ShelfStatus | null) {
    try {
      const { item } = await api.put<{ item: ShelfItem }>(`/shelf/${book.id}`, { status })
      bump()
      const undo = previous === undefined ? undefined : {
        label: 'Desfazer',
        run: async () => {
          if (previous) await api.put(`/shelf/${book.id}`, { status: previous })
          else await api.del(`/shelf/${book.id}`)
          bump()
        },
      }
      toast.success(previous ? `${book.title} movido para ${labels[status]}.` : `${book.title} adicionado à estante em ${labels[status]}.`, undo)
      return item
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível salvar. Tente de novo.')
      return null
    }
  }

  async function remove(book: Pick<Book, 'id' | 'title'>) {
    try {
      const { removed } = await api.del<{ removed: { status: ShelfStatus; currentPage: number } }>(`/shelf/${book.id}`)
      bump()
      toast.success(`${book.title} removido da estante.`, {
        label: 'Desfazer',
        run: async () => { await api.put(`/shelf/${book.id}`, removed); bump() },
      })
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível remover. Tente de novo.')
      return false
    }
  }

  return { setStatus, remove }
}
