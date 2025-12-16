import type { GlossRef, GlossIndex } from '@/entities/gloss/types'
import type { LearningState } from '../types'

/**
 * Recursively resolve parts of a gloss and assign states.
 * - Gloss with no parts → VOCAB-TO-INTRODUCE
 * - Gloss with parts → VOCAB-BLOCKED (until parts are practiced)
 * - Uses cycle detection to avoid infinite loops
 */
export const recursivelyResolveParts = (
  glossRef: GlossRef,
  glossIndex: GlossIndex,
  stateMap: Map<GlossRef, LearningState>,
  visited = new Set<GlossRef>(),
  hasBeenPracticed?: (ref: GlossRef) => boolean
): void => {
  // Cycle detection
  if (visited.has(glossRef)) {
    return
  }
  visited.add(glossRef)

  // Skip if already processed
  if (stateMap.has(glossRef)) {
    return
  }

  const gloss = glossIndex[glossRef]
  if (!gloss) {
    // Missing gloss - skip gracefully
    return
  }

  const parts = gloss.parts || []

  // Check if gloss has been practiced before - skip blocking if so
  if (hasBeenPracticed && hasBeenPracticed(glossRef)) {
    stateMap.set(glossRef, 'VOCAB-TO-PRACTICE')

    // Still process parts recursively (they might not be practiced)
    for (const partRef of parts) {
      recursivelyResolveParts(partRef, glossIndex, stateMap, visited, hasBeenPracticed)
    }
  } else if (parts.length === 0) {
    // No parts - ready to introduce
    stateMap.set(glossRef, 'VOCAB-TO-INTRODUCE')
  } else {
    // Has parts - blocked until parts are learned
    stateMap.set(glossRef, 'VOCAB-BLOCKED')

    // Recursively process all parts
    for (const partRef of parts) {
      recursivelyResolveParts(partRef, glossIndex, stateMap, visited, hasBeenPracticed)
    }
  }
}

/**
 * Check if a gloss has blocking parts (parts that are not yet ready for practice)
 */
export const hasBlockingParts = (
  glossRef: GlossRef,
  glossIndex: GlossIndex,
  stateMap: Map<GlossRef, LearningState>
): boolean => {
  const gloss = glossIndex[glossRef]
  if (!gloss || !gloss.parts || gloss.parts.length === 0) {
    return false
  }

  for (const partRef of gloss.parts) {
    const partState = stateMap.get(partRef)

    // A part blocks if it's:
    // - Not in state map (unknown)
    // - VOCAB-BLOCKED (still waiting)
    // - VOCAB-TO-INTRODUCE (not yet practiced)
    if (
      !partState ||
      partState === 'VOCAB-BLOCKED' ||
      partState === 'VOCAB-TO-INTRODUCE'
    ) {
      return true
    }
  }

  return false
}

/**
 * Check if a blocked gloss can be unblocked (all parts are VOCAB-TO-PRACTICE or DONE)
 */
export const canUnblock = (
  glossRef: GlossRef,
  glossIndex: GlossIndex,
  stateMap: Map<GlossRef, LearningState>
): boolean => {
  const currentState = stateMap.get(glossRef)

  // Only blocked glosses can be unblocked
  if (currentState !== 'VOCAB-BLOCKED') {
    return false
  }

  // Check if all parts are ready (no blocking parts)
  return !hasBlockingParts(glossRef, glossIndex, stateMap)
}
