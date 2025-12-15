<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getLanguageInfo, type LanguageInfo } from '@/entities/language'

const nativeLanguages = ref<LanguageInfo[]>([])
const loading = ref(false)
const error = ref(false)

onMounted(async () => {
  try {
    loading.value = true

    // Load available native language ISOs
    const availableIsos = await fetch('/data/situations/available_native_languages.json')
      .then(res => res.json()) as string[]

    // Load language details
    nativeLanguages.value = await Promise.all(
      availableIsos.map(iso => getLanguageInfo(iso))
    )

    // Sort by display name
    nativeLanguages.value.sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (e) {
    console.error('Failed to load native languages:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">
      Select Your Native Language
    </h1>

    <div v-if="loading" class="alert">
      Loading languages...
    </div>

    <div v-else-if="error" class="alert alert-warning">
      Failed to load languages.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink
        v-for="lang in nativeLanguages"
        :key="lang.iso"
        :to="`/learn/${lang.iso}`"
        class="card shadow bg-white text-gray-700 transition-hover hover:shadow-md cursor-pointer"
      >
        <div class="card-body gap-4 grid place-items-center text-center">
          <div class="text-6xl">{{ lang.symbol }}</div>
          <h2 class="text-2xl font-semibold">{{ lang.displayName }}</h2>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
