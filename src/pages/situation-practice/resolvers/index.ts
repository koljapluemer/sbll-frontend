import type { PracticeMode, GoalResolver } from '../types'
import { createProceduralResolver } from './proceduralResolver'
import { createUnderstandResolver } from './understandResolver'

/**
 * Factory function to get the appropriate goal resolver based on practice mode
 */
export const getGoalResolver = (mode: PracticeMode): GoalResolver => {
  return mode === 'procedural'
    ? createProceduralResolver()
    : createUnderstandResolver()
}

// Re-export resolvers for direct access if needed
export { createProceduralResolver, createUnderstandResolver }
export * from './baseResolver'
