export interface TargetLanguage {
  iso: string
  name: string
  short: string
}

export interface Situation {
  id: string
  target_description: string
  native_description: string
  image_link: string
}

export interface Gloss {
  key: string
  content: string
  language: string
  transcriptions: string[]
  contains: string[]
  translations: string[]
  notes: string[]
}
