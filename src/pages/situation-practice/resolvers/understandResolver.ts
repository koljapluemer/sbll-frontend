import type { GlossRef, GlossIndex } from '@/entities/gloss/types'
import type { GoalResolver, LearningState } from '../types'
import { recursivelyResolveParts } from './baseResolver'

/**
 * Resolver for understand-expression goals
 *
 * Algorithm:
 * 1. Mark root goal as FINAL-CHALLENGE (never practiced, only for final challenge)
 * 2. Get parts of root goal gloss
 * 3. Recursively parse those parts
 * 4. Apply base blocking logic to parts
 */
export const createUnderstandResolver = (): GoalResolver => {
  return {
    resolveTree(
      goalGlossRef: GlossRef,
      glossIndex: GlossIndex,
      hasBeenPracticed?: (ref: GlossRef) => boolean
    ): Map<GlossRef, LearningState> {
      const stateMap = new Map<GlossRef, LearningState>()

      // Mark root goal as FINAL-CHALLENGE (never appears in practice pool)
      stateMap.set(goalGlossRef, 'FINAL-CHALLENGE')

      // Get root goal gloss
      const rootGloss = glossIndex[goalGlossRef]
      if (!rootGloss) {
        console.warn(`Root goal gloss not found: ${goalGlossRef}`)
        return stateMap
      }

      // Recursively process all parts of the root goal
      const parts = rootGloss.parts || []
      for (const partRef of parts) {
        recursivelyResolveParts(partRef, glossIndex, stateMap, undefined, hasBeenPracticed)
      }

      return stateMap
    }
  }
}
