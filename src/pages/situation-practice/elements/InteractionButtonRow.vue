<script setup lang="ts">
import * as Icons from 'lucide-vue-next'

const props = defineProps<{
  icons: string[]
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

const handleClick = (icon: string) => emit('select', icon)
</script>

<template>
  <div class="flex gap-2 justify-center">
    <button
      v-for="icon in props.icons"
      :key="icon"
      class="btn btn-circle btn-outline btn-xl"
      type="button"
      @click="handleClick(icon)"
    >
      <component
        :is="(Icons as Record<string, unknown>)[icon] ?? Icons.HelpCircle"
        class="w-6 h-6"
      />
    </button>
  </div>
</template>
