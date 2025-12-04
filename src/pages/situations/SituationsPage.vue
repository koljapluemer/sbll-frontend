<script setup lang="ts">
import { computed } from 'vue'
import { useLanguageStore } from '@/entities/language'

type SituationCard = {
  id: string
  name: string
}

const languageStore = useLanguageStore()

const situationFiles = import.meta.glob('../../../public/data/situations/**/*.json')

const situations = computed<SituationCard[]>(() => {
  const targetIso = languageStore.targetIso
  if (!targetIso) return []

  const nativeIso = languageStore.nativeIso
  const matchSegment = `/situations/${nativeIso}/${targetIso}/`

  return Object.keys(situationFiles)
    .filter(path => path.includes(matchSegment))
    .map(path => {
      const filename = path.split('/').pop() ?? ''
      const name = decodeURIComponent(filename.replace(/\.json$/i, ''))
      return { id: name, name }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

const hasSituations = computed(() => situations.value.length > 0)
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Situations</h1>

    <div v-if="!languageStore.targetIso" class="alert alert-warning">
      Please select a target language first.
    </div>

    <div
      v-else-if="!hasSituations"
      class="alert"
    >
      No situations found for {{ languageStore.nativeIso }} → {{ languageStore.targetIso }}.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="situation in situations"
        :key="situation.id"
        class="card shadow p-4 border"
      >
        <h2 class="text-xl font-semibold">
          {{ situation.name }}
        </h2>

        <RouterLink
          :to="{ name: 'situation-practice', params: { situationId: situation.id } }"
          class="btn btn-primary btn-sm mt-3 inline-flex items-center gap-2"
        >
          Practice
        </RouterLink>
      </div>
    </div>
  </div>
</template>
