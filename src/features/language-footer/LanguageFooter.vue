<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useLanguageStore } from '@/entities/language'
import { parseJsonl } from '@/dumb/jsonl-utils'
import type { TargetLanguage } from '@/dumb/types'

const languageStore = useLanguageStore()
const targetLanguages = ref<TargetLanguage[]>([])
const nativeLanguages = ref<TargetLanguage[]>([])

onMounted(async () => {
  try {
    targetLanguages.value = await parseJsonl<TargetLanguage>('/data/target_languages.jsonl')
    nativeLanguages.value = await parseJsonl<TargetLanguage>('/data/native_languages.jsonl')
  } catch (error) {
    console.error('Failed to load language data:', error)
  }
})

const getNativeLanguageName = computed(() => {
  const lang = nativeLanguages.value.find(l => l.iso === languageStore.nativeIso)
  return lang ? `${lang.short} ${lang.name}` : languageStore.nativeIso
})

const getTargetLanguageName = computed(() => {
  if (!languageStore.targetIso) return 'Not set'
  const lang = targetLanguages.value.find(l => l.iso === languageStore.targetIso)
  return lang ? `${lang.short} ${lang.name}` : languageStore.targetIso
})
</script>

<template>
  <footer class="footer bg-base-200 p-4 mt-6">
    <div class="container mx-auto flex justify-between items-center">
      <div class="flex gap-6">
        <div>
          <span class="text-light">Native: </span>
          <span>{{ getNativeLanguageName }}</span>
        </div>
        <div>
          <span class="text-light">Target: </span>
          <span>{{ getTargetLanguageName }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
