import type { Component } from 'vue'
import type { GlossIndex, GlossRef } from '@/entities/gloss/types'
import type { TaskContext, TaskType } from '../types'
import MemorizeFromNativeTask from './MemorizeFromNative/Task.vue'
import { isPossibleToMake as memorizeFromNativePossible, makeTask as makeMemorizeFromNative } from './MemorizeFromNative/utils'
import MemorizeFromTargetTask from './MemorizeFromTarget/Task.vue'
import { isPossibleToMake as memorizeFromTargetPossible, makeTask as makeMemorizeFromTarget } from './MemorizeFromTarget/utils'
import RecallFromTargetTask from './RecallFromTarget/Task.vue'
import { isPossibleToMake as recallFromTargetPossible, makeTask as makeRecallFromTarget } from './RecallFromTarget/utils'
import RecallFromNativeTask from './RecallFromNative/Task.vue'
import { isPossibleToMake as recallFromNativePossible, makeTask as makeRecallFromNative } from './RecallFromNative/utils'
import FormSentenceTask from './FormSentence/Task.vue'
import { isPossibleToMake as formSentencePossible, makeTask as makeFormSentence } from './FormSentence/utils'
import UnderstandNativeFromSentenceTask from './UnderstandNativeFromSentence/Task.vue'
import {
  isPossibleToMake as understandNativeFromSentencePossible,
  makeTask as makeUnderstandNativeFromSentence
} from './UnderstandNativeFromSentence/utils'
import UnderstandTargetFromSentenceTask from './UnderstandTargetFromSentence/Task.vue'
import {
  isPossibleToMake as understandTargetFromSentencePossible,
  makeTask as makeUnderstandTargetFromSentence
} from './UnderstandTargetFromSentence/utils'
import UnderstandSentenceAroundTargetGlossTask from './UnderstandSentenceAroundTargetGloss/Task.vue'
import {
  isPossibleToMake as understandSentenceAroundTargetGlossPossible,
  makeTask as makeUnderstandSentenceAroundTargetGloss
} from './UnderstandSentenceAroundTargetGloss/utils'
import ChallengeTryToExpressTask from './ChallengeTryToExpress/Task.vue'
import { isPossibleToMake as challengeExpressPossible, makeTask as makeChallengeExpress } from './ChallengeTryToExpress/utils'
import ChallengeTryToUnderstandTask from './ChallengeTryToUnderstand/Task.vue'
import { isPossibleToMake as challengeUnderstandPossible, makeTask as makeChallengeUnderstand } from './ChallengeTryToUnderstand/utils'

export type TaskDefinition = {
  type: TaskType
  component: Component
  isPossibleToMake: (glossRef: GlossRef, repo: GlossIndex, context: TaskContext) => boolean
  makeTask: (glossRef: GlossRef, repo: GlossIndex, context: TaskContext) => unknown | undefined
}

export const taskRegistry: Record<TaskType, TaskDefinition> = {
  MemorizeFromNative: {
    type: 'MemorizeFromNative',
    component: MemorizeFromNativeTask,
    isPossibleToMake: memorizeFromNativePossible,
    makeTask: makeMemorizeFromNative
  },
  MemorizeFromTarget: {
    type: 'MemorizeFromTarget',
    component: MemorizeFromTargetTask,
    isPossibleToMake: memorizeFromTargetPossible,
    makeTask: makeMemorizeFromTarget
  },
  RecallFromTarget: {
    type: 'RecallFromTarget',
    component: RecallFromTargetTask,
    isPossibleToMake: recallFromTargetPossible,
    makeTask: makeRecallFromTarget
  },
  RecallFromNative: {
    type: 'RecallFromNative',
    component: RecallFromNativeTask,
    isPossibleToMake: recallFromNativePossible,
    makeTask: makeRecallFromNative
  },
  FormSentence: {
    type: 'FormSentence',
    component: FormSentenceTask,
    isPossibleToMake: formSentencePossible,
    makeTask: makeFormSentence
  },
  UnderstandNativeFromSentence: {
    type: 'UnderstandNativeFromSentence',
    component: UnderstandNativeFromSentenceTask,
    isPossibleToMake: understandNativeFromSentencePossible,
    makeTask: makeUnderstandNativeFromSentence
  },
  UnderstandTargetFromSentence: {
    type: 'UnderstandTargetFromSentence',
    component: UnderstandTargetFromSentenceTask,
    isPossibleToMake: understandTargetFromSentencePossible,
    makeTask: makeUnderstandTargetFromSentence
  },
  UnderstandSentenceAroundTargetGloss: {
    type: 'UnderstandSentenceAroundTargetGloss',
    component: UnderstandSentenceAroundTargetGlossTask,
    isPossibleToMake: understandSentenceAroundTargetGlossPossible,
    makeTask: makeUnderstandSentenceAroundTargetGloss
  },
  ChallengeTryToExpress: {
    type: 'ChallengeTryToExpress',
    component: ChallengeTryToExpressTask,
    isPossibleToMake: challengeExpressPossible,
    makeTask: makeChallengeExpress
  },
  ChallengeTryToUnderstand: {
    type: 'ChallengeTryToUnderstand',
    component: ChallengeTryToUnderstandTask,
    isPossibleToMake: challengeUnderstandPossible,
    makeTask: makeChallengeUnderstand
  }
}

export const getTaskDefinition = (taskType: TaskType): TaskDefinition => taskRegistry[taskType]
