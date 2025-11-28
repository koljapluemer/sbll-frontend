export function isParaphrased(content: string): boolean {
  return content.startsWith('[') && content.endsWith(']')
}
