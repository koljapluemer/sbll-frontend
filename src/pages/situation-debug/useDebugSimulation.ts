import { ref } from 'vue'
import { shuffleArray } from '@/dumb/random'
import type { GlossIndex } from '@/entities/gloss/types'
import { useQueue } from '../situation-practice/utils/useQueue'
import { getTaskDefinition } from '../situation-practice/tasks/registry'
import { getTaskTypesForMode } from '../situation-practice/modes/modeTaskConfig'
import type { PracticeGoal, PracticeMode, StatefulGloss, TaskContext, TaskType } from '../situation-practice/types'
import type { SimulatedTask } from './types'

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
  goal: PracticeGoal
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
    goal: PracticeGoal
  ): SimulatedTask | null => {
    const config = getTaskTypesForMode(mode)
    const finalType = config.finalTaskType

    const definition = getTaskDefinition(finalType)
    const taskData = definition.makeTask(goal.finalChallenge, glossIndex, taskContext)

    if (!taskData) return null

    return {
      id: `final-${goal.finalChallenge}`,
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

    const queue = useQueue(goal.needToBeLearned ?? [], glossIndex)
    const config = getTaskTypesForMode(mode)

    let iteration = 0
    const maxIterations = 1000

    while (iteration < maxIterations) {
      const nextGloss = queue.getDueGloss()

      if (!nextGloss) {
        const finalTask = createFinalTask(mode, goal)
        if (finalTask) simulatedTasks.value.push(finalTask)
        break
      }

      const taskTypesList = nextGloss.state === 'novel' ? config.novelTaskTypes : config.practicingTaskTypes
      const task = buildTaskForGloss(nextGloss, taskTypesList)

      if (!task) {
        queue.setGlossInvalid(nextGloss.ref)
        continue
      }

      const simulatedResult = simulateTaskResult(task.taskType)
      const stateBefore = nextGloss.state

      queue.handleGlossScore(nextGloss.ref, simulatedResult)

      const stateAfter = queue.stateMap.value[nextGloss.ref] ?? 'done'

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
    goal,
    runSimulation,
    regenerate
  }
}
