import type { Gloss } from '@/dumb/types'

export function extractCollections(glosses: Gloss[]): Gloss[] {
  return glosses.filter(gloss =>
    gloss.content.startsWith('-') && gloss.content.endsWith('-')
  )
}
