<script setup lang="ts">
// Onboarding: 3 slides com o mascote, escolha de gêneros favoritos e primeiros passos
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from 'lucide-vue-next'
import panel from '@/assets/brand/gradient-panel.svg'
import reading from '@/assets/mascot/reading.png'
import running from '@/assets/mascot/running.png'
import waving from '@/assets/mascot/waving.png'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import RxButton from '@/components/base/RxButton.vue'
import GenreFilter from '@/components/books/GenreFilter.vue'
import { api } from '@/services/http'
import type { User } from '@/services/types'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'
import { firstName } from '@/utils/format'

const router = useRouter()
const step = ref(0)
const genres = ref<string[]>([])
const picked = ref<string[]>([])
const saving = ref(false)

const slides = [
  { img: reading, title: 'Controle suas leituras em um só lugar', text: 'Registre a página em que parou e acompanhe seu progresso em cada livro.' },
  { img: running, title: 'Crie o hábito com metas', text: 'Escolha quantos livros quer ler no mês e mantenha sua sequência de dias de leitura.' },
  { img: waving, title: 'Leia junto com outros leitores', text: 'Avalie livros, escreva resenhas e participe das discussões da comunidade.' },
]
const mascot = computed(() => (step.value < 3 ? slides[step.value].img : step.value === 3 ? reading : waving))

onMounted(async () => { genres.value = (await api.get<{ genres: string[] }>('/books/genres')).genres.slice(0, 10) })

async function finish(goTo = '/') {
  saving.value = true
  try {
    const { user } = await api.put<{ user: User }>('/me/onboarding', { favoriteGenres: picked.value })
    session.setUser(user)
    toast.success(`Tudo pronto, ${firstName(user.name)}!`)
    router.replace(goTo)
  } finally { saving.value = false }
}
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <div class="relative hidden overflow-hidden lg:block" aria-hidden="true">
      <img :src="panel" alt="" class="absolute inset-0 size-full object-cover" />
      <div class="relative flex h-full items-center justify-center p-16">
        <Transition name="fade" mode="out-in"><img :key="mascot" :src="mascot" alt="" class="max-h-[56vh] w-auto max-w-[60%] object-contain" /></Transition>
      </div>
    </div>
    <div class="flex flex-col px-6 pb-10 pt-8 sm:px-12 lg:px-[120px] lg:pt-16">
      <div class="flex items-center justify-between">
        <BrandLogo size="sm" />
        <button v-if="step < 3" type="button" class="rounded-md px-2 py-1 text-body-14 font-semibold text-body hover:text-smoky" @click="step = 3">Pular</button>
      </div>
      <img :src="mascot" alt="" class="mx-auto mt-8 h-40 w-auto object-contain lg:hidden" aria-hidden="true" />
      <main class="flex max-w-[600px] flex-1 flex-col justify-center gap-8 py-10">
        <div v-if="step < 3" class="flex gap-2" aria-hidden="true">
          <span v-for="i in 3" :key="i" class="h-1 rounded-full transition-all" :class="i - 1 === step ? 'w-10 bg-sauce' : 'w-6 bg-cloud'" />
        </div>
        <Transition name="fade" mode="out-in">
          <section v-if="step < 3" :key="step" class="flex flex-col gap-4" aria-live="polite">
            <p class="sr-only">Passo {{ step + 1 }} de 3</p>
            <h1 class="text-title-40 font-bold text-smoky lg:text-title-48">{{ slides[step].title }}</h1>
            <p class="text-body-18 text-body">{{ slides[step].text }}</p>
          </section>
          <section v-else-if="step === 3" key="genres" class="flex flex-col gap-4">
            <h1 class="text-title-40 font-bold text-smoky">O que você gosta de ler?</h1>
            <p class="text-body-16 text-body">Escolha quantos gêneros quiser. Usamos isso no "Sugerido para você".</p>
            <GenreFilter v-model="picked" :genres="genres" />
          </section>
          <section v-else key="steps" class="flex flex-col gap-6">
            <h1 class="text-title-40 font-bold text-smoky">Primeiros passos</h1>
            <ol class="flex flex-col gap-4">
              <li v-for="(s, i) in ['Adicione o livro que você está lendo', 'Defina sua meta do mês', 'Registre a página em que parou']" :key="s" class="flex items-center gap-4">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-sm bg-fire-light text-body-14 font-semibold text-smoky">{{ i + 1 }}</span>
                <span class="text-body-16 text-smoky">{{ s }}</span>
              </li>
            </ol>
          </section>
        </Transition>
        <div class="flex flex-wrap items-center gap-4">
          <RxButton v-if="step < 3" @click="step++">{{ step === 2 ? 'Começar' : 'Próximo' }}</RxButton>
          <RxButton v-else-if="step === 3" @click="step = 4">{{ picked.length ? 'Continuar' : 'Pular esta etapa' }}</RxButton>
          <template v-else>
            <RxButton :loading="saving" @click="finish('/explorar?adicionar=1')"><Check :size="18" /> Adicionar meu primeiro livro</RxButton>
            <RxButton variant="secondary" :disabled="saving" @click="finish('/')">Ir para o Início</RxButton>
          </template>
          <button v-if="step > 0" type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="step--">Voltar</button>
        </div>
      </main>
    </div>
  </div>
</template>
