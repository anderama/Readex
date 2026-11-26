// Formatação pt-BR: números (1.240 · 4,3), tempo ("21 h 40 min") e datas relativas ("há 5 min")
const num = new Intl.NumberFormat('pt-BR')
const dec = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const fmtNumber = (n: number) => num.format(n)
export const fmtRating = (n: number) => dec.format(n)

export function fmtMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function timeAgo(iso: string | Date) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) { const w = Math.floor(days / 7); return `há ${w} ${w === 1 ? 'semana' : 'semanas'}` }
  if (days < 365) { const m = Math.floor(days / 30); return `há ${m} ${m === 1 ? 'mês' : 'meses'}` }
  return d.toLocaleDateString('pt-BR')
}

/** "Última leitura ontem" / "hoje" / "há 3 dias" */
export function lastReadLabel(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  return `há ${diff} dias`
}

export const fmtDate = (iso: string | Date) => new Date(iso).toLocaleDateString('pt-BR')
export const fmtLongDate = (d = new Date()) => {
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export const monthName = (m: number) => ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m - 1]

export function greeting(d = new Date()) {
  const h = d.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export const firstName = (name: string) => name.split(' ')[0]
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
export const plural = (n: number, one: string, many: string) => `${fmtNumber(n)} ${n === 1 ? one : many}`

export const statusLabel: Record<string, string> = { QUERO_LER: 'Quero ler', LENDO: 'Lendo agora', CONCLUIDO: 'Concluído' }
