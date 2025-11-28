<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { extractUnderstandingChallenges } from '@/features/understanding-challenges/extract-challenges'
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

const challenges = computed(() =>
  extractUnderstandingChallenges(glosses.value, languageStore.targetIso)
)

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

    <div v-else>
      <h2 class="text-2xl font-bold mb-4">Understanding Challenges</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div v-for="challenge in challenges" :key="challenge.key" class="card shadow">
          <div class="card-body">
            <h3 class="card-title">{{ challenge.content }}</h3>
            <div class="overflow-x-auto">
              <table class="table table-xs">
                <tbody>
                  <tr>
                    <td>Key</td>
                    <td>{{ challenge.key }}</td>
                  </tr>
                  <tr>
                    <td>Transcription</td>
                    <td>{{ challenge.transcriptions.join(', ') }}</td>
                  </tr>
                  <tr>
                    <td>Translation</td>
                    <td>{{ challenge.translations.join(', ') }}</td>
                  </tr>
                  <tr>
                    <td>Contains</td>
                    <td>{{ challenge.contains.length }} items</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">All Glosses</h2>
      <div class="overflow-x-auto">
      <table class="table table-xs">
        <thead>
          <tr>
            <th>Key</th>
            <th>Transcriptions</th>
            <th>Translations</th>
            <th>Contains</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gloss in glosses" :key="gloss.key">
            <td>{{ gloss.key }}</td>
            <td>{{ gloss.transcriptions.join(', ') }}</td>
            <td>{{ gloss.translations.join(', ') }}</td>
            <td>{{ gloss.contains.join(', ') }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>
