<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { NormalizedGloss } from '@/entities/gloss/types'

const props = defineProps<{
  nativeGlossChallenge: NormalizedGloss
  translationExamples: NormalizedGloss[]
  targetLanguage: string
}>()

const router = useRouter()

const durationMs = 5000
const remainingMs = ref(durationMs)
const showReveal = ref(false)
const hasRevealed = ref(false)
const showDone = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null

const progressValue = computed(() => Math.max(0, Math.round((remainingMs.value / durationMs) * 100)))
const countdownLabel = computed(() => `${Math.ceil(remainingMs.value / 1000)}s`)

const startCountdown = () => {
  remainingMs.value = durationMs
  showReveal.value = false
  hasRevealed.value = false
  showDone.value = false

  if (timerId) clearInterval(timerId)

  timerId = setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)

    if (remainingMs.value <= 0) {
      showReveal.value = true
      if (timerId) {
        clearInterval(timerId)
        timerId = null
      }
    }
  }, 100)
}

const revealTranslations = () => {
  hasRevealed.value = true
  setTimeout(() => {
    showDone.value = true
  }, 100)
}

const goBack = () => {
  router.push({ name: 'situations' })
}

onMounted(startCountdown)
onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})

watch(
  () => props.nativeGlossChallenge.ref,
  () => {
    startCountdown()
  }
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <div class="badge badge-primary uppercase self-start">Challenge</div>
      <div class="text-3xl font-bold">
        How can you express this in {{ targetLanguage }}?
      </div>
      <div class="card shadow">
        <div class="card-body">
          <p class="card-title text-2xl">{{ nativeGlossChallenge.content }}</p>
        </div>
      </div>
    </div>

    <div v-if="!showReveal && !hasRevealed" class="flex justify-center py-4">
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

    <div v-else-if="showReveal && !hasRevealed" class="flex justify-center">
      <button class="btn btn-primary" @click="revealTranslations">
        Reveal
      </button>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="grid gap-3">
        <div
          v-for="translation in translationExamples"
          :key="translation.ref ?? translation.content"
          class="card shadow"
        >
          <div class="card-body">
            <div class="card-title">{{ translation.content }}</div>
            <div v-if="translation.language" class="badge badge-secondary self-start">
              {{ translation.language }}
            </div>
          </div>
        </div>

        <div v-if="translationExamples.length === 0" class="card shadow">
          <div class="card-body">
            <div class="card-title">No translations found yet.</div>
          </div>
        </div>
      </div>

      <div v-if="showDone" class="flex justify-end">
        <button class="btn btn-secondary" @click="goBack">
          Done
        </button>
      </div>
    </div>
  </div>
</template>
