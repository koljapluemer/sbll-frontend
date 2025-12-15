import type { GlossRef, GlossIndex } from '@/entities/gloss/types'

export type PracticeGoal = {
  finalChallenge: GlossRef
  needToBeLearned: GlossRef[]
}

export type SituationGoals = {
  'procedural-paraphrase-expression-goals'?: PracticeGoal[]
  'understand-expression-goals'?: PracticeGoal[]
}

export type PracticeMode = 'procedural' | 'understand'

export type LearningState =
  | 'VOCAB-BLOCKED'
  | 'VOCAB-TO-INTRODUCE'
  | 'VOCAB-TO-PRACTICE'
  | 'FINAL-CHALLENGE'
  | 'SENTENCE-TO-GUESS'
  | 'DONE'

export type StatefulGloss = {
  ref: GlossRef
  state: LearningState
}

export type GoalResolver = {
  resolveTree(
    goalGlossRef: GlossRef,
    glossIndex: GlossIndex
  ): Map<GlossRef, LearningState>
}

export type TaskType =
  | 'MemorizeFromNative'
  | 'MemorizeFromTarget'
  | 'RecallFromTarget'
  | 'RecallFromNative'
  | 'FormSentence'
  | 'UnderstandNativeFromSentence'
  | 'UnderstandTargetFromSentence'
  | 'UnderstandSentenceAroundTargetGloss'
  | 'ChallengeTryToExpress'
  | 'ChallengeTryToUnderstand'

export type TaskContext = {
  nativeIso: string
  targetIso: string
}
