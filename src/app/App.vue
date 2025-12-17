<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/dumb/AppHeader.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <AppHeader />
    <main class="flex-1 container mx-auto p-4 items-center justify-center flex flex-col">
      <RouterView />
    </main>
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
</style>
