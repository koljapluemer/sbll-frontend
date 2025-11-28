import type { Gloss } from '@/dumb/types'

export function extractUnderstandingChallenges(glosses: Gloss[], targetLangIso: string): Gloss[] {
  return glosses.filter(gloss =>
    gloss.language === targetLangIso &&
    gloss.translations.length > 0 &&
    gloss.contains.length >= 2
  )
}
