<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { useLanguageStore } from '@/entities/language'
import { getLastPracticedDate, getPracticeStats } from '@/entities/practice-tracking/usePracticeTracking'

type SituationCard = {
  id: string
  name: string
  hasImage: boolean
  goals?: {
    proceduralParaphraseGoals: string[]
    understandGoals: string[]
  }
  lastPracticed?: Date
  progressStats?: {
    platinum: number
    gold: number
    green: number
    grey: number
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

type GoalData = {
  finalChallenge: string
  needToBeLearned: string[]
}

type SituationGoalsData = {
  'procedural-paraphrase-expression-goals'?: GoalData[]
  'understand-expression-goals'?: GoalData[]
}

async function loadSituationDetails(situationsList: SituationCard[], basePath: string) {
  for (const situation of situationsList) {
    try {
      const response = await fetch(`${basePath}/${situation.id}.json`)
      if (response.ok) {
        const data = await response.json() as SituationGoalsData
        const proceduralGoals = (data['procedural-paraphrase-expression-goals'] || []).map((g) => g.finalChallenge)
        const understandGoals = (data['understand-expression-goals'] || []).map((g) => g.finalChallenge)

        situation.goals = {
          proceduralParaphraseGoals: proceduralGoals,
          understandGoals: understandGoals
        }

        // Compute practice tracking stats
        const lastPracticed = getLastPracticedDate(situation.id)
        if (lastPracticed) {
          situation.lastPracticed = lastPracticed

          // Get all goal identifiers
          const allGoalIdentifiers = [...proceduralGoals, ...understandGoals]
          situation.progressStats = getPracticeStats(allGoalIdentifiers)
        }
      }
    } catch (error) {
      console.error(`Failed to load details for ${situation.id}:`, error)
    }
  }
}

const hasSituations = computed(() => situations.value.length > 0)

function getProgressCircles(stats: { platinum: number, gold: number, green: number, grey: number }): Array<'platinum' | 'gold' | 'green' | 'grey'> {
  const total = stats.platinum + stats.gold + stats.green + stats.grey
  if (total === 0) return ['grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey']

  const circles: Array<'platinum' | 'gold' | 'green' | 'grey'> = []

  // Calculate percentages
  const platinumPct = stats.platinum / total
  const goldPct = stats.gold / total
  const greenPct = stats.green / total
  const greyPct = stats.grey / total

  // Friendly rounding: ensure at least one circle if any exist
  let platinumCircles = Math.round(platinumPct * 7)
  let goldCircles = Math.round(goldPct * 7)
  let greenCircles = Math.round(greenPct * 7)
  let greyCircles = Math.round(greyPct * 7)

  // Adjust to ensure we have exactly 7 circles
  let totalCircles = platinumCircles + goldCircles + greenCircles + greyCircles
  while (totalCircles < 7) {
    if (stats.grey > 0 && greyCircles < 7) greyCircles++
    else if (stats.green > 0 && greenCircles === 0) greenCircles++
    else if (stats.gold > 0 && goldCircles === 0) goldCircles++
    else if (stats.platinum > 0 && platinumCircles === 0) platinumCircles++
    else greyCircles++
    totalCircles = platinumCircles + goldCircles + greenCircles + greyCircles
  }
  while (totalCircles > 7) {
    if (greyCircles > 0) greyCircles--
    else if (greenCircles > 0) greenCircles--
    else if (goldCircles > 0) goldCircles--
    else if (platinumCircles > 0) platinumCircles--
    totalCircles = platinumCircles + goldCircles + greenCircles + greyCircles
  }

  // Build the circles array
  for (let i = 0; i < platinumCircles; i++) circles.push('platinum')
  for (let i = 0; i < goldCircles; i++) circles.push('gold')
  for (let i = 0; i < greenCircles; i++) circles.push('green')
  for (let i = 0; i < greyCircles; i++) circles.push('grey')

  return circles
}

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
          situation.hasImage && situation.lastPracticed ? 'row-span-4' :
          situation.hasImage && !situation.lastPracticed ? 'row-span-3' :
          !situation.hasImage && situation.lastPracticed ? 'row-span-3' :
          'row-span-2'
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

          <div
            v-if="situation.lastPracticed"
            class="badge badge-sm"
          >
            last practiced {{ formatDistanceToNow(situation.lastPracticed, { addSuffix: true }) }}
          </div>

          <div
            v-if="situation.progressStats"
            class="flex gap-1 justify-center mt-2"
          >
            <div
              v-for="(color, index) in getProgressCircles(situation.progressStats)"
              :key="index"
              :class="[
                'w-3 h-3 rounded-full',
                color === 'platinum' && 'bg-slate-300',
                color === 'gold' && 'bg-yellow-500',
                color === 'green' && 'bg-green-500',
                color === 'grey' && 'bg-gray-300'
              ]"
            />
          </div>
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
