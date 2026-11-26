<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastNotification from '@/components/base/ToastNotification.vue'
</script>

<template>
  <RouterView />
  <ToastNotification />
</template>
