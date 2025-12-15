<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { buildGlossIndex } from '@/entities/gloss/repository'
import type { Gloss, GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import type { PracticeMode, SituationGoals } from '../situation-practice/types'

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()

const goals = ref<SituationGoals | null>(null)
const glossIndex = ref<GlossIndex>({})
const isLoading = ref(true)

const situationId = computed(() => String(route.params.situationId ?? ''))

const dataBasePath = computed(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return null
  const encodedId = encodeURIComponent(situationId.value)
  return `/data/situations/${languageStore.nativeIso}/${targetIso}/${encodedId}`
})

const proceduralGoals = computed(() => goals.value?.['procedural-paraphrase-expression-goals'] ?? [])
const understandGoals = computed(() => goals.value?.['understand-expression-goals'] ?? [])

const loadData = async () => {
  if (!dataBasePath.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const [goalResponse, glosses] = await Promise.all([
      fetch(`${dataBasePath.value}.json`).then(res => res.json() as Promise<SituationGoals>),
      parseJsonl<Gloss>(`${dataBasePath.value}.jsonl`)
    ])

    goals.value = goalResponse
    glossIndex.value = buildGlossIndex(glosses)
  } catch (error) {
    console.error('Failed to load goal selection data:', error)
  } finally {
    isLoading.value = false
  }
}

const selectGoal = (mode: PracticeMode, goalIndex: number) => {
  router.push({
    name: 'situation-debug-sim',
    params: {
      situationId: situationId.value,
      mode,
      goalIndex: String(goalIndex)
    }
  })
}

const getGlossDisplay = (glossRef: string) => {
  const gloss = glossIndex.value[glossRef]
  return gloss?.content ?? glossRef
}

watch(
  [() => route.params.situationId, () => languageStore.targetIso],
  loadData,
  { immediate: true }
)
</script>

<template>
  <div class="w-full max-w-4xl">
    <div class="flex items-center gap-4 mb-6">
      <button
        class="btn btn-circle btn-ghost"
        type="button"
        @click="router.push({ name: 'situations' })"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>

      <h1 class="text-3xl font-bold">
        Debug: {{ situationId }} - Select Goal
      </h1>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center py-6"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="!goals"
      class="alert alert-warning"
    >
      No goals found for this situation.
    </div>

    <div
      v-else
      class="flex flex-col gap-6"
    >
      <div
        v-if="proceduralGoals.length"
        class="flex flex-col gap-4"
      >
        <h2 class="text-2xl font-bold">
          Procedural Goals
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(goal, index) in proceduralGoals"
            :key="index"
            class="card border transition-hover hover:shadow-md cursor-pointer"
            @click="selectGoal('procedural', index)"
          >
            <div class="card-body">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary">{{ index + 1 }}</span>
                <span class="font-semibold">{{ getGlossDisplay(goal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="understandGoals.length"
        class="flex flex-col gap-4"
      >
        <h2 class="text-2xl font-bold">
          Understand Goals
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(goal, index) in understandGoals"
            :key="index"
            class="card border transition-hover hover:shadow-md cursor-pointer"
            @click="selectGoal('understand', index)"
          >
            <div class="card-body">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary">{{ index + 1 }}</span>
                <span class="font-semibold">{{ getGlossDisplay(goal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
