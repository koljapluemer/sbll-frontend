import { takeRandom } from '@/dumb/random'
import type { GlossIndex, GlossRef, NormalizedGloss } from '@/entities/gloss/types'
import {
  collectUsageExamples,
  getRandomTranslations,
  hasTranslationInLanguage,
  resolveGloss
} from '../taskUtils'
import type { TaskContext } from '../../types'
import type { UnderstandTargetFromSentenceTask } from './interface'

const validExamples = (
  gloss: NormalizedGloss,
  repo: GlossIndex,
  nativeIso: string
): NormalizedGloss[] => {
  const usageExamples = collectUsageExamples(gloss, repo)
  return usageExamples.filter(example => hasTranslationInLanguage(example, repo, nativeIso))
}

export const isPossibleToMake = (glossRef: GlossRef, repo: GlossIndex, context: TaskContext): boolean => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return false
  if (gloss.language !== context.targetIso) return false

  if (!hasTranslationInLanguage(gloss, repo, context.nativeIso)) return false

  return validExamples(gloss, repo, context.nativeIso).length >= 2
}

export const makeTask = (
  glossRef: GlossRef,
  repo: GlossIndex,
  context: TaskContext
): UnderstandTargetFromSentenceTask | undefined => {
  const gloss = resolveGloss(glossRef, repo)
  if (!gloss) return undefined

  const examples = validExamples(gloss, repo, context.nativeIso)
  if (examples.length < 2) return undefined

  const chosenExamples = takeRandom(examples, Math.max(2, Math.min(3, examples.length)))

  const pairedExamples = chosenExamples.map(example => {
    const translation = getRandomTranslations(example, repo, context.nativeIso, 1)[0]
    return translation ? { example, translation } : null
  }).filter((pair): pair is NonNullable<typeof pair> => Boolean(pair))

  if (pairedExamples.length < 2) return undefined

  const translations = getRandomTranslations(gloss, repo, context.nativeIso, 3)
  if (!translations.length) return undefined

  return {
    gloss,
    translations,
    examples: pairedExamples
  }
}
