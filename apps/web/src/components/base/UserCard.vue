<script setup lang="ts">
// Cartão de leitor: avatar, nome e @usuário (link para o perfil)
import { RouterLink } from 'vue-router'
import AvatarCircle from './AvatarCircle.vue'
import type { UserSummary } from '@/services/types'

defineProps<{ user: UserSummary; subtitle?: string; size?: number; to?: string }>()
</script>

<template>
  <RouterLink :to="to ?? `/leitores/${user.username}`" class="group flex min-w-0 items-center gap-3 rounded-md">
    <AvatarCircle :name="user.name" :src="user.avatarUrl" :size="size ?? 40" />
    <span class="flex min-w-0 flex-col">
      <span class="truncate text-body-14 font-semibold text-smoky group-hover:underline">{{ user.name }}</span>
      <span class="truncate text-body-12 text-secondary">{{ subtitle ?? `@${user.username}` }}</span>
    </span>
    <slot />
  </RouterLink>
</template>
