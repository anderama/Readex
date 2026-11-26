<script setup lang="ts">
// RX/Sidebar: menu lateral fixo em vidro (branco 55% + desfoque). Item ativo em Smoky Black.
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BrandLogo from './BrandLogo.vue'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import { session } from '@/stores/session'
import { settingsItem, sidebarItems } from './navItems'

defineEmits<{ navigate: [] }>()
const route = useRoute()
const active = (match: string[]) => match.includes(String(route.name))
const user = computed(() => session.user.value)
</script>

<template>
  <nav aria-label="Menu principal" class="flex h-full w-60 flex-col gap-7 border-r border-cloud bg-white/55 px-4 pb-5 pt-6 backdrop-blur-[16px]">
    <RouterLink to="/" class="self-start rounded-md pl-2" aria-label="Readex, ir para o Início" @click="$emit('navigate')"><BrandLogo /></RouterLink>
    <ul class="flex flex-col gap-1">
      <li v-for="item in sidebarItems" :key="item.to">
        <RouterLink
          :to="item.to" :aria-current="active(item.match) ? 'page' : undefined"
          class="flex items-center gap-3 rounded-md px-3 py-[11px] text-body-14 transition-ui"
          :class="active(item.match) ? 'bg-smoky font-semibold text-white' : 'text-smoky hover:bg-smoky/5'"
          @click="$emit('navigate')"
        >
          <component :is="item.icon" :size="22" :stroke-width="2" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </li>
      <li class="my-1 h-px bg-cloud" aria-hidden="true" />
      <li>
        <RouterLink
          :to="settingsItem.to" :aria-current="active(settingsItem.match) ? 'page' : undefined"
          class="flex items-center gap-3 rounded-md px-3 py-[11px] text-body-14 transition-ui"
          :class="active(settingsItem.match) ? 'bg-smoky font-semibold text-white' : 'text-smoky hover:bg-smoky/5'"
          @click="$emit('navigate')"
        >
          <component :is="settingsItem.icon" :size="22" :stroke-width="2" aria-hidden="true" />
          {{ settingsItem.label }}
        </RouterLink>
      </li>
    </ul>
    <div class="flex-1" />
    <RouterLink v-if="user" to="/perfil" class="flex items-center gap-3 rounded-md border border-cloud bg-white p-2.5 transition-ui hover:border-border-strong" @click="$emit('navigate')">
      <AvatarCircle :name="user.name" :src="user.avatarUrl" />
      <span class="flex min-w-0 flex-col">
        <span class="truncate text-body-14 font-semibold text-smoky">{{ user.name }}</span>
        <span class="truncate text-body-12 text-secondary">@{{ user.username }}</span>
      </span>
    </RouterLink>
  </nav>
</template>
