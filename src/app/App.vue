<script setup lang="ts">
import { RouterView } from 'vue-router'
import LanguageFooter from '@/features/language-footer/LanguageFooter.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 container mx-auto p-4">
      <RouterView />
    </main>

    <LanguageFooter />
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
</style>