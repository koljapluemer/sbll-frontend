<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
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
const phase = ref<'memorize' | 'recall' | 'reveal'>('memorize')
const flipped = ref(false)
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
  phase.value = 'memorize'
  flipped.value = false

  timerId = window.setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      stopTimer()
      phase.value = 'recall'
      flipped.value = true
    }
  }, 100)
}

const handleFlipReveal = () => {
  flipped.value = false
  phase.value = 'reveal'
}

const finish = () => emit('taskDone')

const progressWidth = computed(() => `${(remainingMs.value / durationMs) * 100}%`)

const cardRows = computed<IndexCardRow[]>(() => {
  if (phase.value === 'recall') {
    return [
      { type: 'text', text: props.task.gloss.content, size: 'auto' }
    ]
  }

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
      <ShowInstruction
        v-if="phase === 'memorize'"
        content="Try to memorize this"
      />
      <ShowInstruction
        v-else-if="phase === 'recall'"
        content="Do you remember what this means?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto w-full">
      <IndexCard
        :rows="cardRows"
        :flipped="flipped"
        fill
      />

      <div
        v-if="phase === 'memorize'"
        class="w-full bg-base-200 h-2 rounded"
      >
        <div
          class="h-full bg-primary transition-[width] duration-100"
          :style="{ width: progressWidth }"
        />
      </div>
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'recall'"
        :icons="['RefreshCw']"
        @select="handleFlipReveal"
      />

      <InteractionButtonRow
        v-else-if="phase === 'reveal'"
        :icons="['Check']"
        @select="finish"
      />
    </div>
  </div>
</template>
