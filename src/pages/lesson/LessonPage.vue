<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { extractUnderstandingChallenges } from '@/features/extract-understanding-challenges/extract-understanding-challenges'
import { extractExpressionChallenges } from '@/features/extract-expression-challenges/extract-expression-challenges'
import { generateLesson, type Lesson } from '@/features/generate-lesson/generateLesson'
import type { Gloss } from '@/dumb/types'

const route = useRoute()
const languageStore = useLanguageStore()

const situationId = computed(() => route.params.id as string)
const targetIso = computed(() => languageStore.targetIso ?? '')
const nativeIso = computed(() => languageStore.nativeIso)

const glosses = ref<Gloss[]>([])
const glossMap = computed(() => new Map(glosses.value.map(gloss => [gloss.key, gloss])))
const lesson = ref<Lesson | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const currentIndex = ref(0)
const isRevealed = ref(false)
const finalRevealed = ref(false)
const finalAttempt = ref('')

const glossFilePath = computed(() => (
  `/data/${situationId.value}_${targetIso.value}_${nativeIso.value}.jsonl`
))

const currentExercise = computed(() => {
  if (!lesson.value) return null
  return lesson.value.exerciseGlosses[currentIndex.value] ?? null
})

const exerciseTranslations = computed(() => {
  const gloss = currentExercise.value
  if (!gloss) return []
  return gloss.translations.map(key => glossMap.value.get(key)?.content ?? key)
})

const exercisesDone = computed(() =>
  Boolean(lesson.value && currentIndex.value >= lesson.value.exerciseGlosses.length)
)

const finalChallenge = computed(() => lesson.value?.finalChallengeGloss ?? null)
const finalChallengeTranslations = computed(() => {
  const gloss = finalChallenge.value
  if (!gloss) return []
  return gloss.translations.map(key => glossMap.value.get(key)?.content ?? key)
})

const loadLesson = () => {
  const understandingChallenges = extractUnderstandingChallenges(glosses.value, targetIso.value)
  const expressionChallenges = extractExpressionChallenges(glosses.value, nativeIso.value)
  lesson.value = generateLesson(glosses.value, understandingChallenges, expressionChallenges)
  currentIndex.value = 0
  isRevealed.value = false
  finalRevealed.value = false
  finalAttempt.value = ''
}

const revealCard = () => {
  isRevealed.value = true
}

const goToNextCard = () => {
  isRevealed.value = false
  currentIndex.value += 1
}

const revealFinal = () => {
  finalRevealed.value = true
}

onMounted(async () => {
  if (!targetIso.value) {
    error.value = 'Please select a target language first'
    isLoading.value = false
    return
  }

  try {
    glosses.value = await parseJsonl<Gloss>(glossFilePath.value)
    loadLesson()
  } catch (err) {
    console.error('Failed to load lesson data:', err)
    error.value = 'Could not load lesson data'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="flex justify-center py-6">
    <span class="loading loading-spinner loading-lg" />
  </div>

  <div v-else-if="error" class="alert alert-error">
    {{ error }}
  </div>

  <div v-else>
    <div v-if="!lesson || !lesson.exerciseGlosses.length" class="alert">
      No lesson available for this situation.
    </div>

    <div v-else>
      <div v-if="!exercisesDone">
        <div class="flex flex-col gap-2">
          <div class="card shadow-xl border w-full max-w-xl text-center p-4 my-4">
            <div class="card-body">
              <div class="text-4xl font-bold">
                {{ currentExercise?.content }}
              </div>
              <hr class="my-4" v-if="isRevealed">
              <div v-if="isRevealed" class="flex flex-col gap-2">
                <div v-for="translation in exerciseTranslations" class="text-4xl font-semibold">
                  {{  translation }}
                </div>
              </div>

            </div>
          </div>

          <button v-if="!isRevealed" class="btn btn-xl mx-auto" type="button" @click="revealCard">
            Reveal
          </button>
          <div v-else class="flex flex-wrap justify-center gap-2">
            <button class="btn" type="button" @click="goToNextCard">
              Wrong
            </button>
            <button class="btn" type="button" @click="goToNextCard">
              Hard
            </button>
            <button class="btn" type="button" @click="goToNextCard">
              Correct
            </button>
            <button class="btn" type="button" @click="goToNextCard">
              Easy
            </button>
          </div>
        </div>
      </div>

      <div v-if="exercisesDone">
        <h2 class="text-2xl font-bold mb-4">
          Final Challenge
        </h2>
        <div class="flex justify-center">
          <div class="card shadow w-full max-w-xl text-center">
            <div class="card-body">
              <div class="text-4xl font-bold mb-4">
                {{ finalChallenge?.content || 'No final challenge available' }}
              </div>
              <div v-if="finalChallenge">
                <div v-if="!finalRevealed">
                  <textarea v-model="finalAttempt" class="textarea textarea-bordered w-full mb-4" rows="4"
                    placeholder="Write your answer here" />
                  <button class="btn btn-primary" type="button" @click="revealFinal">
                    Reveal
                  </button>
                </div>
                <div v-else class="space-y-3">
                  <div class="text-light">Your attempt</div>
                  <div class="mb-3 whitespace-pre-line">{{ finalAttempt || 'No attempt' }}</div>
                  <div class="text-3xl font-semibold">
                    {{ finalChallengeTranslations.join(' / ') || 'None' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
