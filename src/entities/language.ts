export type LanguageInfo = {
  iso: string
  displayName: string
  symbol: string
}

let languageDataCache: Record<string, { displayName: string, symbols: string[] }> | null = null

export async function getLanguageInfo(iso: string): Promise<LanguageInfo> {
  if (!languageDataCache) {
    languageDataCache = await fetch('/glosses4learning-language-reference/glosses4learning-language-reference/languages.json')
      .then(res => res.json())
  }

  const data = languageDataCache![iso]
  return {
    iso,
    displayName: data?.displayName || iso,
    symbol: data?.symbols?.[0] || ''
  }
}

export async function getLanguageDisplayName(iso: string): Promise<string> {
  const info = await getLanguageInfo(iso)
  return info.displayName
}
