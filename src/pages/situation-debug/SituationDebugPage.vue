<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import type { Gloss } from '@/dumb/types'

const route = useRoute()
const languageStore = useLanguageStore()
const glosses = ref<Gloss[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationId = computed(() => route.params.id as string)

const glossFilePath = computed(() => {
  const target = languageStore.targetIso
  const native = languageStore.nativeIso
  return `/data/${situationId.value}_${target}_${native}.jsonl`
})

onMounted(async () => {
  try {
    glosses.value = await parseJsonl<Gloss>(glossFilePath.value)
  } catch (err) {
    console.error('Failed to load glosses:', err)
    error.value = 'Could not load glosses'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Debug: {{ situationId }}</h1>

    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-xs">
        <thead>
          <tr>
            <th>Key</th>
            <th>Content</th>
            <th>Language</th>
            <th>Transcriptions</th>
            <th>Translations</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gloss in glosses" :key="gloss.key">
            <td>{{ gloss.key }}</td>
            <td>{{ gloss.content }}</td>
            <td>{{ gloss.language }}</td>
            <td>{{ gloss.transcriptions.join(', ') }}</td>
            <td>{{ gloss.translations.join(', ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
