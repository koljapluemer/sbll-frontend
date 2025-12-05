import { glossSchema } from './schema'
import type { Gloss, GlossRef, NormalizedGloss } from './types'

const normalizeRefs = (refs: GlossRef[] | undefined): GlossRef[] => {
  if (!Array.isArray(refs)) return []
  return refs.filter(Boolean)
}

export const normalizeGloss = (gloss: Gloss): NormalizedGloss => {
  if (!gloss.content) {
    throw new Error('Gloss is missing required content.')
  }

  return {
    ref: gloss.ref,
    content: gloss.content,
    language: gloss.language ?? glossSchema.properties.language.default ?? 'und',
    transcriptions: gloss.transcriptions ?? {},
    logs: gloss.logs ?? {},
    morphologically_related: normalizeRefs(gloss.morphologically_related),
    parts: normalizeRefs(gloss.parts),
    has_similar_meaning: normalizeRefs(gloss.has_similar_meaning),
    sounds_similar: normalizeRefs(gloss.sounds_similar),
    usage_examples: normalizeRefs(gloss.usage_examples),
    to_be_differentiated_from: normalizeRefs(gloss.to_be_differentiated_from),
    collocations: normalizeRefs(gloss.collocations),
    typical_follow_up: normalizeRefs(gloss.typical_follow_up),
    children: normalizeRefs(gloss.children),
    translations: normalizeRefs(gloss.translations),
    notes: normalizeRefs(gloss.notes),
    tags: normalizeRefs(gloss.tags)
  }
}
