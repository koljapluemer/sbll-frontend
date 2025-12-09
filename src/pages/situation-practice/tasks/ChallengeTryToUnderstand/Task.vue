<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
import type { IndexCardRow } from '../../elements/types'
import type { ChallengeTryToUnderstandTask } from './interface'

defineOptions({ name: 'ChallengeTryToUnderstandTask' })

const props = defineProps<{
  task: ChallengeTryToUnderstandTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const flipped = ref(false)
const phase = ref<'prompt' | 'reveal'>('prompt')

const cardRows = computed<IndexCardRow[]>(() => {
  if (phase.value === 'prompt') {
    return [{ type: 'text', text: props.task.gloss.content, size: 'auto' }]
  }

  const translationRows = props.task.translations.flatMap(translation => ([
    { type: 'text', text: translation.content, size: 'auto' } as IndexCardRow
  ]))

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

const flip = () => {
  flipped.value = true
  phase.value = 'reveal'
}

const finish = () => emit('taskDone', true)
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'prompt'"
        content="Can you understand this?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto">
      <IndexCard
        :rows="cardRows"
        :flipped="flipped"
        fill
      />
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'prompt'"
        :icons="['RefreshCw']"
        @select="flip"
      />

      <InteractionButtonRow
        v-else
        :icons="['CheckCheck']"
        @select="finish"
      />
    </div>
  </div>
</template>
