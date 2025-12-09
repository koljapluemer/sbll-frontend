import type { GlossIndex, GlossRef } from '@/entities/gloss/types'
import { getRandomTranslations, hasTranslationInLanguage, resolveGloss } from '../taskUtils'
import type { TaskContext } from '../../types'
import type { RecallFromNativeTask } from './interface'

export const isPossibleToMake = (glossRef: GlossRef, repo: GlossIndex, context: TaskContext): boolean => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return false

  return gloss.language === context.nativeIso && hasTranslationInLanguage(gloss, repo, context.targetIso)
}

export const makeTask = (
  glossRef: GlossRef,
  repo: GlossIndex,
  context: TaskContext
): RecallFromNativeTask | undefined => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return undefined

  const translations = getRandomTranslations(gloss, repo, context.targetIso, 3)
  if (!translations.length) return undefined

  return {
    gloss,
    translations
  }
}
