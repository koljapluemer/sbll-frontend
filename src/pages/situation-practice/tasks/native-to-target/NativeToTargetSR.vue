<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NormalizedGloss } from '@/entities/gloss/types'

const props = defineProps<{
  nativeGloss: NormalizedGloss
  translationExamples: NormalizedGloss[]
  targetLanguage: string
}>()

const emit = defineEmits<{
  remembered: []
  'not-remembered': []
}>()

const hasRevealed = ref(false)

const reveal = () => {
  hasRevealed.value = true
}

const remember = (success: boolean) => {
  if (success) {
    emit('remembered')
  } else {
    emit('not-remembered')
  }
}

watch(
  () => props.nativeGloss.ref ?? props.nativeGloss.content,
  () => {
    hasRevealed.value = false
  }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <div class="badge badge-primary self-start">Prompt</div>
      <div class="text-2xl font-bold">
        Do you remember how to express this in {{ targetLanguage }}?
      </div>
    </div>

    <div class="card shadow">
      <div class="card-body">
        <div class="card-title text-xl">{{ nativeGloss.content }}</div>
        <span v-if="nativeGloss.language" class="badge badge-neutral self-start">
          {{ nativeGloss.language }}
        </span>
      </div>
    </div>

    <div v-if="!hasRevealed" class="flex justify-center">
      <button class="btn btn-primary" @click="reveal">
        Reveal
      </button>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div class="grid gap-2">
        <div
          v-for="translation in translationExamples"
          :key="translation.ref ?? translation.content"
          class="card shadow"
        >
          <div class="card-body">
            <div class="card-title">{{ translation.content }}</div>
            <span v-if="translation.language" class="badge badge-secondary self-start">
              {{ translation.language }}
            </span>
          </div>
        </div>

        <div v-if="translationExamples.length === 0" class="card shadow">
          <div class="card-body">
            <div class="card-title">No translations available.</div>
          </div>
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button class="btn btn-outline" @click="remember(false)">
          Not Remembered
        </button>
        <button class="btn btn-primary" @click="remember(true)">
          Remembered Correctly
        </button>
      </div>
    </div>
  </div>
</template>
