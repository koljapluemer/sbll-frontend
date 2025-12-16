<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { pickRandom, shuffleArray } from '@/dumb/random'
import { buildGlossIndex } from '@/entities/gloss/repository'
import type { Gloss, GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import { usePracticeStore } from '@/entities/practice-tracking/practiceStore'
import { usePracticeState } from './state/usePracticeState'
import type { PracticeMode, SituationGoals, StatefulGloss, TaskContext, TaskType, LearningState } from './types'
import type { GlossRef } from '@/entities/gloss/types'
import { getTaskDefinition } from './tasks/registry'

const hasItems = <T>(items: T[]): items is [T, ...T[]] => items.length > 0
const pickRandomOrFirst = <T>(items: [T, ...T[]]): T => pickRandom(items) ?? items[0]

const getTaskTypesForMode = (mode: PracticeMode, state: LearningState): TaskType[] => {
  if (mode === 'procedural') {
    return state === 'VOCAB-TO-INTRODUCE'
      ? ['MemorizeFromNative', 'UnderstandNativeFromSentence']
      : ['FormSentence', 'RecallFromNative']
  } else {
    return state === 'VOCAB-TO-INTRODUCE'
      ? ['MemorizeFromTarget', 'UnderstandTargetFromSentence']
      : ['UnderstandSentenceAroundTargetGloss', 'RecallFromTarget']
  }
}

const getFinalTaskType = (mode: PracticeMode): TaskType => {
  return mode === 'procedural' ? 'ChallengeTryToExpress' : 'ChallengeTryToUnderstand'
}

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()
const practiceStore = usePracticeStore()

const goals = ref<SituationGoals | null>(null)
const selectedGoalRef = ref<GlossRef | null>(null)
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

const taskContext = computed<TaskContext>(() => ({
  nativeIso: languageStore.nativeIso,
  targetIso: languageStore.targetIso ?? ''
}))

const practiceState = ref<ReturnType<typeof usePracticeState> | null>(null)
const currentGloss = ref<StatefulGloss | null>(null)
const currentTaskType = ref<TaskType | null>(null)
const currentTaskData = ref<unknown>(null)
const stage = ref<'practice' | 'final'>('practice')

const activeComponent = computed(() => {
  if (!selectedMode.value) return null
  const type = stage.value === 'final' ? getFinalTaskType(selectedMode.value) : currentTaskType.value
  return type ? getTaskDefinition(type).component : null
})

const activeTaskKey = computed(() => stage.value === 'final'
  ? `final-${selectedGoalRef.value}`
  : currentGloss.value?.ref ?? 'loading')

const buildTaskForGloss = (gloss: StatefulGloss): boolean => {
  if (!selectedMode.value) return false

  const taskTypes = getTaskTypesForMode(selectedMode.value, gloss.state)
  const shuffled = shuffleArray(taskTypes)

  for (const taskType of shuffled) {
    const definition = getTaskDefinition(taskType)
    const possible = definition.isPossibleToMake(gloss.ref, glossIndex.value, taskContext.value)
    if (!possible) continue

    const taskData = definition.makeTask(gloss.ref, glossIndex.value, taskContext.value)
    if (!taskData) continue

    currentGloss.value = gloss
    currentTaskType.value = taskType
    currentTaskData.value = taskData
    return true
  }

  return false
}

function requestNextTask() {
  if (stage.value === 'final' || !practiceState.value || !selectedMode.value || !selectedGoalRef.value) return

  const nextGloss = practiceState.value.getDueGloss()
  if (!nextGloss) {
    stage.value = 'final'
    const finalType = getFinalTaskType(selectedMode.value)
    const finalDefinition = getTaskDefinition(finalType)
    const taskData = finalDefinition.makeTask(selectedGoalRef.value, glossIndex.value, taskContext.value)
    currentTaskData.value = taskData ?? { gloss: glossIndex.value[selectedGoalRef.value], translations: [] }
    return
  }

  const built = buildTaskForGloss(nextGloss)
  if (!built) {
    practiceState.value.setGlossInvalid(nextGloss.ref)
    requestNextTask()
  }
}

const handleTaskDone = (rememberedCorrectly?: boolean) => {
  if (stage.value === 'final') {
    // Record practice for the goal
    if (selectedGoalRef.value) {
      practiceStore.recordPractice(selectedGoalRef.value)
    }
    // Record practice for the situation itself
    if (situationId.value) {
      practiceStore.recordPractice(situationId.value)
    }

    router.push({ name: 'situations' })
    return
  }

  if (!currentGloss.value || !practiceState.value || !currentTaskType.value) {
    requestNextTask()
    return
  }

  practiceState.value.handleGlossCompletion(
    currentGloss.value.ref,
    currentTaskType.value,
    rememberedCorrectly
  )
  requestNextTask()
}

const chooseModeAndGoal = () => {
  if (!goals.value) return

  const proceduralGoals = goals.value['procedural-paraphrase-expression-goals'] ?? []
  const understandGoals = goals.value['understand-expression-goals'] ?? []

  const availableModes: PracticeMode[] = []
  if (proceduralGoals.length) availableModes.push('procedural')
  if (understandGoals.length) availableModes.push('understand')

  if (!availableModes.length) {
    router.push({ name: 'situations' })
    return
  }

  if (!hasItems(availableModes)) return

  const resolvedMode: PracticeMode = pickRandomOrFirst(availableModes)
  selectedMode.value = resolvedMode

  const goalPool = resolvedMode === 'procedural' ? proceduralGoals : understandGoals
  if (!hasItems(goalPool)) {
    router.push({ name: 'situations' })
    return
  }

  // Smart goal selection based on practice history
  let selectedFromPool: GlossRef

  if (goalPool.length === 1) {
    selectedFromPool = goalPool[0]
  } else {
    // Filter goals not practiced today
    const notPracticedToday = goalPool.filter(
      goalRef => !practiceStore.wasPracticedToday(goalRef)
    )

    if (hasItems(notPracticedToday)) {
      // Pick from unpracticed goals, avoiding the most recently practiced
      selectedFromPool = pickRandomOrFirst(notPracticedToday)
    } else {
      // All practiced today, pick any (could add most-recently-practiced avoidance here too)
      selectedFromPool = pickRandomOrFirst(goalPool)
    }
  }

  selectedGoalRef.value = selectedFromPool
  practiceState.value = usePracticeState(
    selectedGoalRef.value,
    resolvedMode,
    glossIndex.value
  )
  stage.value = 'practice'
  requestNextTask()
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
    router.push({ name: 'situations' })
  } finally {
    isLoading.value = false
  }
}

watch([() => route.params.situationId, () => languageStore.targetIso], loadData, { immediate: true })
</script>

<template>
  <div class="w-full">
    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="!selectedGoalRef || !selectedMode"
      class="alert alert-warning"
    >
      Unable to start practice for this situation.
    </div>

    <div
      v-else
      class="w-full flex justify-center"
    >
      <component
        :is="activeComponent"
        v-if="activeComponent && currentTaskData !== null"
        :key="activeTaskKey"
        :task="currentTaskData"
        @task-done="handleTaskDone"
      />

      <div
        v-else
        class="flex justify-center py-6"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>
    </div>
  </div>
</template>
