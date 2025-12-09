import type { NormalizedGloss } from '@/entities/gloss/types'

export type MemorizeFromTargetTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
