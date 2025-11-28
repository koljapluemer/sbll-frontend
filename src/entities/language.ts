import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  const nativeIso = ref<string>('eng')
  const targetIso = ref<string | null>(null)

  const hasTargetLanguage = computed(() => targetIso.value !== null)

  const setTargetLanguage = (iso: string) => {
    targetIso.value = iso
  }

  return {
    nativeIso,
    targetIso,
    hasTargetLanguage,
    setTargetLanguage
  }
}, {
  persist: true
})
