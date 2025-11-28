import { isParaphrased } from '@/entities/gloss/isParaphrased'
import type { Gloss } from '@/dumb/types'

export function extractExpressionChallenges(glosses: Gloss[], nativeLangIso: string): Gloss[] {
  const glossByKey = new Map(glosses.map(gloss => [gloss.key, gloss]))

  return glosses.filter(gloss => {
    if (gloss.language !== nativeLangIso) return false
    if (!isParaphrased(gloss.content)) return false
    if (gloss.translations.length === 0) return false

    return gloss.contains.some(key => {
      const contained = glossByKey.get(key)
      return Boolean(contained && contained.translations.length > 0)
    })
  })
}
