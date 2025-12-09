import type { NormalizedGloss } from '@/entities/gloss/types'

export type RecallFromTargetTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
