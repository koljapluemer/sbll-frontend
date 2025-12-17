<script setup lang="ts">
import { Home, BarChart3 } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isOnStatsPage = computed(() => route.name === 'stats')
</script>

<template>
  <header class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <RouterLink
        to="/"
        class="btn btn-ghost text-xl"
      >
        <span class="hidden sm:inline">SBLL</span>
      </RouterLink>
    </div>
    <div class="flex-none gap-2">
      <RouterLink
        to="/"
        class="btn btn-ghost"
        :class="{ 'btn-active': !isOnStatsPage }"
      >
        <Home :size="20" />
        <span class="hidden sm:inline ml-2">Home</span>
      </RouterLink>
      <RouterLink
        to="/stats"
        class="btn btn-ghost"
        :class="{ 'btn-active': isOnStatsPage }"
      >
        <BarChart3 :size="20" />
        <span class="hidden sm:inline ml-2">Stats</span>
      </RouterLink>
    </div>
  </header>
</template>
