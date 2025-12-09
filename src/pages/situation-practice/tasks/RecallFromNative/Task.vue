<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
import type { IndexCardRow } from '../../elements/types'
import type { RecallFromNativeTask } from './interface'

defineOptions({ name: 'RecallFromNativeTask' })

const props = defineProps<{
  task: RecallFromNativeTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const phase = ref<'prompt' | 'reveal'>('prompt')
const flipped = ref(false)

const cardRows = computed<IndexCardRow[]>(() => {
  if (phase.value === 'prompt') {
    return [{ type: 'text', text: props.task.gloss.content, size: 'auto' }]
  }

  const translationRows = props.task.translations.flatMap((translation, index) => {
    const rows = []
    
    rows.push({ type: 'text', text: translation.content, size: 'auto' } as IndexCardRow)
    return rows
  })

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

const handleFlip = () => {
  flipped.value = true
  phase.value = 'reveal'
}

const handleDone = (icon: string) => emit('taskDone', icon === 'Check')
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-xl">
    <ShowInstruction
      v-if="phase === 'prompt'"
      content="Do you remember how to express this?"
    />

    <IndexCard
      :rows="cardRows"
      :flipped="flipped"
    />

    <InteractionButtonRow
      v-if="phase === 'prompt'"
      :icons="['RefreshCw']"
      @select="handleFlip"
    />

    <InteractionButtonRow
      v-else
      :icons="['Check', 'X']"
      @select="handleDone"
    />
  </div>
</template>
