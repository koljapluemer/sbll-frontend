<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { format, parse } from 'date-fns'
import { getLanguageInfo } from '@/entities/language'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

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

const formatDateLabel = (dateStr: string) => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date())
  return format(date, 'MM/dd')
}

const chartData = computed(() => {
  const labels = props.data.map((d) => formatDateLabel(d.date))

  const datasets = targetLanguages.value.map((iso) => ({
    label: languageNames.value[iso] || iso,
    data: props.data.map((d) => d.runs[iso] || 0),
    backgroundColor: colorMap.value[iso] || '#6366f1'
  }))

  return {
    labels,
    datasets
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  },
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}
</script>

<template>
  <div
    class="w-full max-w-full"
    style="height: 350px"
  >
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
