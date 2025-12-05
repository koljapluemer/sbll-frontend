<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const durationMs = 5000
const remainingMs = ref(durationMs)
const phase = ref<'memorize' | 'recall'>('memorize')
const hasRevealed = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null

const progressValue = computed(() => Math.max(0, Math.round((remainingMs.value / durationMs) * 100)))
const countdownLabel = computed(() => `${Math.ceil(remainingMs.value / 1000)}s`)

const startTimer = () => {
  remainingMs.value = durationMs
  phase.value = 'memorize'
  hasRevealed.value = false

  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      phase.value = 'recall'
      clearInterval(timerId as ReturnType<typeof setInterval>)
      timerId = null
    }
  }, 100)
}

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

onMounted(startTimer)
onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})

watch(
  () => props.nativeGloss.ref ?? props.nativeGloss.content,
  () => {
    startTimer()
  }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <div class="badge badge-primary self-start">
        {{ phase === 'memorize' ? 'Memorize' : 'Recall' }}
      </div>
      <div class="text-2xl font-bold">
        {{ phase === 'memorize'
          ? `Try to memorize how to express this in ${targetLanguage}`
          : `Do you remember how to translate this into ${targetLanguage}?`
        }}
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

    <div v-if="phase === 'memorize'" class="grid gap-2">
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

    <div v-if="phase === 'memorize'" class="flex justify-center py-2">
      <div
        class="radial-progress text-primary"
        :style="{ '--value': progressValue }"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="progressValue"
      >
        {{ countdownLabel }}
      </div>
    </div>

    <div v-else>
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
  </div>
</template>
