import { parseJsonl } from '@/dumb/jsonl-utils'
import { normalizeGloss } from './normalize'
import type { Gloss, GlossIndex, GlossRef, NormalizedGloss } from './types'

export const dedupeGlossRefs = (refs: GlossRef[]): GlossRef[] => Array.from(new Set(refs))

export const resolveGlossRef = (
  ref: GlossRef | null | undefined,
  index: GlossIndex
): NormalizedGloss | null => {
  if (!ref) return null
  return index[ref] ?? null
}

export const collectGlossTranslations = (
  gloss: Pick<NormalizedGloss, 'translations'> | null,
  index: GlossIndex
): NormalizedGloss[] => {
  if (!gloss) return []

  return gloss.translations
    .map(ref => resolveGlossRef(ref, index))
    .filter((entry): entry is NormalizedGloss => Boolean(entry))
}

export const buildGlossIndex = (glosses: Gloss[]): GlossIndex => {
  return glosses.reduce<GlossIndex>((acc, gloss) => {
    const normalized = normalizeGloss(gloss)
    if (normalized.ref) {
      acc[normalized.ref] = normalized
    }
    return acc
  }, {})
}

export const loadGlossList = async (url: string): Promise<NormalizedGloss[]> => {
  const glosses = await parseJsonl<Gloss>(url)
  return glosses.map(normalizeGloss)
}
