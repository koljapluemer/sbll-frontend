import type { NormalizedGloss } from '@/entities/gloss/types'

export type SentencePart = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}

export type UnderstandSentenceAroundTargetGlossTask = {
  focusGloss: NormalizedGloss
  example: NormalizedGloss
  exampleTranslations: NormalizedGloss[]
  otherParts: SentencePart[]
  focusTranslations: NormalizedGloss[]
}
