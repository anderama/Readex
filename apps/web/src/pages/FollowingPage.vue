<script setup lang="ts">
// Leitores que alguém segue
import { useRoute } from 'vue-router'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import UserCard from '@/components/base/UserCard.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import { api } from '@/services/http'
import type { UserSummary } from '@/services/types'
import { useAsync } from '@/composables/useAsync'

const route = useRoute()
const username = String(route.params.username)
const { data, loading, error, load } = useAsync(() => api.get<{ results: (UserSummary & { bio: string })[] }>(`/users/${username}/following`).then((r) => r.results))
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Seguindo" :crumbs="[{ label: `@${username}`, to: `/leitores/${username}` }, { label: 'Seguindo' }]" />
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <SkeletonBlock v-else-if="loading" h="160px" />
    <EmptyState v-else-if="!data?.length" mascot="waving" title="Ainda não segue ninguém" />
    <ul v-else class="flex max-w-[600px] flex-col divide-y divide-cloud">
      <li v-for="u in data" :key="u.id" class="py-4"><UserCard :user="u" :subtitle="u.bio || `@${u.username}`" /></li>
    </ul>
  </div>
</template>
