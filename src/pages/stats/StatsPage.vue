<script setup lang="ts">
import { computed } from 'vue'
import { usePracticeStore } from '@/entities/practice-tracking/practiceStore'
import LessonRunsChart from './LessonRunsChart.vue'

const practiceStore = usePracticeStore()

const chartData = computed(() => practiceStore.getLast14DaysChartData())
</script>

<template>
  <div class="w-full max-w-full">
    <h1 class="text-3xl font-bold mb-6">
      Stats
    </h1>

    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">
        Lessons Done
      </h2>
      <LessonRunsChart :data="chartData" />
    </div>
  </div>
</template>
