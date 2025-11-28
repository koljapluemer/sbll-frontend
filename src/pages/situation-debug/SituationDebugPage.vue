<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { extractUnderstandingChallenges } from '@/features/extract-understanding-challenges/extract-understanding-challenges'
import { extractExpressionChallenges } from '@/features/extract-expression-challenges/extract-expression-challenges'
import { extractCollections } from '@/features/extract-collections/extract-collections'
import type { Gloss } from '@/dumb/types'

const route = useRoute()
const languageStore = useLanguageStore()
const glosses = ref<Gloss[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationId = computed(() => route.params.id as string)
const targetIso = computed(() => languageStore.targetIso ?? '')
const nativeIso = computed(() => languageStore.nativeIso)

const glossFilePath = computed(() => {
  return `/data/${situationId.value}_${targetIso.value}_${nativeIso.value}.jsonl`
})

const collections = computed(() =>
  extractCollections(glosses.value)
)

const challenges = computed(() =>
  extractUnderstandingChallenges(glosses.value, targetIso.value)
)

const expressionChallenges = computed(() =>
  extractExpressionChallenges(glosses.value, nativeIso.value)
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
      <h2 class="text-2xl font-bold mb-4">Collections</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div v-for="collection in collections" :key="collection.key" class="card shadow">
          <div class="card-body">
            <h3 class="card-title">{{ collection.content }}</h3>
            <div class="overflow-x-auto">
              <table class="table table-xs">
                <tbody>
                  <tr v-for="containedKey in collection.contains" :key="containedKey">
                    <td>{{ containedKey }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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

      <h2 class="text-2xl font-bold mb-4">Expression Challenges</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div v-for="challenge in expressionChallenges" :key="challenge.key" class="card shadow">
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
                    <td>{{ challenge.contains.join(', ') }}</td>
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
