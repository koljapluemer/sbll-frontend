import { defineStore } from 'pinia'
import { ref } from 'vue'

type ToastType = 'info' | 'success' | 'warning' | 'error'

export type Toast = {
  id: number
  message: string
  type: ToastType
}

const defaultDurationMs = 3500

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  const addToast = (message: string, type: ToastType = 'info', durationMs = defaultDurationMs) => {
    const id = nextId
    nextId += 1
    toasts.value.push({ id, message, type })

    window.setTimeout(() => removeToast(id), durationMs)
  }

  return {
    toasts,
    addToast,
    removeToast
  }
})
