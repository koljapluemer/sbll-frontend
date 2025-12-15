<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RotateCw, ArrowLeft, Copy } from 'lucide-vue-next'
import { parseJsonl } from '@/dumb/jsonl-utils'
import { buildGlossIndex } from '@/entities/gloss/repository'
import type { Gloss, GlossIndex } from '@/entities/gloss/types'
import { useLanguageStore } from '@/entities/language'
import type { PracticeMode, SituationGoals, TaskContext } from '../situation-practice/types'
import { useDebugSimulation } from './useDebugSimulation'
import DebugTaskPreview from './DebugTaskPreview.vue'

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()

const goals = ref<SituationGoals | null>(null)
const glossIndex = ref<GlossIndex>({})
const isLoading = ref(true)

const situationId = computed(() => String(route.params.situationId ?? ''))
const mode = computed(() => route.params.mode as PracticeMode)
const goalIndex = computed(() => Number(route.params.goalIndex))

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

let simulation: ReturnType<typeof useDebugSimulation> | null = null

const simulationLog = computed(() => {
  if (!simulatedTasks.value.length) return ''

  return simulatedTasks.value.map((task, index) => {
    const taskNum = task.glossRef ? `[Task ${index + 1}]` : '[Final]'
    const gloss = task.glossRef || (simulation?.goalRef ?? 'unknown')
    const result = task.simulatedResult === undefined
      ? 'undefined'
      : task.simulatedResult.toString()

    return `${taskNum} ${gloss} | ${task.taskType} | ${task.queueStateChange} | result: ${result}`
  }).join('\n')
})

const copyLogToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(simulationLog.value)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

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
      const goalArray = mode.value === 'procedural'
        ? goals.value['procedural-paraphrase-expression-goals']
        : goals.value['understand-expression-goals']

      const goal = goalArray?.[goalIndex.value]

      if (goal) {
        simulation = useDebugSimulation(glossIndex.value, taskContext.value, mode.value, goal)
        simulation.runSimulation()
        simulatedTasks.value = simulation.simulatedTasks.value
      }
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
  }
}

watch(
  [() => route.params.situationId, () => route.params.mode, () => route.params.goalIndex, () => languageStore.targetIso],
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
        @click="router.push({ name: 'situation-debug', params: { situationId } })"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>

      <h1 class="text-3xl font-bold">
        Debug: {{ situationId }} - {{ mode }} #{{ goalIndex + 1 }}
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
                {{ mode }}
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

      <div class="mt-8 flex flex-col gap-4">
        <h2 class="text-2xl font-bold">
          Simulation Log
        </h2>

        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-outline gap-2"
            type="button"
            @click="copyLogToClipboard"
          >
            <Copy class="w-4 h-4" />
            Copy to Clipboard
          </button>
        </div>

        <pre class="border border-base-300 rounded p-4 overflow-x-auto text-xs font-mono bg-base-200">{{ simulationLog }}</pre>
      </div>
    </div>
  </div>
</template>
