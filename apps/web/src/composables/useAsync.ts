// Carregamento com estados de loading / erro / dados, e recarga quando a estante muda (ui.version)
import { ref, watch, type Ref } from 'vue'
import { ApiError } from '@/services/http'
import { ui } from '@/stores/ui'

export function useAsync<T>(fn: () => Promise<T>, opts: { watchVersion?: boolean; immediate?: boolean } = {}) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load(silent = false) {
    if (!silent) loading.value = true
    error.value = null
    try {
      data.value = await fn()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Algo deu errado.'
    } finally {
      loading.value = false
    }
  }
  if (opts.immediate !== false) load()
  if (opts.watchVersion !== false) watch(() => ui.version, () => load(true))
  return { data, loading, error, load }
}
