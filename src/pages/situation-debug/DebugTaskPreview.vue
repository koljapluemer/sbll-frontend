<script setup lang="ts">
import { computed } from 'vue'
import { Check, X, ArrowRight } from 'lucide-vue-next'
import type { SimulatedTask } from './types'

const props = defineProps<{
  simulatedTask: SimulatedTask
  index: number
}>()

const resultIndicator = computed(() => {
  if (props.simulatedTask.simulatedResult === undefined) {
    return { icon: ArrowRight, class: 'text-base-content', label: 'Auto-advance' }
  }
  return props.simulatedTask.simulatedResult
    ? { icon: Check, class: 'text-success', label: 'Remembered' }
    : { icon: X, class: 'text-error', label: 'Forgot' }
})
</script>

<template>
  <div class="border border-base-300 rounded-lg p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="badge badge-primary">{{ index + 1 }}</span>
        <span class="font-mono text-sm">{{ simulatedTask.taskType }}</span>
      </div>

      <div class="flex items-center gap-2">
        <component :is="resultIndicator.icon" :class="['w-4 h-4', resultIndicator.class]" />
        <span class="text-sm text-light">{{ resultIndicator.label }}</span>
      </div>
    </div>

    <div class="text-sm">
      <span class="font-semibold">Queue change:</span>
      <span class="ml-2 font-mono">{{ simulatedTask.queueStateChange }}</span>
    </div>

    <div class="origin-top-left border-dashed border-yellow-600 max-h-52" style="transform: scale(0.3)">
      <component :is="simulatedTask.component" :task="simulatedTask.taskData" @task-done="() => { }" />
    </div>

    <div v-if="simulatedTask.glossRef" class="text-xs text-light font-mono">
      {{ simulatedTask.glossRef }}
    </div>
  </div>
</template>
