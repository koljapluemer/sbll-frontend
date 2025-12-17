<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { format, parse } from 'date-fns'
import { getLanguageInfo } from '@/entities/language'

type ChartDataPoint = {
  date: string
  runs: Record<string, number>
}

const props = defineProps<{
  data: ChartDataPoint[]
}>()

const COLOR_PALETTE = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1' // indigo-500
]

const targetLanguages = computed(() => {
  const langs = new Set<string>()
  props.data.forEach((d) => {
    Object.keys(d.runs).forEach((iso) => langs.add(iso))
  })
  return Array.from(langs).sort()
})

const colorMap = computed(() => {
  const map: Record<string, string> = {}
  targetLanguages.value.forEach((iso, index) => {
    map[iso] = COLOR_PALETTE[index % COLOR_PALETTE.length] || '#6366f1'
  })
  return map
})

const languageNames = ref<Record<string, string>>({})

watch(
  targetLanguages,
  async (langs) => {
    for (const iso of langs) {
      const info = await getLanguageInfo(iso)
      languageNames.value[iso] = info.displayName
    }
  },
  { immediate: true }
)

const maxRuns = computed(() => {
  let max = 0
  props.data.forEach((d) => {
    const total = Object.values(d.runs).reduce((sum, count) => sum + count, 0)
    if (total > max) max = total
  })
  return max || 5
})

const BAR_WIDTH = 40
const BAR_GAP = 8
const CHART_HEIGHT = 300
const PADDING = { top: 20, right: 20, bottom: 60, left: 40 }
const chartWidth = computed(
  () => props.data.length * (BAR_WIDTH + BAR_GAP) + PADDING.left + PADDING.right
)

const formatDateLabel = (dateStr: string) => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  return format(date, 'MM/dd')
}

const bars = computed(() => {
  return props.data.map((dataPoint, index) => {
    const x = PADDING.left + index * (BAR_WIDTH + BAR_GAP)
    const stacks: Array<{ iso: string; y: number; height: number; color: string }> = []

    let currentY = PADDING.top + CHART_HEIGHT

    targetLanguages.value.forEach((iso) => {
      const count = dataPoint.runs[iso] || 0
      if (count > 0) {
        const height = (count / maxRuns.value) * CHART_HEIGHT
        currentY -= height

        stacks.push({
          iso,
          y: currentY,
          height,
          color: colorMap.value[iso] || '#6366f1'
        })
      }
    })

    return {
      x,
      stacks,
      label: formatDateLabel(dataPoint.date)
    }
  })
})
</script>

<template>
  <div class="w-full overflow-x-auto">
    <svg
      :width="chartWidth"
      :height="CHART_HEIGHT + PADDING.top + PADDING.bottom"
    >
      <g
        v-for="(bar, barIndex) in bars"
        :key="barIndex"
      >
        <rect
          v-for="(stack, stackIndex) in bar.stacks"
          :key="stackIndex"
          :x="bar.x"
          :y="stack.y"
          :width="BAR_WIDTH"
          :height="stack.height"
          :fill="stack.color"
          class="transition-opacity hover:opacity-80"
        />

        <text
          :x="bar.x + BAR_WIDTH / 2"
          :y="PADDING.top + CHART_HEIGHT + 20"
          text-anchor="middle"
          class="text-xs fill-gray-600"
        >
          {{ bar.label }}
        </text>
      </g>

      <line
        :x1="PADDING.left"
        :y1="PADDING.top"
        :x2="PADDING.left"
        :y2="PADDING.top + CHART_HEIGHT"
        stroke="currentColor"
        class="stroke-gray-300"
      />

      <line
        :x1="PADDING.left"
        :y1="PADDING.top + CHART_HEIGHT"
        :x2="chartWidth - PADDING.right"
        :y2="PADDING.top + CHART_HEIGHT"
        stroke="currentColor"
        class="stroke-gray-300"
      />
    </svg>

    <div class="flex flex-wrap gap-4 mt-4 justify-center">
      <div
        v-for="iso in targetLanguages"
        :key="iso"
        class="flex items-center gap-2"
      >
        <div
          class="w-4 h-4 rounded"
          :style="{ backgroundColor: colorMap[iso] || '#6366f1' }"
        />
        <span class="text-sm">{{ languageNames[iso] || iso }}</span>
      </div>
    </div>
  </div>
</template>
