<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import type { FormSentenceTask } from './interface'

defineOptions({ name: 'FormSentenceTask' })

const props = defineProps<{
  task: FormSentenceTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const isModalOpen = ref(false)
const draft = ref('')

const cardRows = computed(() => {
  const translationRows = props.task.translations.flatMap((translation, index) => {
    const rows = []
    if (index > 0) rows.push({ type: 'divider' } as const)
    rows.push({ type: 'text', text: translation.content, size: 'auto' } as const)
    return rows
  })

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto' } as const,
    { type: 'divider' } as const,
    ...translationRows
  ]
})

const openModal = () => {
  isModalOpen.value = true
  draft.value = ''
}

const confirm = () => {
  isModalOpen.value = false
  emit('taskDone')
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-xl">
    <ShowInstruction
      content="Form a sentence that includes this word"
    />

    <IndexCard :rows="cardRows" />

    <button
      class="btn btn-primary"
      type="button"
      @click="openModal"
    >
      Start typing
    </button>

    <dialog
      v-if="isModalOpen"
      class="modal modal-open"
    >
      <div class="modal-box">
        <h3 class="font-semibold mb-3">
          {{ task.gloss.content }}
        </h3>
        <textarea
          v-model="draft"
          class="textarea textarea-bordered w-full"
          rows="4"
        />

        <div class="modal-action">
          <button
            class="btn btn-outline"
            type="button"
            @click="isModalOpen = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            type="button"
            @click="confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
