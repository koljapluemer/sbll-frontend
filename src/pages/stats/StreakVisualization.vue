<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Circle } from 'lucide-vue-next'
import { usePracticeStore } from '@/entities/practice-tracking/practiceStore'
import { format, subDays } from 'date-fns'

const practiceStore = usePracticeStore()

interface DayData {
  date: string
  practiced: boolean
}

const last14Days = computed<DayData[]>(() => {
  const today = new Date()
  const days: DayData[] = []

  for (let i = 13; i >= 0; i--) {
    const date = subDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')

    // Check if any lesson was run on this day
    const chartData = practiceStore.getLast14DaysChartData()
    const dayData = chartData.find(d => d.date === dateStr)
    const practiced = dayData ? Object.keys(dayData.runs).length > 0 : false

    days.push({ date: dateStr, practiced })
  }

  return days
})

const streak = computed<number>(() => {
  const days = last14Days.value
  let currentStreak = 0
  let missedOne = false

  // Start from the most recent day and go backwards
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]
    if (!day) continue

    if (day.practiced) {
      currentStreak++
      missedOne = false
    } else {
      // Didn't practice this day
      if (missedOne) {
        // Already missed one day, this breaks the streak
        break
      } else {
        // First miss, allow it but don't count it
        missedOne = true
      }
    }
  }

  return currentStreak
})
</script>

<template>
  <div class="flex items-center gap-4">
    <div class="flex gap-1">
      <div
        v-for="(day, index) in last14Days"
        :key="index"
        class="text-gray-400"
      >
        <Flame
          v-if="day.practiced"
          :size="20"
          class="text-orange-500"
        />
        <Circle
          v-else
          :size="20"
        />
      </div>
    </div>
    <div class="text-2xl font-bold">
      {{ streak }}
    </div>
  </div>
</template>
