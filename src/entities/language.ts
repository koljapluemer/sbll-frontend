export type LanguageInfo = {
  iso: string
  displayName: string
  symbol: string
}

let languageDataCache: Record<string, { displayName: string, symbol: string }> | null = null

export async function getLanguageInfo(iso: string): Promise<LanguageInfo> {
  if (!languageDataCache) {
    languageDataCache = await fetch('/data/situations/languages.json')
      .then(res => res.json())
  }

  const data = languageDataCache![iso]
  return {
    iso,
    displayName: data?.displayName || iso,
    symbol: data?.symbol || ''
  }
}

export async function getLanguageDisplayName(iso: string): Promise<string> {
  const info = await getLanguageInfo(iso)
  return info.displayName
}
