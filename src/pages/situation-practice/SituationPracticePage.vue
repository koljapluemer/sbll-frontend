<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { useLanguageStore } from '@/entities/language'

type ProceduralGoal = {
  finalChallenge: string
  needToBeLearned?: string[]
  references?: string[]
}

type GlossEntry = {
  ref: string
  content: string
  language: string
  translations?: string[]
  parts?: string[]
  tags?: string[]
  notes?: string[]
}

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()

const selectedGoal = ref<ProceduralGoal | null>(null)
const selectedGloss = ref<GlossEntry | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationId = computed(() => String(route.params.situationId ?? ''))
const finalChallengeKey = computed(() => selectedGoal.value?.finalChallenge ?? '')
const challengeDisplay = computed(() => finalChallengeKey.value.replace(/^[^:]+:/, '').trim())

const dataBasePath = computed(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return null

  const encodedId = encodeURIComponent(situationId.value)
  return `/data/situations/${languageStore.nativeIso}/${targetIso}/${encodedId}`
})

const loadPracticeData = async () => {
  if (!dataBasePath.value) {
    error.value = 'Please pick a target language to start practicing.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  selectedGoal.value = null
  selectedGloss.value = null

  try {
    const situationResponse = await fetch(`${dataBasePath.value}.json`)
    if (!situationResponse.ok) throw new Error('Unable to load situation data.')

    const situationData = await situationResponse.json()
    const goalsRaw = situationData['procedural-paraphrase-expression-goals']
    const goals: ProceduralGoal[] = Array.isArray(goalsRaw) ? goalsRaw : []

    if (goals.length === 0) {
      throw new Error('No procedural expression goals found for this situation.')
    }

    const randomGoal = goals[Math.floor(Math.random() * goals.length)]
    if (!randomGoal) throw new Error('Unable to pick a practice goal.')
    selectedGoal.value = randomGoal

    const glosses = await parseJsonl<GlossEntry>(`${dataBasePath.value}.jsonl`)
    selectedGloss.value = glosses.find(entry => entry.ref === randomGoal.finalChallenge) ?? null
  } catch (err) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'Failed to load practice data.'
  } finally {
    isLoading.value = false
  }
}

const finishPractice = () => {
  router.push({ name: 'situations' })
}

onMounted(loadPracticeData)
watch([() => route.params.situationId, () => languageStore.targetIso], loadPracticeData)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">
        Practice: {{ situationId }}
      </h1>

      <button class="btn btn-secondary" @click="finishPractice">
        Done
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error flex-col items-start gap-3">
      <span>{{ error }}</span>
      <div class="flex gap-2">
        <button class="btn btn-sm" @click="finishPractice">
          Back to situations
        </button>
        <button class="btn btn-sm btn-outline" @click="loadPracticeData">
          Retry
        </button>
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="card shadow border p-4">
        <div class="text-sm uppercase text-gray-500">Selected goal</div>
        <div class="text-2xl font-semibold mt-1">
          {{ challengeDisplay }}
        </div>
        <div class="text-sm text-gray-500 mt-1">
          Key: <code>{{ finalChallengeKey }}</code>
        </div>

        <div v-if="selectedGoal?.needToBeLearned?.length" class="mt-3">
          <div class="text-sm font-semibold mb-1">
            Pieces to learn
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="item in selectedGoal.needToBeLearned"
              :key="item"
              class="badge badge-outline"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <div class="card shadow border p-4">
        <div class="text-sm uppercase text-gray-500 mb-1">Gloss</div>

        <div v-if="selectedGloss">
          <div class="flex items-start justify-between gap-4">
            <div class="text-xl font-semibold">{{ selectedGloss.content }}</div>
            <span class="badge badge-neutral">{{ selectedGloss.language }}</span>
          </div>

          <div v-if="selectedGloss.translations?.length" class="mt-2">
            <div class="text-sm font-semibold">Translations</div>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="translation in selectedGloss.translations"
                :key="translation"
                class="badge badge-outline"
              >
                {{ translation }}
              </span>
            </div>
          </div>

          <div v-if="selectedGloss.parts?.length" class="mt-2">
            <div class="text-sm font-semibold">Parts</div>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="part in selectedGloss.parts"
                :key="part"
                class="badge badge-ghost"
              >
                {{ part }}
              </span>
            </div>
          </div>

          <div v-if="selectedGloss.tags?.length" class="mt-2">
            <div class="text-sm font-semibold">Tags</div>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="tag in selectedGloss.tags"
                :key="tag"
                class="badge badge-secondary badge-outline"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div v-if="selectedGloss.notes?.length" class="mt-2">
            <div class="text-sm font-semibold">Notes</div>
            <ul class="list-disc list-inside text-sm text-gray-700">
              <li v-for="note in selectedGloss.notes" :key="note">
                {{ note }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else class="text-gray-500">
          No gloss found for <code>{{ finalChallengeKey }}</code> in this situation.
        </div>
      </div>
    </div>
  </div>
</template>
