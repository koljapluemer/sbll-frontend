import type { NormalizedGloss } from '@/entities/gloss/types'

export type RecallFromNativeTask = {
  gloss: NormalizedGloss
  translations: NormalizedGloss[]
}
