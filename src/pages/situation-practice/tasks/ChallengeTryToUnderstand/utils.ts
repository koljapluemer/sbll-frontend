import type { GlossIndex, GlossRef } from '@/entities/gloss/types'
import { getRandomTranslations, hasTranslationInLanguage, resolveGloss } from '../taskUtils'
import type { TaskContext } from '../../types'
import type { ChallengeTryToUnderstandTask } from './interface'

export const isPossibleToMake = (glossRef: GlossRef, repo: GlossIndex, context: TaskContext): boolean => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return false

  return hasTranslationInLanguage(gloss, repo, context.nativeIso)
}

export const makeTask = (
  glossRef: GlossRef,
  repo: GlossIndex,
  context: TaskContext
): ChallengeTryToUnderstandTask | undefined => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return undefined

  const translations = getRandomTranslations(gloss, repo, context.nativeIso, 3)
  if (!translations.length) return undefined

  return {
    gloss,
    translations
  }
}
