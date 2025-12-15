<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLanguageStore } from '@/entities/language'

type SituationCard = {
  id: string
  name: string
  hasImage: boolean
  goals?: {
    proceduralParaphraseGoals: string[]
    understandGoals: string[]
  }
}

const languageStore = useLanguageStore()

const situations = ref<SituationCard[]>([])
const loading = ref(false)

async function loadSituations() {
  const targetIso = languageStore.targetIso
  if (!targetIso) {
    situations.value = []
    return
  }

  const nativeIso = languageStore.nativeIso
  const basePath = `/data/situations/${nativeIso}/${targetIso}`

  try {
    loading.value = true

    // Load the situations.json file
    const response = await fetch(`${basePath}/situations.json`)
    if (!response.ok) {
      situations.value = []
      return
    }

    const situationsMap = await response.json() as Record<string, boolean>

    // Convert to array and sort
    const situationsList = Object.entries(situationsMap).map(([name, hasImage]) => ({
      id: name,
      name,
      hasImage
    })).sort((a, b) => a.name.localeCompare(b.name))

    situations.value = situationsList

    // Load individual situation files asynchronously
    loadSituationDetails(situationsList, basePath)
  } catch (error) {
    console.error('Failed to load situations:', error)
    situations.value = []
  } finally {
    loading.value = false
  }
}

async function loadSituationDetails(situationsList: SituationCard[], basePath: string) {
  for (const situation of situationsList) {
    try {
      const response = await fetch(`${basePath}/${situation.id}.json`)
      if (response.ok) {
        const data = await response.json()
        situation.goals = {
          proceduralParaphraseGoals: data['procedural-paraphrase-expression-goals'] || [],
          understandGoals: data['understand-expression-goals'] || []
        }
      }
    } catch (error) {
      console.error(`Failed to load details for ${situation.id}:`, error)
    }
  }
}

const hasSituations = computed(() => situations.value.length > 0)

// Watch for language changes and reload
watch([() => languageStore.nativeIso, () => languageStore.targetIso], () => {
  loadSituations()
}, { immediate: true })
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">
      Situations
    </h1>

    <div
      v-if="!languageStore.targetIso"
      class="alert alert-warning"
    >
      Please select a target language first.
    </div>

    <div
      v-else-if="loading"
      class="alert"
    >
      Loading situations...
    </div>

    <div
      v-else-if="!hasSituations"
      class="alert"
    >
      No situations found for {{ languageStore.nativeIso }} → {{ languageStore.targetIso }}.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto"
    >
      <RouterLink
        v-for="situation in situations"
        :key="situation.id"
        :to="{ name: 'situation-practice', params: { situationId: situation.id } }"
        :class="[
          'card',
          'shadow',
          'bg-white',
          'text-gray-700',
          'transition-hover',
          'hover:shadow-md',
          'cursor-pointer',
          situation.hasImage ? 'row-span-3' : 'row-span-2'
        ]"
      >
        <figure
          v-if="situation.hasImage"
          class="h-48"
        >
          <img
            :src="`/data/situations/${languageStore.nativeIso}/${languageStore.targetIso}/${situation.id}.webp`"
            :alt="situation.name"
            class="w-full h-full object-cover"
          >
        </figure>
        <div class="card-body gap-2 text-center">
          <h2 class="text-xl font-semibold">
            {{ situation.name }}
          </h2>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: perspective(1000px) rotateX(2deg) rotateY(-2deg);
}
</style>
