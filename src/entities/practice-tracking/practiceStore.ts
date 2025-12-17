import { defineStore } from 'pinia'
import { parse, isSameDay, format } from 'date-fns'

type PracticeData = Record<string, string> // "count:datetime"

function parseRecord(value: string): { count: number, datetime: string } | null {
  const parts = value.split(':')
  if (parts.length < 2) return null
  const countStr = parts[0]
  if (!countStr) return null
  const count = parseInt(countStr, 10)
  const datetime = parts.slice(1).join(':')
  if (isNaN(count)) return null
  return { count, datetime }
}

function parseDateString(dateString: string): Date | null {
  try {
    return parse(dateString, "yy-MM-dd'T'HH:mm", new Date())
  } catch {
    return null
  }
}

function isSameDayAsToday(dateString: string): boolean {
  const date = parseDateString(dateString)
  if (!date) return false
  return isSameDay(date, new Date())
}

function parseStreakRecord(value: string): { streak: number, datetime: string } | null {
  const parts = value.split(':')
  if (parts.length < 2) return null
  const streakStr = parts[0]
  if (!streakStr) return null
  const streak = parseInt(streakStr, 10)
  const datetime = parts.slice(1).join(':')
  if (isNaN(streak)) return null
  return { streak, datetime }
}

export const usePracticeStore = defineStore('practice-tracking', {
  state: () => ({
    data: {} as PracticeData,
    glossStreaks: {} as Record<string, string>, // "streak:datetime"
    lessonRuns: {} as Record<string, string> // "targetIso:date1,date2,date3,..."
  }),

  actions: {
    recordPractice(identifier: string) {
      const now = new Date()
      const nowString = format(now, "yy-MM-dd'T'HH:mm")

      const existing = this.data[identifier]

      if (!existing) {
        this.data[identifier] = `1:${nowString}`
      } else {
        const parsed = parseRecord(existing)
        if (!parsed) {
          this.data[identifier] = `1:${nowString}`
        } else if (isSameDayAsToday(parsed.datetime)) {
          this.data[identifier] = `${parsed.count}:${nowString}`
        } else {
          this.data[identifier] = `${parsed.count + 1}:${nowString}`
        }
      }
    },

    getPracticeCount(identifier: string): number {
      const value = this.data[identifier]
      if (!value) return 0
      const parsed = parseRecord(value)
      return parsed?.count ?? 0
    },

    getLastPracticedDate(identifier: string): Date | null {
      const value = this.data[identifier]
      if (!value) return null
      const parsed = parseRecord(value)
      if (!parsed) return null
      return parseDateString(parsed.datetime)
    },

    wasPracticedToday(identifier: string): boolean {
      const value = this.data[identifier]
      if (!value) return false
      const parsed = parseRecord(value)
      if (!parsed) return false
      return isSameDayAsToday(parsed.datetime)
    },

    getPracticeStats(identifiers: string[]): {
      platinum: number
      gold: number
      green: number
      grey: number
    } {
      let platinum = 0
      let gold = 0
      let green = 0
      let grey = 0

      for (const id of identifiers) {
        const value = this.data[id]
        if (!value) {
          grey++
          continue
        }
        const parsed = parseRecord(value)
        const count = parsed?.count ?? 0
        if (count > 10) platinum++
        else if (count > 3) gold++
        else if (count >= 1) green++
        else grey++
      }

      return { platinum, gold, green, grey }
    },

    updateGlossStreak(glossRef: string, rememberedCorrectly: boolean) {
      const now = new Date()
      const nowString = format(now, "yy-MM-dd'T'HH:mm")

      const existing = this.glossStreaks[glossRef]

      if (!existing) {
        // First time practicing this gloss
        this.glossStreaks[glossRef] = rememberedCorrectly
          ? `1:${nowString}`
          : `-1:${nowString}`
      } else {
        const parsed = parseStreakRecord(existing)
        if (!parsed) {
          // Invalid format, reset
          this.glossStreaks[glossRef] = rememberedCorrectly
            ? `1:${nowString}`
            : `-1:${nowString}`
        } else {
          const currentStreak = parsed.streak

          if (rememberedCorrectly) {
            // Correct answer: increment positive streak or reset from negative
            const newStreak = currentStreak > 0 ? currentStreak + 1 : 1
            this.glossStreaks[glossRef] = `${newStreak}:${nowString}`
          } else {
            // Incorrect answer: decrement negative streak or reset from positive
            const newStreak = currentStreak < 0 ? currentStreak - 1 : -1
            this.glossStreaks[glossRef] = `${newStreak}:${nowString}`
          }
        }
      }
    },

    getGlossStreak(glossRef: string): { streak: number, datetime: Date } | null {
      const value = this.glossStreaks[glossRef]
      if (!value) return null
      const parsed = parseStreakRecord(value)
      if (!parsed) return null
      const date = parseDateString(parsed.datetime)
      if (!date) return null
      return { streak: parsed.streak, datetime: date }
    },

    hasBeenPracticed(glossRef: string): boolean {
      return !!this.glossStreaks[glossRef]
    },

    recordLessonRun(targetIso: string) {
      const today = format(new Date(), 'yy-MM-dd')
      const existing = this.lessonRuns[targetIso]

      if (!existing) {
        this.lessonRuns[targetIso] = today
      } else {
        this.lessonRuns[targetIso] = `${existing},${today}`
      }
    },

    getLessonRunsByDateRange(startDate: Date, endDate: Date): Record<string, Record<string, number>> {
      const result: Record<string, Record<string, number>> = {}

      for (const [targetIso, runString] of Object.entries(this.lessonRuns)) {
        if (!runString) continue

        const dates = runString.split(',')
        for (const dateStr of dates) {
          const date = parse(dateStr, 'yy-MM-dd', new Date())

          if (date >= startDate && date <= endDate) {
            const formattedDate = format(date, 'yyyy-MM-dd')
            if (!result[formattedDate]) {
              result[formattedDate] = {}
            }
            if (!result[formattedDate][targetIso]) {
              result[formattedDate][targetIso] = 0
            }
            result[formattedDate][targetIso]++
          }
        }
      }

      return result
    },

    getLast14DaysChartData(): Array<{ date: string; runs: Record<string, number> }> {
      const today = new Date()
      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(today.getDate() - 13)

      const runsByDate = this.getLessonRunsByDateRange(fourteenDaysAgo, today)

      const result = []
      for (let i = 0; i < 14; i++) {
        const date = new Date(fourteenDaysAgo)
        date.setDate(fourteenDaysAgo.getDate() + i)
        const dateStr = format(date, 'yyyy-MM-dd')

        result.push({
          date: dateStr,
          runs: runsByDate[dateStr] || {}
        })
      }

      return result
    }
  },

  persist: true
})
