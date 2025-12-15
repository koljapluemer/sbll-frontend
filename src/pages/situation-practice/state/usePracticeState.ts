import { ref, type Ref } from 'vue'
import type { GlossRef, GlossIndex } from '@/entities/gloss/types'
import type { PracticeMode, TaskType, LearningState, StatefulGloss } from '../types'
import { getGoalResolver, canUnblock } from '../resolvers'

// Task types that move VOCAB-TO-INTRODUCE → VOCAB-TO-PRACTICE
const INTRO_TASKS: TaskType[] = [
  'MemorizeFromNative',
  'UnderstandNativeFromSentence',
  'MemorizeFromTarget',
  'UnderstandTargetFromSentence'
]

// Task types that can move VOCAB-TO-PRACTICE → DONE (when correct)
const COMPLETION_TASKS: TaskType[] = [
  'RecallFromNative',
  'RecallFromTarget'
]

/**
 * New state manager for situation practice mode using 6-state model
 *
 * Replaces useQueue.ts with goal-aware tree resolution
 */
export const usePracticeState = (
  goalRef: GlossRef,
  goalMode: PracticeMode,
  glossIndex: GlossIndex
) => {
  // Initialize state map using appropriate resolver
  const resolver = getGoalResolver(goalMode)
  const stateMap = ref<Map<GlossRef, LearningState>>(
    resolver.resolveTree(goalRef, glossIndex)
  )

  // Track last gloss to prevent consecutive repeats
  const lastGlossRef = ref<GlossRef | null>(null)

  /**
   * Get next gloss to practice from combined pool of VOCAB-TO-PRACTICE + VOCAB-TO-INTRODUCE
   * Excludes FINAL-CHALLENGE glosses (those are only for final challenge stage)
   * Avoids repeating the last gloss
   */
  const getDueGloss = (): StatefulGloss | undefined => {
    // Build pool of practice-able glosses
    const pool: GlossRef[] = []

    for (const [ref, state] of stateMap.value) {
      if (state === 'VOCAB-TO-INTRODUCE' || state === 'VOCAB-TO-PRACTICE') {
        // Exclude last gloss to prevent consecutive repeats
        if (ref !== lastGlossRef.value) {
          pool.push(ref)
        }
      }
    }

    if (pool.length === 0) {
      // No glosses available - either all done or only last gloss left
      return undefined
    }

    // Pick random gloss from pool
    const randomIndex = Math.floor(Math.random() * pool.length)
    const selectedRef = pool[randomIndex]

    // TypeScript safety check (should never happen since we checked pool.length)
    if (!selectedRef) {
      return undefined
    }

    const selectedState = stateMap.value.get(selectedRef)

    // This should never be undefined since we just got it from the pool
    if (!selectedState) {
      return undefined
    }

    lastGlossRef.value = selectedRef

    return {
      ref: selectedRef,
      state: selectedState
    }
  }

  /**
   * Unblock glosses whose parts are now ready
   * Uses iterative approach to handle cascading unblocks
   */
  const unblockGlosses = (): void => {
    let changed = true

    while (changed) {
      changed = false

      for (const [ref, state] of stateMap.value) {
        if (state === 'VOCAB-BLOCKED' && canUnblock(ref, glossIndex, stateMap.value)) {
          stateMap.value.set(ref, 'VOCAB-TO-INTRODUCE')
          changed = true
        }
      }
    }
  }

  /**
   * Handle task completion and state transitions
   */
  const handleGlossCompletion = (
    glossRef: GlossRef,
    taskType: TaskType,
    rememberedCorrectly?: boolean
  ): void => {
    const currentState = stateMap.value.get(glossRef)
    if (!currentState) {
      return
    }

    // Intro tasks: VOCAB-TO-INTRODUCE → VOCAB-TO-PRACTICE (always)
    if (INTRO_TASKS.includes(taskType) && currentState === 'VOCAB-TO-INTRODUCE') {
      stateMap.value.set(glossRef, 'VOCAB-TO-PRACTICE')
      unblockGlosses()
      return
    }

    // Completion tasks: VOCAB-TO-PRACTICE → DONE (if correct)
    if (
      COMPLETION_TASKS.includes(taskType) &&
      rememberedCorrectly &&
      currentState === 'VOCAB-TO-PRACTICE'
    ) {
      stateMap.value.set(glossRef, 'DONE')
      unblockGlosses()
      return
    }

    // Other tasks don't change state (FormSentence, UnderstandSentenceAroundTargetGloss)
    // But still might want to unblock if something changed
    unblockGlosses()
  }

  /**
   * Mark a gloss as invalid (e.g., impossible to practice)
   * Moves it directly to DONE so it doesn't block others
   */
  const setGlossInvalid = (glossRef: GlossRef): void => {
    stateMap.value.set(glossRef, 'DONE')
    unblockGlosses()
  }

  /**
   * Get glosses marked as FINAL-CHALLENGE
   * These are only shown at the end (never in practice pool)
   */
  const getFinalChallenges = (): GlossRef[] => {
    const challenges: GlossRef[] = []

    for (const [ref, state] of stateMap.value) {
      if (state === 'FINAL-CHALLENGE') {
        challenges.push(ref)
      }
    }

    return challenges
  }

  return {
    getDueGloss,
    handleGlossCompletion,
    setGlossInvalid,
    getFinalChallenges,
    stateMap: stateMap as Readonly<Ref<Map<GlossRef, LearningState>>>
  }
}
