<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { shuffleArray } from '@/dumb/random'
import type { GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import { useQueue } from '../utils/useQueue'
import type { PracticeGoal, StatefulGloss, TaskContext, TaskType } from '../types'
import { getTaskDefinition } from '../tasks/registry'
import { getTaskTypesForMode } from './modeTaskConfig'

const props = defineProps<{
  goal: PracticeGoal
  glossIndex: GlossIndex
}>()

const emit = defineEmits<{
  (e: 'completed'): void
}>()

const languageStore = useLanguageStore()

const taskContext = computed<TaskContext>(() => ({
  nativeIso: languageStore.nativeIso,
  targetIso: languageStore.targetIso ?? ''
}))

const config = getTaskTypesForMode('understand')
const novelTaskTypes = config.novelTaskTypes
const practicingTaskTypes = config.practicingTaskTypes
const finalTaskType = config.finalTaskType

const queue = ref(useQueue(props.goal.needToBeLearned ?? [], props.glossIndex))
const currentGloss = ref<StatefulGloss | null>(null)
const currentTaskType = ref<TaskType | null>(null)
const currentTaskData = ref<unknown>(null)
const stage = ref<'practice' | 'final'>('practice')

const activeComponent = computed(() => {
  const type = stage.value === 'final' ? finalTaskType : currentTaskType.value
  return type ? getTaskDefinition(type).component : null
})

const activeTaskKey = computed(() => stage.value === 'final'
  ? `final-${props.goal.finalChallenge}`
  : currentGloss.value?.ref ?? 'loading')

const buildTaskForGloss = (gloss: StatefulGloss): boolean => {
  const taskTypes = gloss.state === 'novel' ? novelTaskTypes : practicingTaskTypes
  const shuffled = shuffleArray(taskTypes)

  for (const taskType of shuffled) {
    const definition = getTaskDefinition(taskType)
    const possible = definition.isPossibleToMake(gloss.ref, props.glossIndex, taskContext.value)
    if (!possible) continue

    const taskData = definition.makeTask(gloss.ref, props.glossIndex, taskContext.value)
    if (!taskData) continue

    currentGloss.value = gloss
    currentTaskType.value = taskType
    currentTaskData.value = taskData
    return true
  }

  return false
}

function requestNextTask() {
  if (stage.value === 'final') return

  const nextGloss = queue.value.getDueGloss()
  if (!nextGloss) {
    stage.value = 'final'
    const finalDefinition = getTaskDefinition(finalTaskType)
    const taskData = finalDefinition.makeTask(props.goal.finalChallenge, props.glossIndex, taskContext.value)
    currentTaskData.value = taskData ?? { gloss: props.glossIndex[props.goal.finalChallenge], translations: [] }
    return
  }

  const built = buildTaskForGloss(nextGloss)
  if (!built) {
    queue.value.setGlossInvalid(nextGloss.ref)
    requestNextTask()
  }
}

const resetState = () => {
  queue.value = useQueue(props.goal.needToBeLearned ?? [], props.glossIndex)
  currentGloss.value = null
  currentTaskType.value = null
  currentTaskData.value = null
  stage.value = 'practice'
  requestNextTask()
}

watch(() => props.goal, resetState, { immediate: true })

const handleTaskDone = (rememberedCorrectly?: boolean) => {
  if (stage.value === 'final') {
    emit('completed')
    return
  }

  if (!currentGloss.value) {
    requestNextTask()
    return
  }

  queue.value.handleGlossScore(currentGloss.value.ref, rememberedCorrectly)
  requestNextTask()
}
</script>

<template>
  <div class="w-full flex justify-center">
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
</template>
