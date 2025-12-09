import { takeRandom } from '@/dumb/random'
import type { GlossIndex, GlossRef, NormalizedGloss } from '@/entities/gloss/types'

export const resolveGloss = (ref: GlossRef | undefined, repo: GlossIndex): NormalizedGloss | null =>
  (ref ? repo[ref] : null) ?? null

export const getTranslationsByLanguage = (
  gloss: NormalizedGloss | null,
  repo: GlossIndex,
  language?: string
): NormalizedGloss[] => {
  if (!gloss) return []

  return gloss.translations
    .map(ref => resolveGloss(ref, repo))
    .filter((translation): translation is NormalizedGloss => Boolean(translation))
    .filter(translation => !language || translation.language === language)
}

export const getRandomTranslations = (
  gloss: NormalizedGloss | null,
  repo: GlossIndex,
  language?: string,
  limit = 3
): NormalizedGloss[] => takeRandom(getTranslationsByLanguage(gloss, repo, language), limit)

export const hasTranslationInLanguage = (
  gloss: NormalizedGloss | null,
  repo: GlossIndex,
  language: string
): boolean => getTranslationsByLanguage(gloss, repo, language).length > 0

export const collectUsageExamples = (gloss: NormalizedGloss | null, repo: GlossIndex): NormalizedGloss[] => {
  if (!gloss) return []

  return gloss.usage_examples
    .map(ref => resolveGloss(ref, repo))
    .filter((usage): usage is NormalizedGloss => Boolean(usage))
}

export const getGlossParts = (gloss: NormalizedGloss | null, repo: GlossIndex): NormalizedGloss[] => {
  if (!gloss) return []
  return gloss.parts
    .map(ref => resolveGloss(ref, repo))
    .filter((part): part is NormalizedGloss => Boolean(part))
}
