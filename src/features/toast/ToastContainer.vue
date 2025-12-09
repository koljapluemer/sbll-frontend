<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-vue-next'
import { useToastStore } from './toastStore'

const toastStore = useToastStore()

const iconByType = {
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
  info: Info
}

const alertClassByType = {
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
  info: 'alert-info'
}

const toasts = computed(() => toastStore.toasts)
</script>

<template>
  <div class="toast toast-top toast-end z-50">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['alert shadow', alertClassByType[toast.type]]"
    >
      <component
        :is="iconByType[toast.type]"
        class="w-5 h-5"
      />
      <span>{{ toast.message }}</span>
      <button
        class="btn btn-ghost btn-xs"
        type="button"
        @click="toastStore.removeToast(toast.id)"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
