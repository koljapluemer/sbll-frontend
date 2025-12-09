import type { NormalizedGloss } from '@/entities/gloss/types'

export type ChallengeTryToExpressTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
