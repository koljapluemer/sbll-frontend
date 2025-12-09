import type { NormalizedGloss } from '@/entities/gloss/types'

export type ExamplePair = {
  example: NormalizedGloss
  translation: NormalizedGloss
}

export type UnderstandTargetFromSentenceTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
  examples: ExamplePair[]
}
