<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { pickRandom } from '@/dumb/random'
import { buildGlossIndex } from '@/entities/gloss/repository'
import type { Gloss, GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import { useToastStore } from '@/features/toast/toastStore'
import PracticeProceduralParaphraseExpression from './modes/PracticeProceduralParaphraseExpression.vue'
import PracticeUnderstandExpression from './modes/PracticeUnderstandExpression.vue'
import type { PracticeGoal, PracticeMode, SituationGoals } from './types'

const hasItems = <T>(items: T[]): items is [T, ...T[]] => items.length > 0
const pickRandomOrFirst = <T>(items: [T, ...T[]]): T => pickRandom(items) ?? items[0]

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()
const toastStore = useToastStore()

const goals = ref<SituationGoals | null>(null)
const selectedGoal = ref<PracticeGoal | null>(null)
const selectedMode = ref<PracticeMode | null>(null)
const glossIndex = ref<GlossIndex>({})
const isLoading = ref(true)

const situationId = computed(() => String(route.params.situationId ?? ''))

const dataBasePath = computed(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return null
  const encodedId = encodeURIComponent(situationId.value)
  return `/data/situations/${languageStore.nativeIso}/${targetIso}/${encodedId}`
})

const handleCompleted = () => {
  toastStore.addToast('Practice complete. Nice work!', 'success')
  router.push({ name: 'situations' })
}

const chooseModeAndGoal = () => {
  if (!goals.value) return

  const proceduralGoals = goals.value['procedural-paraphrase-expression-goals'] ?? []
  const understandGoals = goals.value['understand-expression-goals'] ?? []

  const availableModes: PracticeMode[] = []
  if (proceduralGoals.length) availableModes.push('procedural')
  if (understandGoals.length) availableModes.push('understand')

  if (!availableModes.length) {
    toastStore.addToast('No practice goals found for this situation.', 'warning')
    router.push({ name: 'situations' })
    return
  }

  if (!hasItems(availableModes)) return

  const resolvedMode: PracticeMode = pickRandomOrFirst(availableModes)
  selectedMode.value = resolvedMode

  const goalPool = resolvedMode === 'procedural' ? proceduralGoals : understandGoals
  if (!hasItems(goalPool)) {
    toastStore.addToast('No practice goals found for this mode.', 'warning')
    router.push({ name: 'situations' })
    return
  }

  selectedGoal.value = pickRandomOrFirst(goalPool)
}

const loadData = async () => {
  if (!dataBasePath.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const [goalResponse, glosses] = await Promise.all([
      fetch(`${dataBasePath.value}.json`).then(res => res.json() as Promise<SituationGoals>),
      parseJsonl<Gloss>(`${dataBasePath.value}.jsonl`)
    ])

    goals.value = goalResponse
    glossIndex.value = buildGlossIndex(glosses)
    chooseModeAndGoal()
  } catch (error) {
    console.error('Failed to load practice data:', error)
    toastStore.addToast('Could not load practice data.', 'error')
    router.push({ name: 'situations' })
  } finally {
    isLoading.value = false
  }
}

watch([() => route.params.situationId, () => languageStore.targetIso], loadData, { immediate: true })
</script>

<template>
  <div class="w-full">
    <h1 class="text-3xl font-bold mb-4">
      Practice
    </h1>

    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="!selectedGoal || !selectedMode"
      class="alert alert-warning"
    >
      Unable to start practice for this situation.
    </div>

    <PracticeProceduralParaphraseExpression
      v-else-if="selectedMode === 'procedural'"
      :goal="selectedGoal"
      :gloss-index="glossIndex"
      @completed="handleCompleted"
    />

    <PracticeUnderstandExpression
      v-else-if="selectedMode === 'understand'"
      :goal="selectedGoal"
      :gloss-index="glossIndex"
      @completed="handleCompleted"
    />
  </div>
</template>
