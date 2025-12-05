import glossSchemaJson from '../../../gloss.schema.json'

export const glossSchema = glossSchemaJson

export const glossRefPattern = new RegExp(glossSchema.$defs.GlossRef.pattern)
