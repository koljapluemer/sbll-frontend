<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import type { TargetLanguage } from '@/dumb/types'

const router = useRouter()
const languageStore = useLanguageStore()
const languages = ref<TargetLanguage[]>([])
const selectedIso = ref<string | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    languages.value = await parseJsonl<TargetLanguage>('/data/target_languages.jsonl')
  } catch (error) {
    console.error('Failed to load target languages:', error)
  } finally {
    isLoading.value = false
  }
})

const selectLanguage = (iso: string) => {
  selectedIso.value = iso
}

const confirmSelection = () => {
  if (selectedIso.value) {
    languageStore.setTargetLanguage(selectedIso.value)
    router.push('/situations')
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">
      Select Target Language
    </h1>

    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else
      class="flex flex-col gap-2 max-w-md"
    >
      <button
        v-for="lang in languages"
        :key="lang.iso"
        :class="[
          'btn btn-outline justify-start',
          selectedIso === lang.iso && 'btn-primary'
        ]"
        @click="selectLanguage(lang.iso)"
      >
        <span class="text-2xl mr-2">{{ lang.short }}</span>
        <span>{{ lang.name }}</span>
      </button>

      <button
        :disabled="!selectedIso"
        class="btn btn-primary mt-4"
        @click="confirmSelection"
      >
        Continue
      </button>
    </div>
  </div>
</template>
