import { ref } from 'vue'
import { shuffleArray } from '@/dumb/random'
import type { GlossIndex, GlossRef } from '@/entities/gloss/types'
import { usePracticeStore } from '@/entities/practice-tracking/practiceStore'
import { usePracticeState } from '../situation-practice/state/usePracticeState'
import { getTaskDefinition } from '../situation-practice/tasks/registry'
import type { PracticeMode, StatefulGloss, TaskContext, TaskType, LearningState } from '../situation-practice/types'
import type { SimulatedTask } from './types'

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

const simulateTaskResult = (taskType: TaskType): boolean | undefined => {
  const selfAssessmentTasks: TaskType[] = [
    'RecallFromNative',
    'RecallFromTarget',
    'UnderstandNativeFromSentence',
    'UnderstandTargetFromSentence',
    'UnderstandSentenceAroundTargetGloss'
  ]

  if (selfAssessmentTasks.includes(taskType)) {
    return Math.random() > 0.5
  }

  return undefined
}

export const useDebugSimulation = (
  glossIndex: GlossIndex,
  taskContext: TaskContext,
  mode: PracticeMode,
  goalRef: GlossRef
) => {
  const simulatedTasks = ref<SimulatedTask[]>([])

  const buildTaskForGloss = (
    gloss: StatefulGloss,
    taskTypesList: TaskType[]
  ): { taskType: TaskType; taskData: unknown } | null => {
    const shuffled = shuffleArray(taskTypesList)

    for (const taskType of shuffled) {
      const definition = getTaskDefinition(taskType)
      const possible = definition.isPossibleToMake(gloss.ref, glossIndex, taskContext)
      if (!possible) continue

      const taskData = definition.makeTask(gloss.ref, glossIndex, taskContext)
      if (!taskData) continue

      return { taskType, taskData }
    }

    return null
  }

  const createFinalTask = (
    mode: PracticeMode,
    goalRef: GlossRef
  ): SimulatedTask | null => {
    const finalType = getFinalTaskType(mode)

    const definition = getTaskDefinition(finalType)
    const taskData = definition.makeTask(goalRef, glossIndex, taskContext)

    if (!taskData) return null

    return {
      id: `final-${goalRef}`,
      taskType: finalType,
      taskData,
      glossRef: null,
      simulatedResult: true,
      queueStateChange: 'practice complete',
      component: definition.component
    }
  }

  const runSimulation = () => {
    simulatedTasks.value = []

    const practiceStore = usePracticeStore()
    const practiceState = usePracticeState(goalRef, mode, glossIndex, practiceStore)

    let iteration = 0
    const maxIterations = 1000

    while (iteration < maxIterations) {
      const nextGloss = practiceState.getDueGloss()

      if (!nextGloss) {
        const finalTask = createFinalTask(mode, goalRef)
        if (finalTask) simulatedTasks.value.push(finalTask)
        break
      }

      const taskTypesList = getTaskTypesForMode(mode, nextGloss.state)
      const task = buildTaskForGloss(nextGloss, taskTypesList)

      if (!task) {
        practiceState.setGlossInvalid(nextGloss.ref)
        continue
      }

      const simulatedResult = simulateTaskResult(task.taskType)
      const stateBefore = nextGloss.state

      practiceState.handleGlossCompletion(nextGloss.ref, task.taskType, simulatedResult)

      const stateAfter = practiceState.stateMap.value.get(nextGloss.ref) ?? 'DONE'

      simulatedTasks.value.push({
        id: `${nextGloss.ref}-${iteration}`,
        taskType: task.taskType,
        taskData: task.taskData,
        glossRef: nextGloss.ref,
        simulatedResult,
        queueStateChange: `${stateBefore} → ${stateAfter}`,
        component: getTaskDefinition(task.taskType).component
      })

      iteration++
    }
  }

  const regenerate = () => {
    runSimulation()
  }

  return {
    simulatedTasks,
    mode,
    goalRef,
    runSimulation,
    regenerate
  }
}
