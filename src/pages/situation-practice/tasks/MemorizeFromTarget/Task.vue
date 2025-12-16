<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import type { IndexCardRow } from '../../elements/types'
import type { MemorizeFromTargetTask } from './interface'

defineOptions({ name: 'MemorizeFromTargetTask' })

const props = defineProps<{
  task: MemorizeFromTargetTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const durationMs = 5000
const remainingMs = ref(durationMs)
let timerId: number | null = null

const stopTimer = () => {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

const startTimer = () => {
  stopTimer()
  remainingMs.value = durationMs

  timerId = window.setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      stopTimer()
      emit('taskDone')
    }
  }, 100)
}

const progressWidth = computed(() => `${(remainingMs.value / durationMs) * 100}%`)

const cardRows = computed<IndexCardRow[]>(() => {
  const translationRows = props.task.translations.map(translation => (
    { type: 'text', text: translation.content, size: 'auto' } as IndexCardRow
  ))

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

watch(() => props.task.gloss.ref, () => startTimer())
onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction content="Try to memorize this" />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto w-full">
      <IndexCard
        :rows="cardRows"
        fill
      />

      <div class="w-full bg-base-200 h-2 rounded">
        <div
          class="h-full bg-primary transition-[width] duration-100"
          :style="{ width: progressWidth }"
        />
      </div>
    </div>
  </div>
</template>
