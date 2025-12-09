import type { NormalizedGloss } from '@/entities/gloss/types'

export type ExamplePair = {
  example: NormalizedGloss
  translation: NormalizedGloss
}

export type UnderstandNativeFromSentenceTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
  examples: ExamplePair[]
}
