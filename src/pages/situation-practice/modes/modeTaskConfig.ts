import type { PracticeMode, TaskType } from '../types'

export type ModeTaskConfig = {
  novelTaskTypes: TaskType[]
  practicingTaskTypes: TaskType[]
  finalTaskType: TaskType
}

export const modeTaskConfigs: Record<PracticeMode, ModeTaskConfig> = {
  procedural: {
    novelTaskTypes: ['MemorizeFromNative', 'UnderstandNativeFromSentence'],
    practicingTaskTypes: ['FormSentence', 'RecallFromNative'],
    finalTaskType: 'ChallengeTryToExpress'
  },
  understand: {
    novelTaskTypes: ['MemorizeFromTarget', 'UnderstandTargetFromSentence'],
    practicingTaskTypes: ['UnderstandSentenceAroundTargetGloss', 'RecallFromTarget'],
    finalTaskType: 'ChallengeTryToUnderstand'
  }
}

export const getTaskTypesForMode = (mode: PracticeMode): ModeTaskConfig => modeTaskConfigs[mode]
