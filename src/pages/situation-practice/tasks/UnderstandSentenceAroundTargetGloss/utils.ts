import { takeRandom } from '@/dumb/random'
import type { GlossIndex, GlossRef, NormalizedGloss } from '@/entities/gloss/types'
import {
  collectUsageExamples,
  getGlossParts,
  getRandomTranslations,
  hasTranslationInLanguage,
  resolveGloss
} from '../taskUtils'
import type { TaskContext } from '../../types'
import type { UnderstandSentenceAroundTargetGlossTask } from './interface'

const usageExampleIsValid = (
  example: NormalizedGloss,
  focusGloss: NormalizedGloss,
  repo: GlossIndex,
  nativeIso: string
): boolean => {
  if (!example.parts.length) return false
  if (!hasTranslationInLanguage(example, repo, nativeIso)) return false
  const parts = getGlossParts(example, repo)
  if (!parts.length) return false

  const containsFocus = parts.some(part => part.ref === focusGloss.ref)
  if (!containsFocus) return false

  return parts.every(part => hasTranslationInLanguage(part, repo, nativeIso))
}

export const isPossibleToMake = (glossRef: GlossRef, repo: GlossIndex, context: TaskContext): boolean => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return false
  if (gloss.language !== context.targetIso) return false

  const usageExamples = collectUsageExamples(gloss, repo)
  return usageExamples.some(example => usageExampleIsValid(example, gloss, repo, context.nativeIso))
}

export const makeTask = (
  glossRef: GlossRef,
  repo: GlossIndex,
  context: TaskContext
): UnderstandSentenceAroundTargetGlossTask | undefined => {
  const focusGloss = resolveGloss(glossRef, repo)
  if (!focusGloss) return undefined

  const validExamples = collectUsageExamples(focusGloss, repo)
    .filter(example => usageExampleIsValid(example, focusGloss, repo, context.nativeIso))

  if (!validExamples.length) return undefined

  const example = takeRandom(validExamples, 1)[0]
  if (!example) return undefined

  const exampleTranslations = getRandomTranslations(example, repo, context.nativeIso, 3)
  if (!exampleTranslations.length) return undefined

  const parts = getGlossParts(example, repo).filter(part => part.ref !== focusGloss.ref)
  const otherParts = parts.map(part => ({
    gloss: part,
    translations: getRandomTranslations(part, repo, context.nativeIso, 3)
  })).filter(part => part.translations.length > 0)

  if (!otherParts.length) return undefined

  const focusTranslations = getRandomTranslations(focusGloss, repo, context.nativeIso, 3)
  if (!focusTranslations.length) return undefined

  return {
    focusGloss,
    example,
    exampleTranslations,
    otherParts,
    focusTranslations
  }
}
