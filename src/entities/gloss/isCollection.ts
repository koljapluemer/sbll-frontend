export function isCollection(content: string): boolean {
  return content.startsWith('-') && content.endsWith('-')
}
