// Contagem regressiva para "Reenviar código" (45 s)
import { onBeforeUnmount, ref } from 'vue'

export function useCountdown(seconds = 45) {
  const left = ref(seconds)
  let t: ReturnType<typeof setInterval> | undefined
  function start() {
    left.value = seconds
    clearInterval(t)
    t = setInterval(() => { left.value = Math.max(0, left.value - 1); if (!left.value) clearInterval(t) }, 1000)
  }
  onBeforeUnmount(() => clearInterval(t))
  start()
  return { left, start }
}
