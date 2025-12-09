<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
import type { IndexCardRow } from '../../elements/types'
import type { UnderstandSentenceAroundTargetGlossTask } from './interface'

defineOptions({ name: 'UnderstandSentenceAroundTargetGlossTask' })

const props = defineProps<{
  task: UnderstandSentenceAroundTargetGlossTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const phase = ref<'question' | 'answer'>('question')
const mainFlipped = ref(false)
const swipeParts = ref(false)

const exampleQuestionRows = computed<IndexCardRow[]>(() => [
  { type: 'text', text: props.task.example.content, size: 'auto' }
])

const exampleAnswerRows = computed<IndexCardRow[]>(() => {
  const translationRows = props.task.exampleTranslations.map(translation => (
    { type: 'text', text: translation.content, size: 'auto' } as IndexCardRow
  ))

  return [
    { type: 'text', text: props.task.example.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

const focusCardRows = computed<IndexCardRow[]>(() => {
  const translationRows = props.task.focusTranslations.map(translation => (
    { type: 'text', text: translation.content, size: 'auto' } as IndexCardRow
  ))

  return [
    { type: 'text', text: props.task.focusGloss.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

const flip = () => {
  mainFlipped.value = true
  swipeParts.value = true
  phase.value = 'answer'
}

const finish = () => emit('taskDone')

const buildPartRows = (part: UnderstandSentenceAroundTargetGlossTask['otherParts'][number]): IndexCardRow[] => {
  const rows: IndexCardRow[] = [
    { type: 'text', text: part.gloss.content, size: 'normal' },
    { type: 'divider' }
  ]

  part.translations.forEach((translation, index) => {
    if (index > 0) rows.push({ type: 'divider' })
    rows.push({ type: 'text', text: translation.content, size: 'normal' })
  })

  return rows
}
</script>

<template>
  <div class="w-full max-w-3xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'question'"
        content="Try to understand the meaning of this sentence"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 overflow-auto">
      <IndexCard
        :rows="phase === 'question' ? exampleQuestionRows : exampleAnswerRows"
        :flipped="mainFlipped"
        fill
      />

      <div
        v-if="phase === 'question'"
        class="grid gap-3"
      >
        <IndexCard
          v-for="part in task.otherParts"
          :key="part.gloss.ref ?? part.gloss.content"
          :rows="buildPartRows(part)"
          :swiped="swipeParts"
        />
      </div>
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'question'"
        :icons="['RefreshCw']"
        @select="flip"
      />

      <div
        v-else
        class="flex flex-col gap-3 w-full items-center"
      >
        <IndexCard
          :rows="focusCardRows"
          fill
        />

        <InteractionButtonRow
          :icons="['Check']"
          @select="finish"
        />
      </div>
    </div>
  </div>
</template>
