export async function parseJsonl<T>(url: string): Promise<T[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch JSONL: ${response.status} ${response.statusText} for URL: ${url}`)
  }
  const text = await response.text()

  return text
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line))
}
