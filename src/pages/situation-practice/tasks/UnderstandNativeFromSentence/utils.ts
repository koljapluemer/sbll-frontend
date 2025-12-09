import { takeRandom } from '@/dumb/random'
import type { GlossIndex, GlossRef, NormalizedGloss } from '@/entities/gloss/types'
import {
  collectUsageExamples,
  getRandomTranslations,
  getTranslationsByLanguage,
  hasTranslationInLanguage,
  resolveGloss
} from '../taskUtils'
import type { TaskContext } from '../../types'
import type { UnderstandNativeFromSentenceTask } from './interface'

const findValidExamples = (
  translation: NormalizedGloss,
  repo: GlossIndex,
  nativeIso: string
): NormalizedGloss[] => {
  const usageExamples = collectUsageExamples(translation, repo)
  return usageExamples.filter(example => hasTranslationInLanguage(example, repo, nativeIso))
}

export const isPossibleToMake = (glossRef: GlossRef, repo: GlossIndex, context: TaskContext): boolean => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return false
  if (gloss.language !== context.nativeIso) return false

  const translations = getTranslationsByLanguage(gloss, repo, context.targetIso)

  return translations.some(translation => findValidExamples(translation, repo, context.nativeIso).length >= 2)
}

export const makeTask = (
  glossRef: GlossRef,
  repo: GlossIndex,
  context: TaskContext
): UnderstandNativeFromSentenceTask | undefined => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return undefined

  const translations = getTranslationsByLanguage(gloss, repo, context.targetIso)
  const validTranslations = translations.filter(translation =>
    findValidExamples(translation, repo, context.nativeIso).length >= 2
  )

  if (!validTranslations.length) return undefined

  const validTranslation = takeRandom(validTranslations, 1)[0]
  if (!validTranslation) return undefined

  const usageExamples = findValidExamples(validTranslation, repo, context.nativeIso)
  const selectedExamples = takeRandom(usageExamples, Math.max(2, Math.min(3, usageExamples.length)))

  const examples = selectedExamples.reduce<{ example: NormalizedGloss; translation: NormalizedGloss }[]>(
    (acc, example) => {
      const nativeTranslation = getRandomTranslations(example, repo, context.nativeIso, 1)[0]
      if (nativeTranslation) {
        acc.push({ example, translation: nativeTranslation })
      }
      return acc
    },
    []
  )

  if (examples.length < 2) return undefined

  const practiceTranslations = getRandomTranslations(gloss, repo, context.targetIso, 3)
  if (!practiceTranslations.length) return undefined

  return {
    gloss,
    translations: practiceTranslations,
    examples
  }
}
