<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getLanguageInfo, type LanguageInfo } from '@/entities/language'

const route = useRoute()
const nativeIso = computed(() => route.params.nativeIso as string)

const nativeLanguage = ref<LanguageInfo | null>(null)
const targetLanguages = ref<LanguageInfo[]>([])
const loading = ref(false)
const error = ref(false)

async function loadLanguages() {
  if (!nativeIso.value) return

  try {
    loading.value = true
    error.value = false

    // Load native language info
    nativeLanguage.value = await getLanguageInfo(nativeIso.value)

    // Load available target languages for this native language
    const availableTargetIsos = await fetch(`/data/situations/${nativeIso.value}/available_target_languages.json`)
      .then(res => res.json()) as string[]

    // Load target language details
    targetLanguages.value = await Promise.all(
      availableTargetIsos.map(iso => getLanguageInfo(iso))
    )

    // Sort by display name
    targetLanguages.value.sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (e) {
    console.error('Failed to load languages:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => nativeIso.value, () => {
  loadLanguages()
}, { immediate: true })
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">
      Select Target Language
    </h1>

    <div
      v-if="nativeLanguage"
      class="mb-6"
    >
      <RouterLink
        to="/learn"
        class="text-light hover:underline"
      >
        ← Change native language
      </RouterLink>
      <div class="mt-2">
        <span class="text-light">You speak: </span>
        <span class="font-semibold">{{ nativeLanguage.symbol }} {{ nativeLanguage.displayName }}</span>
      </div>
    </div>

    <div
      v-if="loading"
      class="alert"
    >
      Loading languages...
    </div>

    <div
      v-else-if="error"
      class="alert alert-warning"
    >
      Failed to load languages for this native language.
    </div>

    <div
      v-else-if="targetLanguages.length === 0"
      class="alert"
    >
      No target languages available for {{ nativeLanguage?.displayName || nativeIso }}.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <RouterLink
        v-for="lang in targetLanguages"
        :key="lang.iso"
        :to="`/learn/${nativeIso}/${lang.iso}`"
        class="card shadow bg-white text-gray-700 transition-hover hover:shadow-md cursor-pointer"
      >
        <div class="card-body gap-4 grid place-items-center text-center">
          <div class="text-6xl">
            {{ lang.symbol }}
          </div>
          <h2 class="text-2xl font-semibold">
            {{ lang.displayName }}
          </h2>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
