import type { GlossRef, GlossIndex } from '@/entities/gloss/types'
import type { GoalResolver, LearningState } from '../types'
import { recursivelyResolveParts } from './baseResolver'

/**
 * Resolver for procedural-paraphrase-expression goals
 *
 * Algorithm:
 * 1. Mark root goal as FINAL-CHALLENGE (never practiced, only for final challenge)
 * 2. Get parts of root goal gloss
 * 3. Recursively parse those parts
 * 4. **Additionally**: Check for `translations` of root goal
 * 5. For each translation: recursively resolve their `parts` too
 * 6. Apply base blocking logic to all parts
 *
 * Key difference from understand: Also resolves parts of root goal translations!
 */
export const createProceduralResolver = (): GoalResolver => {
  return {
    resolveTree(goalGlossRef: GlossRef, glossIndex: GlossIndex): Map<GlossRef, LearningState> {
      const stateMap = new Map<GlossRef, LearningState>()

      // Mark root goal as FINAL-CHALLENGE (never appears in practice pool)
      stateMap.set(goalGlossRef, 'FINAL-CHALLENGE')

      // Get root goal gloss
      const rootGloss = glossIndex[goalGlossRef]
      if (!rootGloss) {
        console.warn(`Root goal gloss not found: ${goalGlossRef}`)
        return stateMap
      }

      // Phase 1: Recursively process all parts of the root goal
      const parts = rootGloss.parts || []
      for (const partRef of parts) {
        recursivelyResolveParts(partRef, glossIndex, stateMap)
      }

      // Phase 2: Also process parts of root goal's translations
      const translations = rootGloss.translations || []
      for (const translationRef of translations) {
        const translationGloss = glossIndex[translationRef]
        if (!translationGloss) {
          continue
        }

        // Recursively process all parts of this translation
        const translationParts = translationGloss.parts || []
        for (const partRef of translationParts) {
          recursivelyResolveParts(partRef, glossIndex, stateMap)
        }
      }

      return stateMap
    }
  }
}
