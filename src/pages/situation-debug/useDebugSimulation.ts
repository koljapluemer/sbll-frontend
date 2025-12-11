import { ref } from 'vue'
import { pickRandom, shuffleArray } from '@/dumb/random'
import type { GlossIndex } from '@/entities/gloss/types'
import { useQueue } from '../situation-practice/utils/useQueue'
import { getTaskDefinition } from '../situation-practice/tasks/registry'
import { getTaskTypesForMode } from '../situation-practice/modes/modeTaskConfig'
import type { PracticeGoal, PracticeMode, SituationGoals, StatefulGloss, TaskContext, TaskType } from '../situation-practice/types'
import type { SimulatedTask } from './types'

const hasItems = <T>(items: T[]): items is [T, ...T[]] => items.length > 0
const pickRandomOrFirst = <T>(items: [T, ...T[]]): T => pickRandom(items) ?? items[0]

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
  goals: SituationGoals,
  glossIndex: GlossIndex,
  taskContext: TaskContext
) => {
  const simulatedTasks = ref<SimulatedTask[]>([])
  const selectedMode = ref<PracticeMode | null>(null)
  const selectedGoal = ref<PracticeGoal | null>(null)

  const chooseModeAndGoal = () => {
    const proceduralGoals = goals['procedural-paraphrase-expression-goals'] ?? []
    const understandGoals = goals['understand-expression-goals'] ?? []

    const availableModes: PracticeMode[] = []
    if (proceduralGoals.length) availableModes.push('procedural')
    if (understandGoals.length) availableModes.push('understand')

    if (!availableModes.length) return

    if (!hasItems(availableModes)) return

    const resolvedMode: PracticeMode = pickRandomOrFirst(availableModes)
    selectedMode.value = resolvedMode

    const goalPool = resolvedMode === 'procedural' ? proceduralGoals : understandGoals
    if (!hasItems(goalPool)) return

    selectedGoal.value = pickRandomOrFirst(goalPool)
  }

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
    chooseModeAndGoal()

    if (!selectedGoal.value || !selectedMode.value) return

    const queue = useQueue(selectedGoal.value.needToBeLearned ?? [], glossIndex)
    const config = getTaskTypesForMode(selectedMode.value)

    let iteration = 0
    const maxIterations = 1000

    while (iteration < maxIterations) {
      const nextGloss = queue.getDueGloss()

      if (!nextGloss) {
        const finalTask = createFinalTask(selectedMode.value, selectedGoal.value)
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
    selectedMode,
    selectedGoal,
    runSimulation,
    regenerate
  }
}
