<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { useLanguageStore } from '@/entities/language'
import FinalChallengeTryToExpress from './tasks/native-to-target/FinalChallengeTryToExpress.vue'

type ProceduralGoal = {
  finalChallenge: string
}

type GlossEntry = {
  ref?: string
  content: string
  language?: string
  translations?: string[]
}

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()

const nativeGlossChallenge = ref<GlossEntry | null>(null)
const translationExamples = ref<GlossEntry[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationId = computed(() => String(route.params.situationId ?? ''))

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
  nativeGlossChallenge.value = null
  translationExamples.value = []

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

    const glosses = await parseJsonl<GlossEntry>(`${dataBasePath.value}.jsonl`)
    const challengeGloss = glosses.find(entry => entry.ref === randomGoal.finalChallenge)
    if (!challengeGloss) throw new Error('No gloss found for the selected challenge.')

    nativeGlossChallenge.value = challengeGloss

    const translationRefs = Array.isArray(challengeGloss.translations) ? challengeGloss.translations : []
    translationExamples.value = glosses.filter(entry => entry.ref && translationRefs.includes(entry.ref))
  } catch (err) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'Failed to load practice data.'
  } finally {
    isLoading.value = false
  }
}

const goToSituations = () => {
  router.push({ name: 'situations' })
}

onMounted(loadPracticeData)
watch([() => route.params.situationId, () => languageStore.targetIso], loadPracticeData)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error flex-col items-start gap-3">
      <span>{{ error }}</span>
      <div class="flex gap-2">
        <button class="btn btn-sm" @click="goToSituations">
          Back to situations
        </button>
        <button class="btn btn-sm btn-outline" @click="loadPracticeData">
          Retry
        </button>
      </div>
    </div>

    <FinalChallengeTryToExpress
      v-else-if="nativeGlossChallenge"
      :key="nativeGlossChallenge.ref ?? situationId"
      :native-gloss-challenge="nativeGlossChallenge"
      :translation-examples="translationExamples"
      :target-language="languageStore.targetIso ?? 'target language'"
    />
  </div>
</template>
