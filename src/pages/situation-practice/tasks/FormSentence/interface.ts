import type { NormalizedGloss } from '@/entities/gloss/types'

export type FormSentenceTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
