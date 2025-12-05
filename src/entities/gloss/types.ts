import type glossSchema from '../../../gloss.schema.json'

export type GlossSchema = typeof glossSchema

export type GlossRef = string

export type GlossTranscriptions = Record<string, string>
export type GlossLogs = Record<string, string>

export type Gloss = {
  ref?: GlossRef
  content: string
  language?: string
  transcriptions?: GlossTranscriptions
  logs?: GlossLogs
  morphologically_related?: GlossRef[]
  parts?: GlossRef[]
  has_similar_meaning?: GlossRef[]
  sounds_similar?: GlossRef[]
  usage_examples?: GlossRef[]
  to_be_differentiated_from?: GlossRef[]
  collocations?: GlossRef[]
  typical_follow_up?: GlossRef[]
  children?: GlossRef[]
  translations?: GlossRef[]
  notes?: GlossRef[]
  tags?: GlossRef[]
}

export type NormalizedGloss = {
  ref?: GlossRef
  content: string
  language: string
  transcriptions: GlossTranscriptions
  logs: GlossLogs
  morphologically_related: GlossRef[]
  parts: GlossRef[]
  has_similar_meaning: GlossRef[]
  sounds_similar: GlossRef[]
  usage_examples: GlossRef[]
  to_be_differentiated_from: GlossRef[]
  collocations: GlossRef[]
  typical_follow_up: GlossRef[]
  children: GlossRef[]
  translations: GlossRef[]
  notes: GlossRef[]
  tags: GlossRef[]
}

export type GlossIndex = Record<GlossRef, NormalizedGloss>
