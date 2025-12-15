import { parseISO, format, isSameDay } from 'date-fns'

const STORAGE_KEY = 'sbll-practice-tracking'

type PracticeRecord = {
  count: number
  lastPracticed: string // ISO datetime string
}

type PracticeData = Record<string, PracticeRecord>

function loadPracticeData(): PracticeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored) as PracticeData
  } catch {
    return {}
  }
}

function savePracticeData(data: PracticeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save practice data:', error)
  }
}

function isSameDayAsToday(dateString: string): boolean {
  try {
    const date = parseISO(dateString)
    return isSameDay(date, new Date())
  } catch {
    return false
  }
}

export function recordPractice(identifier: string): void {
  const data = loadPracticeData()
  const now = new Date()
  const nowString = format(now, "yy-MM-dd'T'HH:mm")

  const existing = data[identifier]

  if (!existing) {
    data[identifier] = { count: 1, lastPracticed: nowString }
  } else if (isSameDayAsToday(existing.lastPracticed)) {
    // Already practiced today, just update timestamp
    data[identifier] = { count: existing.count, lastPracticed: nowString }
  } else {
    // New day, increment counter
    data[identifier] = { count: existing.count + 1, lastPracticed: nowString }
  }

  savePracticeData(data)
}

export function getPracticeRecord(identifier: string): PracticeRecord | null {
  const data = loadPracticeData()
  return data[identifier] ?? null
}

export function getPracticeCount(identifier: string): number {
  const record = getPracticeRecord(identifier)
  return record?.count ?? 0
}

export function getLastPracticedDate(identifier: string): Date | null {
  const record = getPracticeRecord(identifier)
  if (!record) return null
  try {
    return parseISO(record.lastPracticed)
  } catch {
    return null
  }
}

export function wasPracticedToday(identifier: string): boolean {
  const record = getPracticeRecord(identifier)
  if (!record) return false
  return isSameDayAsToday(record.lastPracticed)
}

export function getPracticeStats(identifiers: string[]): {
  platinum: number
  gold: number
  green: number
  grey: number
} {
  const data = loadPracticeData()
  let platinum = 0
  let gold = 0
  let green = 0
  let grey = 0

  for (const id of identifiers) {
    const count = data[id]?.count ?? 0
    if (count > 10) platinum++
    else if (count > 3) gold++
    else if (count >= 1) green++
    else grey++
  }

  return { platinum, gold, green, grey }
}
