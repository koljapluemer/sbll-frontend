<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import type { Situation } from '@/dumb/types'

const router = useRouter()

const languageStore = useLanguageStore()
const situations = ref<Situation[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const situationsFilePath = computed(() => {
  const target = languageStore.targetIso
  const native = languageStore.nativeIso
  return `/data/situations_${target}_${native}.jsonl`
})

onMounted(async () => {
  if (!languageStore.targetIso) {
    error.value = 'Please select a target language first'
    isLoading.value = false
    return
  }

  try {
    situations.value = await parseJsonl<Situation>(situationsFilePath.value)
  } catch (err) {
    console.error('Failed to load situations:', err)
    error.value = 'Could not load situations'
  } finally {
    isLoading.value = false
  }
})

const goToDebugPage = (situationId: string) => {
  router.push(`/situations/${situationId}/debug`)
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Situations</h1>

    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="situation in situations"
        :key="situation.id"
        class="card shadow"
      >
        <figure>
          <img
            :src="situation.image_link"
            :alt="situation.native_description"
            class="w-full h-48 object-cover"
          />
        </figure>
        <div class="card-body">
          <h2 class="card-title">{{ situation.native_description }}</h2>
          <p class="text-light">{{ situation.target_description }}</p>
          <button
            @click="goToDebugPage(situation.id)"
            class="btn btn-sm mt-2"
          >
            Debug
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
