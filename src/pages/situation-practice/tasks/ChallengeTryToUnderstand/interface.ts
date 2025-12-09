import type { NormalizedGloss } from '@/entities/gloss/types'

export type ChallengeTryToUnderstandTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
