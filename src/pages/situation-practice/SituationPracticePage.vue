<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buildGlossIndex,
  collectGlossTranslations,
  dedupeGlossRefs,
  loadGlossList,
  resolveGlossRef
} from '@/entities/gloss/repository'
import type { GlossIndex, GlossRef, NormalizedGloss } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import FinalChallengeTryToExpress from './tasks/native-to-target/FinalChallengeTryToExpress.vue'
import MemorizeWithTimer from './tasks/native-to-target/MemorizeWithTimer.vue'
import NativeToTargetSR from './tasks/native-to-target/NativeToTargetSR.vue'

type ProceduralGoal = {
  finalChallenge: GlossRef
  needToBeLearned?: GlossRef[]
}

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()

const glossesToIntroduce = ref<GlossRef[]>([])
const glossesToPractice = ref<GlossRef[]>([])
const lastGlossRef = ref<GlossRef | null>(null)
const currentGlossRef = ref<GlossRef | null>(null)
const currentMode = ref<'introduce' | 'practice' | 'final' | null>(null)
const currentTranslationExamples = ref<NormalizedGloss[]>([])
const glossByRef = ref<GlossIndex>({})

const finalChallengeGloss = ref<NormalizedGloss | null>(null)
const finalTranslationExamples = ref<NormalizedGloss[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationId = computed(() => String(route.params.situationId ?? ''))

const dataBasePath = computed(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return null

  const encodedId = encodeURIComponent(situationId.value)
  return `/data/situations/${languageStore.nativeIso}/${targetIso}/${encodedId}`
})

const resetState = () => {
  glossesToIntroduce.value = []
  glossesToPractice.value = []
  lastGlossRef.value = null
  currentGlossRef.value = null
  currentMode.value = null
  currentTranslationExamples.value = []
  glossByRef.value = {}
  finalChallengeGloss.value = null
  finalTranslationExamples.value = []
}

const resolveGloss = (ref: GlossRef | null | undefined) => resolveGlossRef(ref, glossByRef.value)
const collectTranslations = (gloss: NormalizedGloss | null) => collectGlossTranslations(gloss, glossByRef.value)

const dedupe = (items: GlossRef[]) => dedupeGlossRefs(items)

const chooseNextTask = (): { mode: 'introduce' | 'practice'; ref: GlossRef } | null => {
  const introList = glossesToIntroduce.value
  const practiceList = glossesToPractice.value

  const pools: Array<{ mode: 'introduce' | 'practice'; list: GlossRef[] }> = []
  if (introList.length) pools.push({ mode: 'introduce', list: introList })
  if (practiceList.length) pools.push({ mode: 'practice', list: practiceList })

  if (pools.length === 0) return null

  const shuffledPools = pools.sort(() => Math.random() - 0.5)

  for (const pool of shuffledPools) {
    const available = pool.list.filter(ref => ref !== lastGlossRef.value)
    if (available.length === 0) continue

    const ref = available[Math.floor(Math.random() * available.length)]!
    return { mode: pool.mode, ref }
  }

  return null
}

const prepareNextTask = () => {
  if (glossesToIntroduce.value.length === 0 && glossesToPractice.value.length === 0) {
    currentMode.value = 'final'
    currentGlossRef.value = null
    currentTranslationExamples.value = []
    return
  }

  const nextTask = chooseNextTask()

  if (!nextTask) {
    currentMode.value = 'final'
    currentGlossRef.value = null
    currentTranslationExamples.value = []
    return
  }

  const gloss = resolveGloss(nextTask.ref)
  if (!gloss) {
    glossesToIntroduce.value = glossesToIntroduce.value.filter(ref => ref !== nextTask.ref)
    glossesToPractice.value = glossesToPractice.value.filter(ref => ref !== nextTask.ref)
    lastGlossRef.value = nextTask.ref
    prepareNextTask()
    return
  }

  currentMode.value = nextTask.mode
  currentGlossRef.value = nextTask.ref
  currentTranslationExamples.value = collectTranslations(gloss)
}

const handleIntroduceDone = () => {
  const ref = currentGlossRef.value
  if (!ref) return

  glossesToIntroduce.value = glossesToIntroduce.value.filter(item => item !== ref)
  if (!glossesToPractice.value.includes(ref)) {
    glossesToPractice.value = [...glossesToPractice.value, ref]
  }
  lastGlossRef.value = ref
  prepareNextTask()
}

const handlePracticeDone = (remembered: boolean) => {
  const ref = currentGlossRef.value
  if (!ref) return

  if (remembered) {
    glossesToPractice.value = glossesToPractice.value.filter(item => item !== ref)
  }

  lastGlossRef.value = ref
  prepareNextTask()
}

const loadPracticeData = async () => {
  if (!dataBasePath.value) {
    error.value = 'Please pick a target language to start practicing.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  resetState()

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

    const glosses = await loadGlossList(`${dataBasePath.value}.jsonl`)
    glossByRef.value = buildGlossIndex(glosses)

    const challengeGloss = resolveGloss(randomGoal.finalChallenge)
    if (!challengeGloss) throw new Error('No gloss found for the selected challenge.')

    finalChallengeGloss.value = challengeGloss
    finalTranslationExamples.value = collectTranslations(challengeGloss)

    const needs = Array.isArray(randomGoal.needToBeLearned) ? randomGoal.needToBeLearned : []
    glossesToIntroduce.value = dedupe(needs)
    glossesToPractice.value = []
    prepareNextTask()
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

const currentGloss = computed(() => resolveGloss(currentGlossRef.value))
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-3xl font-bold">Practice: {{ situationId }}</h1>

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

    <div v-else>
      <div v-if="currentMode === 'introduce' && currentGloss">
        <MemorizeWithTimer
          :key="currentGloss.ref ?? currentGloss.content"
          :native-gloss="currentGloss"
          :translation-examples="currentTranslationExamples"
          :target-language="languageStore.targetIso ?? 'target language'"
          @remembered="handleIntroduceDone"
          @not-remembered="handleIntroduceDone"
        />
      </div>

      <div v-else-if="currentMode === 'practice' && currentGloss">
        <NativeToTargetSR
          :key="currentGloss.ref ?? currentGloss.content"
          :native-gloss="currentGloss"
          :translation-examples="currentTranslationExamples"
          :target-language="languageStore.targetIso ?? 'target language'"
          @remembered="handlePracticeDone(true)"
          @not-remembered="handlePracticeDone(false)"
        />
      </div>

      <FinalChallengeTryToExpress
        v-else-if="currentMode === 'final' && finalChallengeGloss"
        :key="finalChallengeGloss.ref ?? situationId"
        :native-gloss-challenge="finalChallengeGloss"
        :translation-examples="finalTranslationExamples"
        :target-language="languageStore.targetIso ?? 'target language'"
      />

      <div v-else class="alert alert-info">
        No more glosses to practice.
      </div>
    </div>
  </div>
</template>
