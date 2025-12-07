<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import IndexCard from '@/dumb/index-card/IndexCard.vue'
import type { IndexCardElement } from '@/dumb/index-card/types'
import { Check, Eye, Flag, Timer, X } from 'lucide-vue-next'

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

const memorizeDurationMs = 5000
const memorizeRemainingMs = ref(memorizeDurationMs)
const memorizePhase = ref<'memorize' | 'recall'>('memorize')
const memorizeHasRevealed = ref(false)
let memorizeTimerId: ReturnType<typeof setInterval> | null = null

const practiceHasRevealed = ref(false)

const finalDurationMs = 5000
const finalRemainingMs = ref(finalDurationMs)
const finalShowReveal = ref(false)
const finalHasRevealed = ref(false)
let finalTimerId: ReturnType<typeof setInterval> | null = null

const situationId = computed(() => String(route.params.situationId ?? ''))
const targetLanguageLabel = computed(() => languageStore.targetIso ?? 'target language')

const dataBasePath = computed(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return null

  const encodedId = encodeURIComponent(situationId.value)
  return `/data/situations/${languageStore.nativeIso}/${targetIso}/${encodedId}`
})

const resolveGloss = (ref: GlossRef | null | undefined) => resolveGlossRef(ref, glossByRef.value)
const collectTranslations = (gloss: NormalizedGloss | null) => collectGlossTranslations(gloss, glossByRef.value)
const dedupe = (items: GlossRef[]) => dedupeGlossRefs(items)

const stopMemorizeTimer = () => {
  if (memorizeTimerId) {
    clearInterval(memorizeTimerId)
    memorizeTimerId = null
  }
}

const resetMemorizeState = () => {
  stopMemorizeTimer()
  memorizeRemainingMs.value = memorizeDurationMs
  memorizePhase.value = 'memorize'
  memorizeHasRevealed.value = false
}

const startMemorizeTimer = () => {
  resetMemorizeState()
  memorizeTimerId = setInterval(() => {
    memorizeRemainingMs.value = Math.max(0, memorizeRemainingMs.value - 100)
    if (memorizeRemainingMs.value <= 0) {
      memorizePhase.value = 'recall'
      stopMemorizeTimer()
    }
  }, 100)
}

const resetPracticeState = () => {
  practiceHasRevealed.value = false
}

const stopFinalCountdown = () => {
  if (finalTimerId) {
    clearInterval(finalTimerId)
    finalTimerId = null
  }
}

const resetFinalState = () => {
  stopFinalCountdown()
  finalRemainingMs.value = finalDurationMs
  finalShowReveal.value = false
  finalHasRevealed.value = false
}

const startFinalCountdown = () => {
  resetFinalState()
  finalTimerId = setInterval(() => {
    finalRemainingMs.value = Math.max(0, finalRemainingMs.value - 100)

    if (finalRemainingMs.value <= 0) {
      finalShowReveal.value = true
      stopFinalCountdown()
    }
  }, 100)
}

const memorizeCountdownLabel = computed(() => `${Math.ceil(memorizeRemainingMs.value / 1000)}s`)
const finalCountdownLabel = computed(() => `${Math.ceil(finalRemainingMs.value / 1000)}s`)

const translationsToElements = (translations: NormalizedGloss[]): IndexCardElement[] => {
  if (translations.length === 0) {
    return [{ type: 'NormalText', text: 'No translations available yet.' }]
  }

  return translations.flatMap((translation, index) => {
    const lines: IndexCardElement[] = []
    if (index > 0) {
      lines.push({ type: 'DivisionLine' })
    }

    lines.push({ type: 'NormalText', text: translation.content })

    if (translation.language) {
      lines.push({ type: 'SmallText', text: translation.language })
    }

    return lines
  })
}

const introduceInstruction = computed(() =>
  memorizePhase.value === 'memorize'
    ? `Memorize how to express this in ${targetLanguageLabel.value}.`
    : 'Recall it, then grade yourself.'
)
const practiceInstruction = computed(
  () => `Say it in ${targetLanguageLabel.value}, then check the translations.`
)
const finalInstruction = computed(() => `Final challenge: express it in ${targetLanguageLabel.value}.`)

const introduceElements = computed<IndexCardElement[]>(() => {
  const gloss = resolveGloss(currentGlossRef.value)
  if (!gloss) return []

  const items: IndexCardElement[] = [
    {
      type: 'SmallText',
      text: memorizePhase.value === 'memorize'
        ? `Memorize · ${memorizeCountdownLabel.value} left`
        : 'Recall without peeking'
    },
    { type: 'LargeText', text: gloss.content }
  ]

  if (gloss.language) {
    items.push({ type: 'SmallText', text: gloss.language })
  }

  items.push({ type: 'DivisionLine' })

  if (memorizePhase.value === 'memorize' || memorizeHasRevealed.value) {
    items.push(...translationsToElements(currentTranslationExamples.value))
  } else {
    items.push({ type: 'NormalText', text: 'Reveal to check the translations.' })
  }

  return items
})

const practiceElements = computed<IndexCardElement[]>(() => {
  const gloss = resolveGloss(currentGlossRef.value)
  if (!gloss) return []

  const items: IndexCardElement[] = [
    { type: 'SmallText', text: `Translate into ${targetLanguageLabel.value}` },
    { type: 'LargeText', text: gloss.content }
  ]

  if (gloss.language) {
    items.push({ type: 'SmallText', text: gloss.language })
  }

  items.push({ type: 'DivisionLine' })

  if (practiceHasRevealed.value) {
    items.push(...translationsToElements(currentTranslationExamples.value))
  } else {
    items.push({ type: 'NormalText', text: 'Try it first, then reveal.' })
  }

  return items
})

const finalChallengeElements = computed<IndexCardElement[]>(() => {
  const gloss = finalChallengeGloss.value
  if (!gloss) return []

  const items: IndexCardElement[] = [
    { type: 'SmallText', text: 'Final challenge' },
    { type: 'LargeText', text: gloss.content },
    { type: 'DivisionLine' }
  ]

  if (finalHasRevealed.value) {
    items.push(...translationsToElements(finalTranslationExamples.value))
  } else if (finalShowReveal.value) {
    items.push({ type: 'NormalText', text: 'Ready to reveal the translations.' })
  } else {
    items.push({ type: 'NormalText', text: `Take ${finalCountdownLabel.value} to think.` })
  }

  return items
})

const resetState = () => {
  resetMemorizeState()
  resetPracticeState()
  resetFinalState()
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

const revealMemorizeTranslations = () => {
  memorizeHasRevealed.value = true
}

const revealPracticeTranslations = () => {
  practiceHasRevealed.value = true
}

const revealFinalTranslations = () => {
  finalHasRevealed.value = true
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

const currentGloss = computed(() => resolveGloss(currentGlossRef.value))

watch([() => route.params.situationId, () => languageStore.targetIso], loadPracticeData)

watch(
  () => [currentMode.value, currentGlossRef.value, finalChallengeGloss.value?.ref ?? null],
  () => {
    if (currentMode.value === 'introduce' && currentGloss.value) {
      startMemorizeTimer()
    } else {
      resetMemorizeState()
    }

    if (currentMode.value === 'practice') {
      resetPracticeState()
    } else {
      practiceHasRevealed.value = false
    }

    if (currentMode.value === 'final' && finalChallengeGloss.value) {
      startFinalCountdown()
    } else {
      resetFinalState()
    }
  },
  { immediate: true }
)

onMounted(loadPracticeData)
onBeforeUnmount(() => {
  stopMemorizeTimer()
  stopFinalCountdown()
})
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

    <div v-else class="flex flex-col gap-6">
      <div v-if="currentMode === 'introduce' && currentGloss" class="flex flex-col gap-3">
        <p class="text-lg font-semibold">
          {{ introduceInstruction }}
        </p>
        <IndexCard :elements="introduceElements" />
        <div class="flex justify-end gap-2">
          <button
            v-if="memorizePhase === 'memorize'"
            class="btn btn-square"
            disabled
            :aria-label="`Memorizing, ${memorizeCountdownLabel} left`"
          >
            <Timer class="h-5 w-5" />
          </button>
          <button
            v-else-if="!memorizeHasRevealed"
            class="btn btn-square btn-primary"
            aria-label="Reveal translations"
            @click="revealMemorizeTranslations"
          >
            <Eye class="h-5 w-5" />
          </button>
          <template v-else>
            <button
              class="btn btn-square btn-outline"
              aria-label="Could not recall"
              @click="handleIntroduceDone"
            >
              <X class="h-5 w-5" />
            </button>
            <button
              class="btn btn-square btn-primary"
              aria-label="Recalled correctly"
              @click="handleIntroduceDone"
            >
              <Check class="h-5 w-5" />
            </button>
          </template>
        </div>
      </div>

      <div v-else-if="currentMode === 'practice' && currentGloss" class="flex flex-col gap-3">
        <p class="text-lg font-semibold">
          {{ practiceInstruction }}
        </p>
        <IndexCard :elements="practiceElements" />
        <div class="flex justify-end gap-2">
          <button
            v-if="!practiceHasRevealed"
            class="btn btn-square btn-primary"
            aria-label="Reveal translations"
            @click="revealPracticeTranslations"
          >
            <Eye class="h-5 w-5" />
          </button>
          <template v-else>
            <button
              class="btn btn-square btn-outline"
              aria-label="Not remembered"
              @click="handlePracticeDone(false)"
            >
              <X class="h-5 w-5" />
            </button>
            <button
              class="btn btn-square btn-primary"
              aria-label="Remembered correctly"
              @click="handlePracticeDone(true)"
            >
              <Check class="h-5 w-5" />
            </button>
          </template>
        </div>
      </div>

      <div v-else-if="currentMode === 'final' && finalChallengeGloss" class="flex flex-col gap-3">
        <p class="text-lg font-semibold">
          {{ finalInstruction }}
        </p>
        <IndexCard :elements="finalChallengeElements" />
        <div class="flex justify-end gap-2">
          <button
            v-if="!finalShowReveal && !finalHasRevealed"
            class="btn btn-square"
            disabled
            :aria-label="`Thinking time, ${finalCountdownLabel} left`"
          >
            <Timer class="h-5 w-5" />
          </button>
          <button
            v-else-if="finalShowReveal && !finalHasRevealed"
            class="btn btn-square btn-primary"
            aria-label="Reveal translations"
            @click="revealFinalTranslations"
          >
            <Eye class="h-5 w-5" />
          </button>
          <template v-else>
            <button
              class="btn btn-square btn-primary"
              aria-label="Finish challenge"
              @click="goToSituations"
            >
              <Flag class="h-5 w-5" />
            </button>
          </template>
        </div>
      </div>

      <div v-else class="alert alert-info">
        No more glosses to practice.
      </div>
    </div>
  </div>
</template>
