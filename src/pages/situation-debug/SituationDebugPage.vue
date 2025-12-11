<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RotateCw, ArrowLeft } from 'lucide-vue-next'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { buildGlossIndex } from '@/entities/gloss/repository'
import type { Gloss, GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import type { SituationGoals, TaskContext } from '../situation-practice/types'
import { useDebugSimulation } from './useDebugSimulation'
import DebugTaskPreview from './DebugTaskPreview.vue'

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

const taskContext = computed<TaskContext>(() => ({
  nativeIso: languageStore.nativeIso,
  targetIso: languageStore.targetIso ?? ''
}))

const simulatedTasks = ref<ReturnType<typeof useDebugSimulation>['simulatedTasks']['value']>([])
const selectedMode = ref<ReturnType<typeof useDebugSimulation>['selectedMode']['value']>(null)
const selectedGoal = ref<ReturnType<typeof useDebugSimulation>['selectedGoal']['value']>(null)

let simulation: ReturnType<typeof useDebugSimulation> | null = null

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

    if (goals.value) {
      simulation = useDebugSimulation(goals.value, glossIndex.value, taskContext.value)
      simulation.runSimulation()
      simulatedTasks.value = simulation.simulatedTasks.value
      selectedMode.value = simulation.selectedMode.value
      selectedGoal.value = simulation.selectedGoal.value
    }
  } catch (error) {
    console.error('Failed to load debug data:', error)
  } finally {
    isLoading.value = false
  }
}

const handleRegenerate = () => {
  if (simulation) {
    simulation.regenerate()
    simulatedTasks.value = simulation.simulatedTasks.value
    selectedMode.value = simulation.selectedMode.value
    selectedGoal.value = simulation.selectedGoal.value
  }
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
        Debug: {{ situationId }}
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
      No practice goals found for this situation.
    </div>

    <div
      v-else
      class="flex flex-col gap-6"
    >
      <div class="card shadow">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-light">
                Mode
              </div>
              <div class="font-semibold">
                {{ selectedMode }}
              </div>
            </div>

            <button
              class="btn btn-primary gap-2"
              type="button"
              @click="handleRegenerate"
            >
              <RotateCw class="w-4 h-4" />
              Regenerate
            </button>
          </div>

          <div class="text-sm mt-2">
            <span class="text-light">Tasks generated:</span>
            <span class="ml-2 font-semibold">{{ simulatedTasks.length }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <DebugTaskPreview
          v-for="(task, index) in simulatedTasks"
          :key="task.id"
          :simulated-task="task"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>
