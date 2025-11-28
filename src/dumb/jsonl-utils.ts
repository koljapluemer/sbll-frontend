export async function parseJsonl<T>(url: string): Promise<T[]> {
  const response = await fetch(url)
  const text = await response.text()

  return text
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line))
}
