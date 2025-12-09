import type { GlossRef } from '@/entities/gloss/types'

export type PracticeGoal = {
  finalChallenge: GlossRef
  needToBeLearned: GlossRef[]
}

export type SituationGoals = {
  'procedural-paraphrase-expression-goals'?: PracticeGoal[]
  'understand-expression-goals'?: PracticeGoal[]
}

export type PracticeMode = 'procedural' | 'understand'

export type StatefulGloss = {
  ref: GlossRef
  state: 'novel' | 'practicing'
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
