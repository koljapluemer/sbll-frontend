<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
import type { IndexCardRow } from '../../elements/types'
import type { UnderstandTargetFromSentenceTask } from './interface'

defineOptions({ name: 'UnderstandTargetFromSentenceTask' })

const props = defineProps<{
  task: UnderstandTargetFromSentenceTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const phase = ref<'question' | 'answer'>('question')
const mainFlipped = ref(false)
const swipeExamples = ref(false)

const questionCard = computed<IndexCardRow[]>(() => [
  { type: 'text', text: props.task.gloss.content, size: 'auto' }
])

const finalCard = computed<IndexCardRow[]>(() => {
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

const flip = () => {
  mainFlipped.value = true
  swipeExamples.value = true
  phase.value = 'answer'
}

const finish = () => emit('taskDone')
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-3xl">
    <ShowInstruction
      v-if="phase === 'question'"
      content="What do you think this means?"
    />

    <IndexCard
      :rows="phase === 'question' ? questionCard : finalCard"
      :flipped="mainFlipped"
    />

    <div
      v-if="phase === 'question'"
      class="grid gap-3"
    >
      <IndexCard
        v-for="pair in task.examples"
        :key="pair.example.ref ?? pair.example.content"
        :rows="[
          { type: 'text', text: pair.translation.content, size: 'normal' },
          { type: 'divider' },
          { type: 'text', text: pair.example.content, size: 'normal' }
        ]"
        :swiped="swipeExamples"
      />
    </div>

    <InteractionButtonRow
      v-if="phase === 'question'"
      :icons="['RefreshCw']"
      @select="flip"
    />

    <InteractionButtonRow
      v-else
      :icons="['Check']"
      @select="finish"
    />
  </div>
</template>
