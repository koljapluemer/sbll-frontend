<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/features/toast/ToastContainer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 container mx-auto p-4 items-center justify-center flex flex-col">
      <RouterView />
    </main>

    <ToastContainer />
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
</style>
